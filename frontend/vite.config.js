import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Backend proxy target is overridable so the Playwright e2e stack (mode "e2e") talks to the
  // isolated backend on :8001 / database land_records_e2e instead of the main backend.
  const env = loadEnv(mode, process.cwd(), '')
  const apiTarget = env.VITE_API_PROXY_TARGET || 'http://localhost:8000'

  return {
    plugins: [
      react(),
      tailwindcss(),
    ],
    server: {
      port: 5173,
      allowedHosts: [
        'justa-unmarring-lorina.ngrok-free.dev',
        '.ngrok-free.dev',
        '.ngrok.io'
      ],
      proxy: {
        '/api': {
          target: apiTarget,
          changeOrigin: true,
          secure: false,
        }
      }
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules/react/') || id.includes('node_modules/react-dom/')) {
              return 'vendor-react';
            }
            if (id.includes('node_modules/leaflet') || id.includes('node_modules/react-leaflet')) {
              return 'vendor-leaflet';
            }
            if (id.includes('node_modules/lucide-react')) {
              return 'vendor-icons';
            }
          }
        }
      }
    }
  }
})
