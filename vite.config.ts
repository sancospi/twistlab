import { defineConfig } from 'vite';

// cubing.js looks for its solver worker at `./search-worker-entry.js` next to its own code
// (import.meta.resolve). Vite can't see that, so src/main.ts imports the entry with `?worker&url`
// to emit it as a self-contained worker bundle, named exactly what cubing.js looks for.
// Without it, cubing.js falls back to a worker that shares the page's chunks and runs page code.
export default defineConfig({
  optimizeDeps: { exclude: ['cubing'] }, // keep cubing's files unbundled in dev so its lookup works there too
  worker: {
    format: 'es',
    rolldownOptions: { output: { entryFileNames: 'assets/search-worker-entry.js', chunkFileNames: 'assets/search-worker-[name]-[hash].js' } },
  },
  build: { chunkSizeWarningLimit: 2048 },
});
