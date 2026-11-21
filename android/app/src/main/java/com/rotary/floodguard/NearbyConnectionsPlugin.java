package com.rotary.floodguard;

import android.content.Context;
import android.os.Build;
import androidx.annotation.NonNull;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

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

@CapacitorPlugin(name = "NearbyConnections")
public class NearbyConnectionsPlugin extends Plugin {

    private static final String SERVICE_ID = "com.rotary.floodguard.mesh";
    private static final Strategy STRATEGY = Strategy.P2P_CLUSTER;

    private ConnectionsClient connectionsClient;
    private final Map<String, String> connectedEndpoints = new HashMap<>();
    private final Map<String, String> discoveredEndpoints = new HashMap<>();
    private boolean isAdvertising = false;
    private boolean isDiscovering = false;
    private String localEndpointName = "FloodGuard-Node-" + Build.MODEL;

    @Override
    public void load() {
        super.load();
        connectionsClient = Nearby.getConnectionsClient(getContext());
    }

    @PluginMethod
    public void isNearbySupported(PluginCall call) {
        JSObject ret = new JSObject();
        ret.put("supported", true);
        ret.put("platform", "android");
        ret.put("strategy", "P2P_CLUSTER");
        ret.put("serviceId", SERVICE_ID);
        call.resolve(ret);
    }

    @PluginMethod
    public void startMesh(PluginCall call) {
        String name = call.getString("endpointName");
        if (name != null && !name.trim().isEmpty()) {
            localEndpointName = name.trim();
        }

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
            ret.put("message", "No connected peers to receive payload directly");
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
        call.resolve(ret);
    }

    private void startAdvertisingInternal() {
        AdvertisingOptions options = new AdvertisingOptions.Builder().setStrategy(STRATEGY).build();

        connectionsClient.startAdvertising(localEndpointName, SERVICE_ID, connectionLifecycleCallback, options)
            .addOnSuccessListener(aVoid -> {
                isAdvertising = true;
                notifyStatusChange("advertising_started");
            })
            .addOnFailureListener(e -> {
                isAdvertising = false;
                notifyStatusChange("advertising_failed: " + e.getMessage());
            });
    }

    private void startDiscoveryInternal() {
        DiscoveryOptions options = new DiscoveryOptions.Builder().setStrategy(STRATEGY).build();

        connectionsClient.startDiscovery(SERVICE_ID, endpointDiscoveryCallback, options)
            .addOnSuccessListener(aVoid -> {
                isDiscovering = true;
                notifyStatusChange("discovery_started");
            })
            .addOnFailureListener(e -> {
                isDiscovering = false;
                notifyStatusChange("discovery_failed: " + e.getMessage());
            });
    }

    private void stopMeshInternal() {
        if (connectionsClient != null) {
            connectionsClient.stopAdvertising();
            connectionsClient.stopDiscovery();
            connectionsClient.stopAllEndpoints();
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

            // Auto-connect to form seamless zero-click ad-hoc mesh network
            connectionsClient.requestConnection(localEndpointName, endpointId, connectionLifecycleCallback)
                .addOnFailureListener(e -> notifyStatusChange("connect_request_failed: " + e.getMessage()));
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

            // Auto-accept connection for zero-friction disaster mesh relay
            connectionsClient.acceptConnection(endpointId, payloadCallback);

            JSObject data = new JSObject();
            data.put("endpointId", endpointId);
            data.put("name", info.getEndpointName());
            data.put("authCode", info.getAuthenticationDigits());
            notifyListeners("onConnectionInitiated", data);
        }

        @Override
        public void onConnectionResult(@NonNull String endpointId, @NonNull ConnectionResolution resolution) {
            boolean success = resolution.getStatus().getStatusCode() == ConnectionsStatusCodes.STATUS_OK;
            if (success) {
                String name = discoveredEndpoints.getOrDefault(endpointId, "Nearby Peer");
                connectedEndpoints.put(endpointId, name);
            }

            JSObject data = new JSObject();
            data.put("endpointId", endpointId);
            data.put("status", success ? "CONNECTED" : "FAILED");
            data.put("statusCode", resolution.getStatus().getStatusCode());
            notifyListeners("onConnectionResult", data);
        }

        @Override
        public void onDisconnected(@NonNull String endpointId) {
            connectedEndpoints.remove(endpointId);
            discoveredEndpoints.remove(endpointId);

            JSObject data = new JSObject();
            data.put("endpointId", endpointId);
            notifyListeners("onDisconnected", data);
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
            // Optional progress tracking
        }
    };

    private void notifyStatusChange(String status) {
        JSObject data = new JSObject();
        data.put("status", status);
        data.put("timestamp", System.currentTimeMillis());
        notifyListeners("onStatusChange", data);
    }
}
