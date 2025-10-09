import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { nodePolyfills } from 'vite-plugin-node-polyfills';
import svgrPlugin from 'vite-plugin-svgr';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  server: {
    port: Number(process.env.PORT) || 3000,
    strictPort: true,
    host: true,
    https: false, // Vypni HTTPS
    watch: {
      usePolling: false,
      useFsEvents: false,
    },
    hmr: {
      overlay: false,
    },
  },
  build: {
    outDir: 'build',
    sourcemap: false,
    commonjsOptions: {
      transformMixedEsModules: true,
    },
    rollupOptions: {
      output: {
        sourcemap: false,
        manualChunks: {
          'mvx-sdk': [
            '@multiversx/sdk-core',
            '@multiversx/sdk-dapp',
            '@multiversx/sdk-dapp-ui',
            '@multiversx/sdk-dapp-utils'
          ],
          'firebase': ['firebase/app', 'firebase/auth', 'firebase/firestore'],
          'vendor': ['react', 'react-dom', 'react-router-dom']
        }
      },
      onwarn(warning, warn) {
        if (warning.code === 'SOURCEMAP_ERROR') return;
        warn(warning);
      }
    }
  },
  preview: {
    port: 3002,
    https: false, // Vypni HTTPS
    host: 'localhost',
    strictPort: true,
  },
  optimizeDeps: {
    exclude: [],
    include: [
      '@multiversx/sdk-dapp-ui',
      '@multiversx/sdk-dapp',
      '@multiversx/sdk-core',
      '@multiversx/sdk-dapp-utils'
    ],
    esbuildOptions: {
      target: 'esnext'
    }
  },
  plugins: [
    react(),
    tsconfigPaths(),
    svgrPlugin(),
    nodePolyfills({
      globals: { Buffer: true, global: true, process: true },
    }),
  ],
});