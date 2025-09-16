import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true,
    strictPort: true,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false
      }
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          // Separar React y dependencias principales
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          // Separar librerías de gráficos
          'charts-vendor': ['echarts', '@kbox-labs/react-echarts'],
          // Separar librerías de mapas
          'maps-vendor': ['leaflet', 'react-leaflet', 'maplibre-gl', '@turf/turf'],
          // Separar librerías de utilidades
          'utils-vendor': ['xlsx', 'use-supercluster'],
          // Separar componentes grandes
          'vigencias-table': ['./src/components/VigenciasTable.tsx']
        },
        assetFileNames: 'assets/[name].[hash][extname]',
        chunkFileNames: 'assets/[name].[hash].js',
        entryFileNames: 'assets/[name].[hash].js'
      }
    },
    target: 'es2015',
    minify: 'esbuild',
    chunkSizeWarningLimit: 1000
  },
  base: '/',
  optimizeDeps: {
    include: ['react', 'react-dom']
  }
})
