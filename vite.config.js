import { defineConfig } from 'vite';

export default defineConfig({
  // Root of the project (where index.html lives)
  root: '.',

  // Public directory for static assets (served at / during dev, copied to dist on build)
  publicDir: 'public',

  build: {
    // Output directory for production build
    outDir: 'dist',

    // Generate source maps for debugging
    sourcemap: false,

    // Asset handling
    assetsInlineLimit: 4096,

    // Clean output directory before build
    emptyOutDir: true,
  },

  server: {
    // Dev server port
    port: 5173,
    open: true,
  },
});
