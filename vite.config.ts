import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  server: { host: true, port: 8080 },
  build: { target: 'es2020' },
  // Use React 17+ automatic JSX runtime (matches tsconfig "jsx": "react-jsx").
  // Without this, plain Vite/esbuild emits the classic React.createElement transform,
  // which throws "React is not defined" in the 13 tsx files that don't import React.
  esbuild: { jsx: 'automatic', jsxImportSource: 'react' },
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.png', 'icons/*.png', 'fonts/*.woff2'],
      manifest: {
        name: 'Rasa Vendor',
        short_name: 'Rasa',
        description: 'Rasa Vendor — food-truck point-of-sale & operations dashboard',
        theme_color: '#7D1535',
        background_color: '#2A1B22',
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
});
