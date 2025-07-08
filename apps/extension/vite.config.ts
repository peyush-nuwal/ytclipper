import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

import manifest from './manifest';

// Generate manifest.json
const generateManifest = () => {
  const outDir = path.resolve(__dirname, 'dist');
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(
    path.resolve(outDir, 'manifest.json'),
    JSON.stringify(manifest, null, 2),
  );
};

export default defineConfig(({ mode }) => {
  const isProduction = mode === 'production';

  return {
    plugins: [
      react(),
      {
        name: 'generate-manifest',
        buildStart() {
          generateManifest();
        },
      },
    ],
    define: {
      __DEV__: !isProduction,
    },
    build: {
      outDir: 'dist',
      emptyOutDir: true,
      rollupOptions: {
        input: {
          background: path.resolve(__dirname, 'src/background/index.ts'),
          content: path.resolve(__dirname, 'src/content/index.ts'),
          'content-ui': path.resolve(__dirname, 'src/content-ui/index.tsx'),
          popup: path.resolve(__dirname, 'src/popup/index.html'),
        },
        output: {
          entryFileNames: chunk => {
            const facadeModuleId = chunk.facadeModuleId;
            if (facadeModuleId?.includes('background')) {
              return 'src/background/index.js';
            }
            if (facadeModuleId?.includes('content.')) {
              return 'src/content/index.js';
            }
            if (facadeModuleId?.includes('content-ui')) {
              return 'src/content-ui/index.js';
            }
            return 'src/[name]/index.js';
          },
          chunkFileNames: 'chunks/[name].[hash].js',
          assetFileNames: assetInfo => {
            const name = assetInfo.name || '';
            if (name.endsWith('.css')) {
              if (name.includes('content')) {
                return 'src/content/content.css';
              }
              return 'src/[name].[ext]';
            }
            return 'assets/[name].[ext]';
          },
        },
      },
      minify: isProduction,
      sourcemap: !isProduction,
      target: 'es2020',
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src'),
        '@ytclipper/extension-dev-utils': path.resolve(
          __dirname,
          'packages/dev-utils',
        ),
      },
    },
  };
});
