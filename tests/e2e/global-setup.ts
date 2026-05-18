import { chromium, FullConfig } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const AUTH_DIR = path.resolve(__dirname, '.auth');
const STORAGE_STATE = path.join(AUTH_DIR, 'admin.json');

const DEFAULT_BASE = 'http://localhost:8889';

/**
 * Resolves the WordPress origin for E2E.
 *
 * Note: `WP_BASE_URL=""` (empty in the environment) is not treated as "unset"
 * by `??` in JS — we normalize so Playwright never gets an invalid baseURL.
 */
function resolveBaseURL(): string {
	const raw = process.env.WP_BASE_URL;
	const trimmed = typeof raw === 'string' ? raw.trim() : '';
	const base = trimmed === '' ? DEFAULT_BASE : trimmed.replace(/\/+$/, '');
	// Trailing slash required for Playwright relative URLs (see playwright.config.ts).
	return `${base}/`;
}

/**
 * Logs into WordPress as an admin user and persists storage state for specs.
 *
 * Credentials are **WordPress** admin (e.g. wp-env defaults `admin` / `password`),
 * not MySQL users from `bin/install-wp-tests.sh` (those are `db-user` / `db-pass`
 * for PHPUnit only).
 */
export default async function globalSetup(_config: FullConfig) {
	if (!fs.existsSync(AUTH_DIR)) {
		fs.mkdirSync(AUTH_DIR, { recursive: true });
	}

	const baseURL = resolveBaseURL();
	const siteRoot = baseURL.replace( /\/+$/, '' );
	if ( ! /^https?:\/\//i.test( siteRoot ) ) {
		throw new Error(
			`Invalid WP_BASE_URL (need absolute http(s) URL): "${ process.env.WP_BASE_URL }". Example: http://localhost:8889`
		);
	}

	const username =
		typeof process.env.WP_ADMIN_USER === 'string' && process.env.WP_ADMIN_USER.trim() !== ''
			? process.env.WP_ADMIN_USER.trim()
			: 'admin';
	const password =
		typeof process.env.WP_ADMIN_PASS === 'string' && process.env.WP_ADMIN_PASS.trim() !== ''
			? process.env.WP_ADMIN_PASS.trim()
			: 'password';

	const browser = await chromium.launch();
	const context = await browser.newContext( { baseURL: siteRoot } );
	const page = await context.newPage();

	const loginURL = new URL( 'wp-login.php', `${ siteRoot }/` ).href;
	await page.goto( loginURL );
	await page.fill('input#user_login', username);
	await page.fill('input#user_pass', password);
	await Promise.all([
		page.waitForURL(/wp-admin/),
		page.click('input#wp-submit'),
	]);

	await context.storageState({ path: STORAGE_STATE });
	await browser.close();
}
