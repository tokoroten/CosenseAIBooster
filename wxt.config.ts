import { defineConfig } from 'wxt';
import react from '@vitejs/plugin-react';
import tailwindcss from 'tailwindcss';
import autoprefixer from 'autoprefixer';

export default defineConfig({
  manifest: {
    name: 'Cosense AI Booster',
    description: 'AI assistant for Cosense (formerly Scrapbox)',
    version: '0.1.0',
    permissions: ['storage', 'contextMenus'],
    host_permissions: ['*://scrapbox.io/*', '*://cosen.se/*', 'https://api.openai.com/*'],
    web_accessible_resources: [
      {
        resources: ['assets/*'],
        matches: ['*://scrapbox.io/*', '*://cosen.se/*']
      }
    ],
  },
  vite: () => ({
    plugins: [react()],
    css: {
      postcss: {
        plugins: [tailwindcss, autoprefixer],
      },
    },
    resolve: {
      alias: {
        '@': '/',
      },
    },
  }),
});
