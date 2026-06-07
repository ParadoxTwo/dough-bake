import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'node:url'

// Unit & component tests use the `.test.ts(x)` suffix; Playwright e2e tests use
// `.spec.ts` under e2e/ and are excluded here.
export default defineConfig({
  plugins: [react()],
  // Use an empty inline PostCSS config so tests don't load the project's
  // Tailwind PostCSS config (which isn't loadable in the Vitest CSS pipeline).
  css: {
    postcss: { plugins: [] },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
    include: ['**/*.test.{ts,tsx}'],
    exclude: ['node_modules/**', '.next/**', 'e2e/**'],
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./', import.meta.url)),
      // Stub heavy third-party CSS so it isn't read/processed in unit tests.
      'mapbox-gl/dist/mapbox-gl.css': fileURLToPath(new URL('./test/empty.css', import.meta.url)),
    },
  },
})
