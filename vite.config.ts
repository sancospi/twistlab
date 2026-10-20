import { defineConfig } from 'vite';

// cubing.js runs its solver in module workers: keep it out of the app chunk
// (the worker imports that chunk and would otherwise run DOM code) and unbundled in dev.
export default defineConfig({
  optimizeDeps: { exclude: ['cubing'] },
  worker: { format: 'es' },
  build: {
    chunkSizeWarningLimit: 2048,
    rolldownOptions: { output: { codeSplitting: { groups: [{ name: 'cubing', test: /node_modules[\\/]cubing/ }] } } },
  },
});
