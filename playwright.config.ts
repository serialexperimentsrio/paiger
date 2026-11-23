import { defineConfig } from '@playwright/test'

// `bun run test` starts the demo's dev server (or reuses a running one) and
// runs tests/ in Chromium against its test page
export default defineConfig({
	testDir: 'tests',
	use: { baseURL: 'http://localhost:5199' },
	webServer: {
		command: 'bun run dev --port 5199 --strictPort',
		cwd: 'demo',
		url: 'http://localhost:5199/test.html',
		reuseExistingServer: true
	}
})
