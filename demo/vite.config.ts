import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
	plugins: [react()],
	// Relative paths, so the build works under any subpath (GitHub Pages serves it at /paiger/)
	base: './',
	resolve: {
		// Use the library source directly, so edits to ../src hot-reload here
		alias: { paiger: path.resolve(__dirname, '../src/index.ts') },
		// ../src has no react of its own; resolve it from this package
		dedupe: ['react', 'react-dom']
	}
})
