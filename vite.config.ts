import { defineConfig, Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

function localMeshRelayPlugin(): Plugin {
  const meshMessages: any[] = [];
  const reports: any[] = [];
  const sseClients: any[] = [];

  return {
    name: 'local-mesh-relay',
    configureServer(server) {
      server.middlewares.use((req: any, res: any, next: any) => {
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Requested-With');

        if (req.method === 'OPTIONS') {
          res.statusCode = 200;
          res.end();
          return;
        }

        const url = req.url || '';

        if (url.startsWith('/api/mesh/messages') && req.method === 'GET') {
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify(meshMessages));
          return;
        }

        if (url.startsWith('/api/mesh/broadcast') && req.method === 'POST') {
          let body = '';
          req.on('data', (chunk: any) => body += chunk);
          req.on('end', () => {
            try {
              const msg = JSON.parse(body);
              if (!meshMessages.some((m: any) => m.id === msg.id)) {
                meshMessages.unshift(msg);
                if (meshMessages.length > 200) meshMessages.pop();

                const eventPayload = `data: ${JSON.stringify({ type: 'MESH_MESSAGE', payload: msg })}\n\n`;
                sseClients.forEach((client: any) => {
                  try { client.write(eventPayload); } catch {}
                });
              }
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: true, count: meshMessages.length }));
            } catch (err: any) {
              res.statusCode = 400;
              res.end(JSON.stringify({ error: err.message }));
            }
          });
          return;
        }

        if (url.startsWith('/api/mesh/events')) {
          res.writeHead(200, {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
            'Access-Control-Allow-Origin': '*'
          });
          res.write(': connected\n\n');
          sseClients.push(res);
          req.on('close', () => {
            const idx = sseClients.indexOf(res);
            if (idx !== -1) sseClients.splice(idx, 1);
          });
          return;
        }

        if (url.startsWith('/api/mesh/reports') && req.method === 'GET') {
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify(reports));
          return;
        }

        if (url.startsWith('/api/mesh/reports') && req.method === 'POST') {
          let body = '';
          req.on('data', (chunk: any) => body += chunk);
          req.on('end', () => {
            try {
              const report = JSON.parse(body);
              const idx = reports.findIndex((r: any) => r.id === report.id);
              if (idx !== -1) {
                reports[idx] = report;
              } else {
                reports.unshift(report);
              }
              const eventPayload = `data: ${JSON.stringify({ type: 'REPORT_UPSERT', payload: report })}\n\n`;
              sseClients.forEach((client: any) => {
                try { client.write(eventPayload); } catch {}
              });
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: true }));
            } catch (err: any) {
              res.statusCode = 400;
              res.end(JSON.stringify({ error: err.message }));
            }
          });
          return;
        }

        next();
      });
    }
  };
}

export default defineConfig({
  plugins: [
    localMeshRelayPlugin(),
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'robots.txt'],
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/[a-c]\.tile\.openstreetmap\.org\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'osm-tiles',
              expiration: {
                maxEntries: 1000,
                maxAgeSeconds: 60 * 60 * 24 * 7 // 7 days
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            urlPattern: /^https:\/\/api\.open-meteo\.com\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'weather-api',
              networkTimeoutSeconds: 3,
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 30 // 30 minutes
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          }
        ]
      },
      manifest: {
        name: 'FloodGuard AI - Pune Operations',
        short_name: 'FloodGuard',
        description: 'Pune Flood Alert & Resilient Rerouting System',
        theme_color: '#00271d',
        background_color: '#f8faf9',
        display: 'standalone',
        orientation: 'portrait',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ],
  server: {
    port: 3000,
    host: true
  }
});
