import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        // Define the entry points for your extension
        popup: 'index.html',
        background: 'src/background.js',
        content: 'src/content.js',
      },
      output: {
        // Ensure static file names for the manifest
        entryFileNames: `src/[name].js`,
        chunkFileNames: `src/[name].js`,
        assetFileNames: `assets/[name].[ext]`,
      },
    },
  },
})