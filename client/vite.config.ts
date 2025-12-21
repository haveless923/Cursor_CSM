import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: 'localhost', // 使用 localhost
    port: 5173, // 使用 Vite 默认端口
    strictPort: false, // 如果端口被占用，自动尝试下一个端口
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false
      }
    }
  }
})

