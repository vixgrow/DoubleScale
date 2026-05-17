/// <reference types="vitest" />
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'node:path';

const srcDir = path.resolve(__dirname, 'src');

export default defineConfig({
	plugins: [react()],
	resolve: {
		alias: {
			// Common aliases used in unit-testable code. Mirrors the most-used
			// entries from tsconfig.json paths. Add more here as new test files
			// reach into deeper parts of the source tree.
			'@doublescale/shared': path.join(srcDir, 'shared'),
			'@doublescale/utils': path.join(srcDir, 'shared/utils'),
			'@doublescale/services': path.join(srcDir, 'shared/services'),
			'@doublescale/components': path.join(srcDir, 'components'),
			'@doublescale/config': path.join(srcDir, 'shared/config'),
			'@/lib': path.join(srcDir, 'shared/lib'),
			'@/components/ui': path.join(srcDir, 'shared/ui'),
		},
	},
	test: {
		environment: 'jsdom',
		globals: true,
		setupFiles: ['./tests/frontend/setup.ts'],
		include: ['src/**/*.{test,spec}.{ts,tsx}', 'tests/frontend/**/*.{test,spec}.{ts,tsx}'],
		exclude: [
			'node_modules/**',
			'build/**',
			'dependencies/**',
			'tests/e2e/**',
		],
		coverage: {
			provider: 'v8',
			reporter: ['text', 'html', 'lcov'],
			include: ['src/**/*.{ts,tsx}'],
			exclude: [
				// Heavy editor / graph code — defer to E2E.
				'src/builder/blocks/**',
				'src/client/pages/automation/**',
				'src/client/pages/campaign/**',
				'src/client/pages/booking/**',
				'src/renderer/**',
				// Generated, type-only, or top-level entries.
				'src/**/*.d.ts',
				'src/**/index.{ts,tsx}',
				'src/types/**',
			],
		},
	},
});
