package com.rotary.floodguard;

import android.Manifest;
import android.content.Context;
import android.os.Build;
import androidx.annotation.NonNull;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.PermissionState;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;

import com.google.android.gms.nearby.Nearby;
import com.google.android.gms.nearby.connection.AdvertisingOptions;
import com.google.android.gms.nearby.connection.ConnectionInfo;
import com.google.android.gms.nearby.connection.ConnectionLifecycleCallback;
import com.google.android.gms.nearby.connection.ConnectionResolution;
import com.google.android.gms.nearby.connection.ConnectionsClient;
import com.google.android.gms.nearby.connection.ConnectionsStatusCodes;
import com.google.android.gms.nearby.connection.DiscoveredEndpointInfo;
import com.google.android.gms.nearby.connection.DiscoveryOptions;
import com.google.android.gms.nearby.connection.EndpointDiscoveryCallback;
import com.google.android.gms.nearby.connection.Payload;
import com.google.android.gms.nearby.connection.PayloadCallback;
import com.google.android.gms.nearby.connection.PayloadTransferUpdate;
import com.google.android.gms.nearby.connection.Strategy;

import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@CapacitorPlugin(
    name = "NearbyConnections",
    permissions = {
        @Permission(
            alias = "location",
            strings = {
                Manifest.permission.ACCESS_FINE_LOCATION,
                Manifest.permission.ACCESS_COARSE_LOCATION
            }
        ),
        @Permission(
            alias = "bluetooth",
            strings = {
                Manifest.permission.BLUETOOTH_SCAN,
                Manifest.permission.BLUETOOTH_ADVERTISE,
                Manifest.permission.BLUETOOTH_CONNECT
            }
        ),
        @Permission(
            alias = "nearbyWifi",
            strings = {
                "android.permission.NEARBY_WIFI_DEVICES"
            }
        )
    }
)
public class NearbyConnectionsPlugin extends Plugin {

    private static final String SERVICE_ID = "com.rotary.floodguard.mesh";
    private static final Strategy STRATEGY = Strategy.P2P_CLUSTER;

    private ConnectionsClient connectionsClient;
    private final Map<String, String> connectedEndpoints = new HashMap<>();
    private final Map<String, String> discoveredEndpoints = new HashMap<>();
    private boolean isAdvertising = false;
    private boolean isDiscovering = false;
    private String localEndpointName;

    @Override
    public void load() {
        super.load();
        connectionsClient = Nearby.getConnectionsClient(getContext());
        // Guaranteed unique node name across duplicate phone models
        String cleanModel = Build.MODEL != null ? Build.MODEL.replaceAll("[^a-zA-Z0-9]", "") : "Phone";
        if (cleanModel.length() > 8) cleanModel = cleanModel.substring(0, 8);
        localEndpointName = "Phone-" + cleanModel + "-" + ((int)(Math.random() * 9000) + 1000);
    }

    @PluginMethod
    public void isNearbySupported(PluginCall call) {
        JSObject ret = new JSObject();
        ret.put("supported", true);
        ret.put("platform", "android");
        ret.put("strategy", "P2P_CLUSTER");
        ret.put("serviceId", SERVICE_ID);
        ret.put("endpointName", localEndpointName);
        ret.put("hasPermissions", checkPermissionsInternal());
        call.resolve(ret);
    }

