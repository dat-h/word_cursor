import { defineConfig } from 'vite';

export default defineConfig({
//   root: './',
//   publicDir: 'public',
  base: '/word_cursor/', // <-- Replace REPO_NAME with your repo name
  build: {
    outDir: 'dist',
    // assetsDir: 'assets',
    emptyOutDir: true
  },
  server: {
    port: 3000,
    open: true
  }
}); 