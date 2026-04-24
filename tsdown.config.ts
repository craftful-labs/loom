import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    svelte: 'src/svelte/index.ts',
    prettier: 'src/prettier/index.ts'
  },
  dts: true,
  exports: true,
  format: ['esm'],
  clean: true,
  sourcemap: true,
  publint: 'ci-only'
})
