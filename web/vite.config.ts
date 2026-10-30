import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  server: {
    port: 5173,
    // 개발 중에는 Nest(3000)의 API 를 그대로 사용한다.
    proxy: { '/api': 'http://localhost:3000' },
  },
  // 짧은 주소(/:code)와 겹치지 않도록 앱은 코드에 쓸 수 없는 문자(~) 아래에 둔다.
  base: '/~/',
  build: { outDir: 'dist' },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test-setup.ts'],
    css: false,
  },
});
