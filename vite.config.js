import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg', 'vite.svg'],
      manifest: {
        name: 'AVTOINSTRUKTOR ZOR 777',
        short_name: 'AVTO 777',
        description: 'Avtomobil haydash nazariy imtihoniga tayyorgarlik - AVTOINSTRUKTOR ZOR 777',
        theme_color: '#6366f1',
        background_color: '#020617',
        display: 'standalone',
        orientation: 'portrait-primary',
        start_url: '/',
        icons: [
          {
            src: 'icon-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable'
          },
          {
            src: 'icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ],
        categories: ["education", "utilities"],
        lang: "uz"
      },
      devOptions: {
        enabled: true,
        type: 'module',
      },
    })
  ],
  server: {
    allowedHosts: ["elvera-intersocietal-charissa.ngrok-free.dev"],
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
