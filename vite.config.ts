import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// GitHub Pages serves a project site under /<repo>/, so the production build
// needs that base. Local dev stays at the root. Change REPO if the repo is renamed.
const REPO = 'BE-A-PRO';

export default defineConfig(({ command }) => ({
  base: command === 'build' ? `/${REPO}/` : '/',
  plugins: [react()],
  // host:true exposes on the LAN; allowedHosts lets a tunnel domain
  // (cloudflared, ngrok) reach the dev server so it can be played on a phone
  server: { port: 5180, host: true, allowedHosts: true },
}));
