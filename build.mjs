import { build } from 'esbuild'
import cssModulesPlugin from 'esbuild-css-modules-plugin'
import { execSync } from 'child_process'
import { rmSync } from 'fs'

rmSync('dist', { recursive: true, force: true })

const sharedOptions = {
  entryPoints: ['src/index.ts'],
  bundle: true,
  external: ['react', 'react-dom', 'react/jsx-runtime'],
  sourcemap: true,
  target: 'es2020',
  jsx: 'automatic',
  // Every component uses hooks or the DOM, so Next's App Router has to treat
  // the whole package as client code
  banner: { js: "'use client';" },
  plugins: [
    cssModulesPlugin({
      force: true,
      inject: false,
      localsConvention: 'camelCaseOnly',
    }),
  ],
}

await Promise.all([
  build({
    ...sharedOptions,
    format: 'esm',
    outfile: 'dist/index.js',
  }),
  build({
    ...sharedOptions,
    format: 'cjs',
    outfile: 'dist/index.cjs',
  }),
])

// esbuild doesn't write types, so tsc does that part
execSync('npx tsc --emitDeclarationOnly --declaration --declarationMap --outDir dist --skipLibCheck', {
  stdio: 'inherit',
})

console.log('Build complete')
