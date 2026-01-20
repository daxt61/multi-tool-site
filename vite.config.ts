import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      // Strip version numbers from package imports
      // e.g., "@radix-ui/react-dialog@1.1.6" -> "@radix-ui/react-dialog"
    }
  }
})
