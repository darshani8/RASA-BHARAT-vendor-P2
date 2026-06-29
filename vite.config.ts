import { defineConfig, loadEnv } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const apiBase = env.VITE_API_BASE || 'http://localhost:3000/api/v1';

  return {
  server: { host: true, port: 8080 },
  build: { target: 'es2020' },
  // Expose __API_BASE__ to the bundled code (src/api.js uses it as a fallback).
  // The embedded Component reads window.__API_BASE__ which main.ts sets at runtime.
  define: { __API_BASE__: JSON.stringify(apiBase) },
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.png', 'icons/*.png', 'fonts/*.woff2'],
      manifest: {
        name: 'Zenith Retail Cloud',
        short_name: 'Zenith',
        description: 'Zenith Retail Cloud — vendor point-of-sale & operations dashboard',
        theme_color: '#0E1116',
        background_color: '#0E1116',
        display: 'standalone',
        orientation: 'any',
        // Relative so the installed PWA opens at the deploy base (works under /<repo>/ on Pages).
        start_url: '.',
        scope: '.',
        icons: [
          { src: 'icons/Icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/Icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icons/Icon-maskable-192.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
          { src: 'icons/Icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,woff2,png,svg}'],
        maximumFileSizeToCacheInBytes: 6 * 1024 * 1024,
      },
    }),
  ],
  };
});
