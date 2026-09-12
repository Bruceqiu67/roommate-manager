import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import fs from 'node:fs'
import path from 'node:path'

export default defineConfig({
  base: './',
  plugins: [
    react(),
    tailwindcss(),
    {
      name: 'spa-404-fallback',
      closeBundle() {
        const distIndex = path.resolve('dist', 'index.html')
        const dist404 = path.resolve('dist', '404.html')
        if (fs.existsSync(distIndex)) {
          fs.copyFileSync(distIndex, dist404)
        }
      },
    },
  ],
})
