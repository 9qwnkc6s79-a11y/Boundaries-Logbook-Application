import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.danielkeene.brewshift',
  appName: 'Brewshift',
  webDir: 'dist',
  ios: {
    scheme: 'Brewshift',
    contentInset: 'automatic'
  },
  android: {
    allowMixedContent: true
  },
  server: {
    androidScheme: 'https',
    iosScheme: 'https'
  }
};

export default config;
