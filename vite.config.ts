import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // HTTPS нужен только при подключении к реальному Telegram боту.
    // Для локальной разработки используй ngrok: ngrok http 5173
  },
})
