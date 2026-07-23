import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@': path.resolve(__dirname, 'src') },
  },
  // be OAuth 콜백은 로컬 실행 시 --app.frontend.callback-url 로 5173에 맞춰 오버라이드해서 띄운다.
  server: {
    port: 5173,
    strictPort: true,
    // /api 를 be(8090)로 프록시 → SPA가 same-origin으로 be와 통신.
    // 크로스오리진/WebKit 쿠키 차단을 피하고, be가 /api 로 주는 쿠키(XSRF-TOKEN 등)의
    // path를 / 로 리라이트해 SPA 페이지(/)의 JS가 XSRF-TOKEN을 읽을 수 있게 한다(CSRF 헤더 전송용).
    proxy: {
      '/api': {
        target: 'http://localhost:8090',
        changeOrigin: true,
        cookiePathRewrite: { '*': '/' },
      },
    },
  },
})
