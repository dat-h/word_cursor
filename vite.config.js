import { defineConfig } from 'vite';
import { execSync } from 'child_process';

let commitHash = 'dev';
try {
  commitHash = execSync('git rev-parse --short HEAD').toString().trim();
} catch (e) {}

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
  },
  define: {
    __APP_VERSION__: JSON.stringify(commitHash),
  },
}); 