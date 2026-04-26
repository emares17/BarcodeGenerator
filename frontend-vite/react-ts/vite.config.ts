import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss()
  ],
  preview: {
    host: '0.0.0.0',  // Allow external connections
    port: 4173,
    strictPort: true
  },
  server: {
    host: '0.0.0.0',  // For dev server too
    port: 5173
  }
})
