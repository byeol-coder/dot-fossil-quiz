import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// base './' — 규격 5번: 게임별 독립 폴더 빌드, 모든 자산 상대경로.
// games/<game>/ 아래 어디에 놓여도 동작한다.
export default defineConfig({
  base: './',
  plugins: [react()],
});
