import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.gerardrius.tincagenda',
  appName: 'Tinc Agenda',
  webDir: 'dist',
  server: {
    url: 'https://tinc-agenda.vercel.app',
    cleartext: false
  }
};

export default config;
