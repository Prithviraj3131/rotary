import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.rotary.floodguard',
  appName: 'FloodGuard AI',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
};

export default config;
