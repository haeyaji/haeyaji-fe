import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@': path.resolve(__dirname, 'src') },
  },
  // be OAuth 콜백 URL이 http://localhost:3000/oauth/callback 로 고정 → 프론트도 3000에서 떠야 함
  server: { port: 3000, strictPort: true },
})
