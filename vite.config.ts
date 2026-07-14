import path from 'node:path';

import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', 'VITE_');

  return {
    // Set VITE_BASE_PATH when deploying under a path prefix rather than at the
    // domain root. Defaults to "/", which is what most hosts want.
    base: env.VITE_BASE_PATH || '/',

    plugins: [react()],

    server: {
      port: 3000,
      host: '0.0.0.0',
    },

    preview: {
      port: 4173,
      host: '0.0.0.0',
    },

    resolve: {
      // Points at ./src. Harmless before the restructure (nothing uses the
      // alias yet) and correct after it.
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },

    build: {
      outDir: 'dist',
      sourcemap: 'hidden',
      // Two dependencies dominate the bundle: xlsx (~430 kB) and recharts with
      // its d3 tree (~350 kB). Splitting them means a change to application
      // code no longer invalidates the vendor chunks in users' caches.
      rollupOptions: {
        output: {
          // Resolved by module path rather than package name: the array form
          // produces an empty vendor-react chunk, because React arrives through
          // transitive paths that a bare "react" entry does not match.
          //
          // Order matters — "lucide-react" and "recharts" would both be caught
          // by a naive "react" test, so they are claimed first.
          manualChunks(id: string) {
            if (!id.includes('node_modules')) return undefined;

            if (id.includes('/xlsx/')) return 'vendor-xlsx';
            if (id.includes('/lucide-react/')) return 'vendor-icons';
            if (id.includes('/recharts/') || id.includes('/d3-') || id.includes('/victory-')) {
              return 'vendor-charts';
            }
            if (
              id.includes('/react/') ||
              id.includes('/react-dom/') ||
              id.includes('/scheduler/')
            ) {
              return 'vendor-react';
            }

            return 'vendor';
          },
        },
      },
      // Raised because vendor-xlsx legitimately exceeds the 500 kB default and
      // cannot be split further. Application chunks should stay well below it —
      // if one starts warning, that is a real signal.
      chunkSizeWarningLimit: 600,
    },
  };
});
