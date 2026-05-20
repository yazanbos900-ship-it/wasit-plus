import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.wasit.plus',
  appName: 'Wasit Plus',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
};

export default config;
