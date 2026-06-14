import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: { port: 5173 },
  // static site served via `vite preview` on Railway — accept the public hostname
  preview: { allowedHosts: true }
});