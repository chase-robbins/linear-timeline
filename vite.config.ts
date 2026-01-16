import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { viteSingleFile } from 'vite-plugin-singlefile'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), viteSingleFile()],
  build: {
    // Inline all assets
    assetsInlineLimit: 100000000,
    cssCodeSplit: false,
  },
})
