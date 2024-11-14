import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import mkcert from 'vite-plugin-mkcert'

export default defineConfig({
  plugins: [react(), mkcert()],
  server: {
    host: '127.0.0.1',
    port: 3000,
    https: true
  },
  define: {
    'process.env': {}
  },
})