import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite' // You need this import

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),      // The React plugin runs first
    tailwindcss(),  // The Tailwind CSS plugin runs after
  ],
})