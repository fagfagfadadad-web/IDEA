import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import svgrPlugin from 'vite-plugin-svgr';
import tsconfigPaths from 'vite-tsconfig-paths';
import { nodePolyfills } from 'vite-plugin-node-polyfills';

export default defineConfig({
  server: {
    rollupOptions: {
      output: {
        sourcemap: false,
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
    include: ['@multiversx/sdk-dapp-ui']
  },
  plugins: [
    react(),
    tsconfigPaths(),
    svgrPlugin(),
    nodePolyfills({
      globals: { Buffer: true, global: true, process: true },
      include: ['timers'],
    }),
  ],
});