import { defineConfig } from 'wxt';
import react from '@vitejs/plugin-react';
import { execSync } from 'child_process';
import packageJson from './package.json';

// Git ハッシュ値を取得（ない場合は 'dev' を使用）
let gitCommitHash = 'dev';
try {
  gitCommitHash = execSync('git rev-parse --short HEAD').toString().trim();
} catch (e) {
  console.warn('Failed to get git hash:', e);
}

export default defineConfig({
  srcDir: 'src',
  manifest: {
    name: 'Cosense AI Booster',
    description: 'AI assistant for Cosense (formerly Scrapbox)',
    version: packageJson.version,
    permissions: ['storage', 'contextMenus'],
    host_permissions: ['*://scrapbox.io/*', '*://cosen.se/*', 'https://api.openai.com/*'],
    web_accessible_resources: [
      {
        resources: ['assets/*'],
        matches: ['*://scrapbox.io/*', '*://cosen.se/*'],
      },
    ],
  },
  vite: () => ({
    plugins: [react()],
    define: {
      'process.env.VITE_APP_VERSION': JSON.stringify(packageJson.version),
      'process.env.VITE_GIT_HASH': JSON.stringify(gitCommitHash),
    },
  }),
});
