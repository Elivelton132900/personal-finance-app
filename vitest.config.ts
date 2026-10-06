import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  test: {
    environment: 'happy-dom', // ou 'jsdom'
    globals: true,
    server: {
      deps: {
        inline: ['next-auth'], // Força o Vitest a compilar o next-auth corretamente
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
