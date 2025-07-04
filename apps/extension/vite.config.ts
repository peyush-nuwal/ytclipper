import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import manifest from './manifest';
import { writeFileSync, mkdirSync } from 'fs';

// Generate manifest.json
const generateManifest = () => {
  const outDir = resolve(__dirname, 'dist');
  mkdirSync(outDir, { recursive: true });
  writeFileSync(
    resolve(outDir, 'manifest.json'),
    JSON.stringify(manifest, null, 2)
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
        }
      }
    ],
    define: {
      __DEV__: !isProduction,
    },
    build: {
      outDir: 'dist',
      emptyOutDir: true,
      rollupOptions: {
        input: {
          background: resolve(__dirname, 'src/background/index.ts'),
          content: resolve(__dirname, 'src/content/index.ts'),
          'content-ui': resolve(__dirname, 'src/content-ui/index.tsx'),
          popup: resolve(__dirname, 'src/popup/index.html'),
        },
        output: {
          entryFileNames: (chunk) => {
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
          assetFileNames: (assetInfo) => {
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
        '@': resolve(__dirname, 'src'),
        '@ytclipper/extension-dev-utils': resolve(__dirname, 'packages/dev-utils'),
      },
    },
  };
}); 