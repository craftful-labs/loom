import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: ['src/index.ts', 'src/svelte/index.ts', 'prettier/index.ts'],
  dts: true,
  exports: true,
  format: ['esm'],
  clean: true,
  sourcemap: true,
  publint: 'ci-only'
})


