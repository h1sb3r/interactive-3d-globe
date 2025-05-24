import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: '/interactive-3d-globe/',
  plugins: [react()],
});
