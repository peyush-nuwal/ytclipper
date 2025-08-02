import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import { fileURLToPath, URL } from 'url';
import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig({
  plugins: [
    react(),
    dts({
      insertTypesEntry: true,
      include: ['src/**/*'],
      exclude: ['src/**/*.test.*', 'src/**/*.spec.*'],
    }),
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      styles: resolve(__dirname, 'src/styles/globals.css'),
      name: 'ui',
      formats: ['es', 'cjs'],
      fileName: (format, entryName) => {
        if (entryName === 'styles') {
          return 'styles/globals.css';
        }
        return `index.${format === 'es' ? 'mjs' : 'js'}`;
      },
    },
    rollupOptions: {
      external: [
        'react',
        'react-dom',
        'react/jsx-runtime',
        'class-variance-authority',
        'clsx',
        'tailwind-merge',
        '@radix-ui/react-slot',
      ],
      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
          'react/jsx-runtime': 'react/jsx-runtime',
        },
        assetFileNames: (assetInfo) => {
          if (assetInfo.name && assetInfo.name.endsWith('.css')) {
            return 'styles/[name][extname]';
          }
          return 'assets/[name]-[hash][extname]';
        },
      },
    },
    sourcemap: true,
    emptyOutDir: true,
    cssCodeSplit: false,
  },
  css: {
    postcss: true
  }
});
