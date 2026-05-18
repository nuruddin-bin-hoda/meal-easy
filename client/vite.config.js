import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  server: {
    port: 4000,
    host: true,
    proxy: {
      '/uploads': 'http://server:3000',
    },
  },
  plugins: [react()],
})
