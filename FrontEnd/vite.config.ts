import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  // host: true permite abrir la app desde un celular en la misma red
  server: { host: true },
  plugins: [react()],
})
