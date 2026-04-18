import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

export default defineConfig({
  plugins: [react()],
  server: {
    // Allow importing files outside editor/ (e.g. ../stories/, ../shared/).
    fs: {
      allow: [path.resolve(__dirname, '..')],
    },
  },
});
