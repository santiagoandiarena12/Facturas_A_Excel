import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  base: './', // Vital para cargar assets desde disco local con mainWindow.loadFile en Electron
  plugins: [react(), tailwindcss()],
  server: {
    host: true, // Permite acceder desde el celular y otros dispositivos en la misma red Wi-Fi
    port: 5173,
  },
})
