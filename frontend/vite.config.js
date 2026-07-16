import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      // Yeh rule Vite ko batayega ki agar use 'tailwindcss' dhoondhna hai, toh wo seedhe local node_modules uthaye
      'tailwindcss': path.resolve(__dirname, 'node_modules/tailwindcss'),
    }
  }
})
