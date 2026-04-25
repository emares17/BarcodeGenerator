import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  define: {
    'import.meta.env.VITE_PUBLIC_POSTHOG_KEY': JSON.stringify(process.env.VITE_PUBLIC_POSTHOG_KEY),
    'import.meta.env.VITE_PUBLIC_POSTHOG_HOST': JSON.stringify(process.env.VITE_PUBLIC_POSTHOG_HOST),
  },
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