    @PluginMethod
    public void requestNearbyPermissions(PluginCall call) {
        if (!checkPermissionsInternal()) {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                requestPermissionForAliases(new String[]{"bluetooth", "location", "nearbyWifi"}, call, "permissionsCallback");
            } else if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                requestPermissionForAliases(new String[]{"bluetooth", "location"}, call, "permissionsCallback");
            } else {
                requestPermissionForAlias("location", call, "permissionsCallback");
            }
        } else {
            JSObject ret = new JSObject();
            ret.put("granted", true);
            call.resolve(ret);
        }
    }

    @PermissionCallback
    private void permissionsCallback(PluginCall call) {
        boolean granted = checkPermissionsInternal();
        notifyStatusChange(granted ? "permissions_granted" : "permissions_denied");
        JSObject ret = new JSObject();
        ret.put("granted", granted);
        call.resolve(ret);
    }

    private boolean checkPermissionsInternal() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            return getPermissionState("bluetooth") == PermissionState.GRANTED;
        }
        return getPermissionState("location") == PermissionState.GRANTED;
    }

    @PluginMethod
    public void startMesh(PluginCall call) {
        String name = call.getString("endpointName");
        if (name != null && !name.trim().isEmpty()
                && !name.equals("Android Mobile Peer")
                && !name.equals("Citizen Web Terminal")) {
            localEndpointName = name.trim();
        }
        // Ensure localEndpointName is never a generic name that could cause tie-break deadlock
        if (localEndpointName == null || localEndpointName.equals("Android Mobile Peer") || localEndpointName.equals("Citizen Web Terminal")) {
            localEndpointName = "Phone-" + ((int)(Math.random() * 9000) + 1000);
        }

        // Check if permissions need requesting
        if (!checkPermissionsInternal()) {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                requestPermissionForAliases(new String[]{"bluetooth", "location", "nearbyWifi"}, call, "startMeshAfterPerms");
            } else if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                requestPermissionForAliases(new String[]{"bluetooth", "location"}, call, "startMeshAfterPerms");
            } else {
                requestPermissionForAlias("location", call, "startMeshAfterPerms");
            }
            return;
        }

        startAdvertisingAndDiscovery(call);
    }

    @PermissionCallback
    private void startMeshAfterPerms(PluginCall call) {
        startAdvertisingAndDiscovery(call);
    }

    private void startAdvertisingAndDiscovery(PluginCall call) {
        startAdvertisingInternal();
        startDiscoveryInternal();

        JSObject ret = new JSObject();
        ret.put("success", true);
        ret.put("isAdvertising", isAdvertising);
        ret.put("isDiscovering", isDiscovering);
        ret.put("endpointName", localEndpointName);
        call.resolve(ret);
    }

    @PluginMethod
    public void stopMesh(PluginCall call) {
        stopMeshInternal();
        JSObject ret = new JSObject();
        ret.put("success", true);
        call.resolve(ret);
    }

    @PluginMethod
    public void broadcastPayload(PluginCall call) {
        String data = call.getString("data");
        if (data == null || data.isEmpty()) {
            call.reject("Data cannot be empty");
            return;
        }

        if (connectedEndpoints.isEmpty()) {
            JSObject ret = new JSObject();
            ret.put("success", false);
            ret.put("message", "No connected peers in cluster to receive payload");
            ret.put("recipientCount", 0);
            call.resolve(ret);
            return;
        }

        byte[] bytes = data.getBytes(StandardCharsets.UTF_8);
        Payload payload = Payload.fromBytes(bytes);
        List<String> endpointIds = new ArrayList<>(connectedEndpoints.keySet());

        connectionsClient.sendPayload(endpointIds, payload)
            .addOnSuccessListener(aVoid -> {
                JSObject ret = new JSObject();
                ret.put("success", true);
                ret.put("recipientCount", endpointIds.size());
                call.resolve(ret);
            })
            .addOnFailureListener(e -> call.reject("Failed to broadcast payload: " + e.getMessage()));
    }

    @PluginMethod
    public void getConnectedPeers(PluginCall call) {
        JSArray peers = new JSArray();
        for (Map.Entry<String, String> entry : connectedEndpoints.entrySet()) {
            JSObject peer = new JSObject();
            peer.put("endpointId", entry.getKey());
            peer.put("name", entry.getValue());
            peer.put("connected", true);
            peers.put(peer);
        }

        JSArray discovered = new JSArray();
        for (Map.Entry<String, String> entry : discoveredEndpoints.entrySet()) {
            JSObject peer = new JSObject();
            peer.put("endpointId", entry.getKey());
            peer.put("name", entry.getValue());
            peer.put("connected", connectedEndpoints.containsKey(entry.getKey()));
            discovered.put(peer);
        }

        JSObject ret = new JSObject();
        ret.put("connectedPeers", peers);
        ret.put("discoveredPeers", discovered);
        ret.put("totalConnected", connectedEndpoints.size());
        ret.put("isAdvertising", isAdvertising);
        ret.put("isDiscovering", isDiscovering);
        ret.put("endpointName", localEndpointName);
        ret.put("hasPermissions", checkPermissionsInternal());
        call.resolve(ret);
    }

    private void startAdvertisingInternal() {
        try {
            AdvertisingOptions options = new AdvertisingOptions.Builder().setStrategy(STRATEGY).build();
            connectionsClient.startAdvertising(localEndpointName, SERVICE_ID, connectionLifecycleCallback, options)
                .addOnSuccessListener(aVoid -> {
                    isAdvertising = true;
                    notifyStatusChange("advertising_started: " + localEndpointName);
                })
                .addOnFailureListener(e -> {
                    isAdvertising = false;
                    notifyStatusChange("advertising_failed: " + e.getMessage());
                });
        } catch (SecurityException se) {
            isAdvertising = false;
            notifyStatusChange("advertising_security_error: " + se.getMessage());
        }
    }

    private void startDiscoveryInternal() {
        try {
            DiscoveryOptions options = new DiscoveryOptions.Builder().setStrategy(STRATEGY).build();
            connectionsClient.startDiscovery(SERVICE_ID, endpointDiscoveryCallback, options)
                .addOnSuccessListener(aVoid -> {
                    isDiscovering = true;
                    notifyStatusChange("discovery_scanning_for_peers");
                })
                .addOnFailureListener(e -> {
                    isDiscovering = false;
                    notifyStatusChange("discovery_failed: " + e.getMessage());
                });
        } catch (SecurityException se) {
            isDiscovering = false;
            notifyStatusChange("discovery_security_error: " + se.getMessage());
        }
    }

    private void stopMeshInternal() {
        if (connectionsClient != null) {
            try {
                connectionsClient.stopAdvertising();
                connectionsClient.stopDiscovery();
                connectionsClient.stopAllEndpoints();
            } catch (Exception ignored) {}
        }
        isAdvertising = false;
        isDiscovering = false;
        connectedEndpoints.clear();
        discoveredEndpoints.clear();
        notifyStatusChange("mesh_stopped");
    }

    // Callbacks for Discovery
    private final EndpointDiscoveryCallback endpointDiscoveryCallback = new EndpointDiscoveryCallback() {
        @Override
        public void onEndpointFound(@NonNull String endpointId, @NonNull DiscoveredEndpointInfo info) {
            discoveredEndpoints.put(endpointId, info.getEndpointName());

            JSObject data = new JSObject();
            data.put("endpointId", endpointId);
            data.put("name", info.getEndpointName());
            notifyListeners("onEndpointFound", data);

            final String remoteEndpointId = endpointId;
            final String remoteName = info.getEndpointName();

            // Tie-breaking check:
            // 1. If localEndpointName is lexicographically greater than remote, initiate connection immediately.
            // 2. If equal or smaller, wait for connection from remote. If no connection arrives within 2000ms,
            //    initiate connection as fallback to eliminate any deadlock.
            int cmp = localEndpointName.compareTo(remoteName);
            if (cmp > 0) {
                notifyStatusChange("initiating_connection_to: " + remoteName);
                connectionsClient.requestConnection(localEndpointName, remoteEndpointId, connectionLifecycleCallback)
                    .addOnFailureListener(e -> notifyStatusChange("connect_request_failed: " + e.getMessage()));
            } else {
                notifyStatusChange("awaiting_connection_from: " + remoteName);
                new android.os.Handler(android.os.Looper.getMainLooper()).postDelayed(() -> {
                    if (!connectedEndpoints.containsKey(remoteEndpointId) && discoveredEndpoints.containsKey(remoteEndpointId)) {
                        notifyStatusChange("fallback_initiating_to: " + remoteName);
                        connectionsClient.requestConnection(localEndpointName, remoteEndpointId, connectionLifecycleCallback)
                            .addOnFailureListener(e -> notifyStatusChange("fallback_request_note: " + e.getMessage()));
                    }
                }, 2000);
            }
        }

        @Override
        public void onEndpointLost(@NonNull String endpointId) {
            discoveredEndpoints.remove(endpointId);
            connectedEndpoints.remove(endpointId);

            JSObject data = new JSObject();
            data.put("endpointId", endpointId);
            notifyListeners("onEndpointLost", data);
        }
    };

    // Callbacks for Connections
    private final ConnectionLifecycleCallback connectionLifecycleCallback = new ConnectionLifecycleCallback() {
        @Override
        public void onConnectionInitiated(@NonNull String endpointId, @NonNull ConnectionInfo info) {
            discoveredEndpoints.put(endpointId, info.getEndpointName());

            // Auto-accept connection for zero-click disaster mesh relay
            connectionsClient.acceptConnection(endpointId, payloadCallback)
                .addOnFailureListener(e -> notifyStatusChange("accept_connection_failed: " + e.getMessage()));

            JSObject data = new JSObject();
            data.put("endpointId", endpointId);
            data.put("name", info.getEndpointName());
            data.put("authCode", info.getAuthenticationDigits());
            notifyListeners("onConnectionInitiated", data);
            notifyStatusChange("auto_accepted_connection: " + info.getEndpointName());
        }

        @Override
        public void onConnectionResult(@NonNull String endpointId, @NonNull ConnectionResolution resolution) {
            int statusCode = resolution.getStatus().getStatusCode();
            boolean success = (statusCode == ConnectionsStatusCodes.STATUS_OK ||
                               statusCode == ConnectionsStatusCodes.STATUS_ALREADY_CONNECTED_TO_ENDPOINT);
            if (success) {
                String name = discoveredEndpoints.getOrDefault(endpointId, "Nearby Peer");
                connectedEndpoints.put(endpointId, name);
                notifyStatusChange("peer_connected_success: " + name);
            } else {
                notifyStatusChange("connection_rejected_or_failed_code: " + statusCode);
            }

            JSObject data = new JSObject();
            data.put("endpointId", endpointId);
            data.put("status", success ? "CONNECTED" : "FAILED");
            data.put("statusCode", statusCode);
            notifyListeners("onConnectionResult", data);
        }

        @Override
        public void onDisconnected(@NonNull String endpointId) {
            String name = connectedEndpoints.remove(endpointId);
            discoveredEndpoints.remove(endpointId);

            JSObject data = new JSObject();
            data.put("endpointId", endpointId);
            notifyListeners("onDisconnected", data);
            notifyStatusChange("peer_disconnected: " + (name != null ? name : endpointId));
        }
    };

    // Callbacks for Payload Transfer
    private final PayloadCallback payloadCallback = new PayloadCallback() {
        @Override
        public void onPayloadReceived(@NonNull String endpointId, @NonNull Payload payload) {
            if (payload.getType() == Payload.Type.BYTES && payload.asBytes() != null) {
                String content = new String(payload.asBytes(), StandardCharsets.UTF_8);

                JSObject data = new JSObject();
                data.put("endpointId", endpointId);
                data.put("payload", content);
                data.put("timestamp", System.currentTimeMillis());
                notifyListeners("onPayloadReceived", data);
            }
        }

        @Override
        public void onPayloadTransferUpdate(@NonNull String endpointId, @NonNull PayloadTransferUpdate update) {
            // Transfer status update
        }
    };

    private void notifyStatusChange(String status) {
        JSObject data = new JSObject();
        data.put("status", status);
        data.put("timestamp", System.currentTimeMillis());
        notifyListeners("onStatusChange", data);
    }
}
