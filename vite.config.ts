import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg'],
      manifest: {
        name: 'M32 Playground — Mehrdad32 Arcade',
        short_name: 'M32 Play',
        description: 'Fast, offline-friendly browser arcade by Mehrdad32.',
        theme_color: '#07090d',
        background_color: '#07090d',
        display: 'standalone',
        start_url: '/',
        icons: [{ src: '/favicon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any maskable' }]
      },
      workbox: {
        globPatterns: ['**/*.{html,js,css,svg,woff,woff2,png}'],
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api\//]
      }
    })
  ],
  test: { environment: 'node', include: ['src/**/*.test.ts'] }
});
