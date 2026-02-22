import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: '/mashreq-phonetics/',
  build: {
    outDir: 'dist',
  },
});
