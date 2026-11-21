import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
	plugins: [react()],
	resolve: {
		// Use the library source directly, so edits to ../src hot-reload here
		alias: { ricebowl: path.resolve(__dirname, '../src/index.ts') },
		// ../src has no react of its own; resolve it from this package
		dedupe: ['react', 'react-dom']
	}
})
