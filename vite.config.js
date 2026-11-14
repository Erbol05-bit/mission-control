import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// base './' lets the built game work from any address, including GitHub Pages.
export default defineConfig({
  base: './',
  plugins: [react()],
})
