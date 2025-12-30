import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  base: './',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
      manifestFilename: 'manifest.json',
      devOptions: {
        enabled: true
      },
      manifest: {
        name: 'Southwall Security',
        short_name: 'Southwall',
        description: 'Comprehensive employee onboarding and management system for Southwall Security',
        theme_color: '#0d2818',
        background_color: '#0f1f0f',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        icons: [
          {
            "src": "/icons/icon-72x72.png",
            "sizes": "72x72",
            "type": "image/png",
            "purpose": "any maskable"
          },
          {
            "src": "/icons/icon-96x96.png",
            "sizes": "96x96",
            "type": "image/png",
            "purpose": "any maskable"
          },
          {
            "src": "/icons/icon-128x128.png",
            "sizes": "128x128",
            "type": "image/png",
            "purpose": "any maskable"
          },
          {
            "src": "/icons/icon-144x144.png",
            "sizes": "144x144",
            "type": "image/png",
            "purpose": "any maskable"
          },
          {
            "src": "/icons/icon-152x152.png",
            "sizes": "152x152",
            "type": "image/png",
            "purpose": "any maskable"
          },
          {
            "src": "/icons/icon-192x192.png",
            "sizes": "192x192",
            "type": "image/png",
            "purpose": "any maskable"
          },
          {
            "src": "/icons/icon-384x384.png",
            "sizes": "384x384",
            "type": "image/png",
            "purpose": "any maskable"
          },
          {
            "src": "/icons/icon-512x512.png",
            "sizes": "512x512",
            "type": "image/png",
            "purpose": "any maskable"
          }
        ]
      }
    })
  ],



  resolve: {
    alias: {
      '@/services': path.resolve(__dirname, './services'),
      '@/components': path.resolve(__dirname, './components'),
      '@/hooks': path.resolve(__dirname, './hooks'),
      '@/store': path.resolve(__dirname, './store'),
      '@/utils': path.resolve(__dirname, './utils'),
      '@/types': path.resolve(__dirname, './types'),
    },
  },
  server: {
    // Proxy /api requests to the Node.js server running on port 3000
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
        // Rewrite the path to remove /api if the backend doesn't expect it
        // rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
    // Configure the file watcher.  Without an ignore list Vite watches the entire
    // project directory, so events such as downloading or opening files in external
    // directories can trigger an unnecessary full reload.  Ignoring these patterns
    // prevents unwanted reloads when you download PDFs or other files during
    // development.
    watch: {
      ignored: [
        '**/node_modules/**',
        '**/.git/**',
        '**/tmp/**',
        '**/Downloads/**',
        '**/.DS_Store/**',
      ],
    },
  },
});