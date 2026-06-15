import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [react()],
    resolve: {
      alias: {
        cesium: path.resolve(__dirname, 'node_modules/cesium')
      }
    },
    define: {
      CESIUM_BASE_URL: JSON.stringify('/cesium'),
      'process.env.NEXT_PUBLIC_API_URL': JSON.stringify(
        env.NEXT_PUBLIC_API_URL || env.VITE_API_URL || ''
      ),
    },
    server: {
      fs: {
        allow: ['..']
      }
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            cesium: ['cesium']
          }
        }
      }
    }
  }
})
