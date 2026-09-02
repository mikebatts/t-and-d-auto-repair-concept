import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Served from GitHub Pages under the repository slug.
export default defineConfig({
  base: '/t-and-d-auto-repair-concept/',
  plugins: [react()],
  build: {
    target: 'es2022',
    sourcemap: false,
  },
  preview: {
    port: 4175,
    strictPort: true,
  },
})
