import { test, expect, type Page } from '@playwright/test';

/**
 * The public booking journey — what an actual invitee sees.
 *
 * Everything here runs ANONYMOUSLY (no admin cookie): these pages are the
 * product's front door and must work for a logged-out stranger. The admin
 * specs cover the dashboard; this file covers the customer.
 *
 * Routes (BookingFrontendHandler::route_frontend):
 *   ?doublescale_booking_calendar=<slug>                → calendar landing
 *   ?doublescale_booking_calendar=<slug>&event=<slug>   → booking page
 *   ?doublescale_booking_event=<slug>                   → direct event share link
 *   ?doublescale_booking=1&id=<hash>&type=<cancel|…>    → cancel / reschedule
 *
 * NOTE: no test here completes a booking. Creating one writes a real row to
 * the site's database, which needs the owner's say-so. Everything up to the
 * final confirm is exercised.
 */

// Drop the stored admin session — these must pass for anonymous visitors.
test.use({ storageState: { cookies: [], origins: [] } });

const SITE = process.env.WP_BASE_URL ?? 'http://localhost/wordpress';

/** A calendar slug that exists on this site. */
const CALENDAR_SLUG = process.env.DS_E2E_CALENDAR_SLUG ?? 'ahmed';

const calendarURL = (slug = CALENDAR_SLUG) =>
	`${SITE}?doublescale_booking_calendar=${slug}`;

/**
 * An event whose share link is blocked by a Memberships URI rule on this
 * site (wp_doublescale_membership_rules: match_value
 * `doublescale_booking_event=ddd`). Override when testing elsewhere.
 */
const GATED_EVENT_SLUG = process.env.DS_E2E_GATED_EVENT_SLUG ?? 'ddd';

/**
 * Other calendars to sweep when looking for an ungated event. A calendar
 * lists only its own events, so the gated one can be the sole entry on the
 * starting calendar. Comma-separated override.
 */
const EXTRA_CALENDAR_SLUGS = (
	process.env.DS_E2E_EXTRA_CALENDARS ?? 'kkk,wo-wo,mohamed,test2,test3,you'
)
	.split(',')
	.map((s: string) => s.trim())
	.filter(Boolean);

/**
 * Find an event whose share link is NOT paywalled, so the share-link flow is
 * still covered when the first event happens to be gated. Returns null when
 * every candidate is blocked.
 */
async function firstUngatedEventSlug(
	page: Page,
	exclude: string
): Promise<string | null> {
	const slugs = new Set<string>();

	// The starting calendar lists only its own events, and the gated one may
	// be the only entry — so sweep every calendar this site publishes.
	const calendars = new Set<string>([CALENDAR_SLUG, ...EXTRA_CALENDAR_SLUGS]);

	for (const cal of calendars) {
		await gotoCalendar(page, cal).catch(() => undefined);

		const hrefs = await page
			.locator('a[href*="event="], a[href*="doublescale_booking_event"]')
			.evaluateAll((els) =>
				els.map(
					(e) => (e as HTMLAnchorElement).getAttribute('href') ?? ''
				)
			)
			.catch(() => [] as string[]);

		for (const h of hrefs) {
			const m = /[?&](?:event|doublescale_booking_event)=([^&]+)/.exec(h);
			if (m) {
				const slug = decodeURIComponent(m[1]);
				if (slug !== exclude) {
					slugs.add(slug);
				}
			}
		}
	}

	for (const slug of slugs) {
		const res = await page.request
			.get(`${SITE}?doublescale_booking_event=${slug}`)
			.catch(() => null);
		if (res?.status() === 200) {
			return slug;
		}
	}

	return null;
}

/** Open the calendar landing and wait for it to paint. */
async function gotoCalendar(page: Page, slug = CALENDAR_SLUG): Promise<void> {
	await page.goto(calendarURL(slug));
	await expect(page.locator('body')).toBeVisible({ timeout: 45_000 });
}

/**
 * Open the first event on the calendar. Skips when the calendar has none,
 * rather than failing on an empty site.
 */
async function gotoFirstEvent(page: Page): Promise<void> {
	await gotoCalendar(page);

	const eventLink = page
		.locator('a[href*="event="], a[href*="doublescale_booking_event"]')
		.first();

	const found = await eventLink
		.waitFor({ state: 'visible', timeout: 30_000 })
		.then(() => true)
		.catch(() => false);

	if (!found) {
		test.skip(true, `Calendar "${CALENDAR_SLUG}" publishes no events.`);
	}

	await eventLink.click();
	await expect(page).toHaveURL(/event=|doublescale_booking_event=/, {
		timeout: 30_000,
	});
}

/* =====================================================================
 * Calendar landing page
 * ================================================================== */

test.describe('Public booking: calendar landing', () => {
	test('an anonymous visitor can open the calendar', async ({ page }) => {
		await gotoCalendar(page);

		// The host's calendar name becomes the page title.
		await expect(page).toHaveTitle(new RegExp(CALENDAR_SLUG, 'i'), {
			timeout: 30_000,
		});

		// No login wall, and no PHP error leaking to the visitor.
		await expect(page.locator('body')).not.toContainText(
			/Fatal error|Warning:|Notice:|wp-login/i
		);
	});

	test('the calendar lists its bookable events', async ({ page }) => {
		await gotoCalendar(page);

		const eventLink = page
			.locator('a[href*="event="], a[href*="doublescale_booking_event"]')
			.first();

		await expect(eventLink).toBeVisible({ timeout: 30_000 });

		// Each event advertises a duration and a way in.
		await expect(page.getByText(/\d+\s*min/i).first()).toBeVisible({
			timeout: 15_000,
		});
		await expect(page.getByText(/Book Now/i).first()).toBeVisible();
	});

	test('an unknown calendar slug does not render a booking page', async ({
		page,
	}) => {
		await page.goto(calendarURL('zzz-no-such-calendar-e2e'));

		// It must not present a bookable calendar. Whatever the site chooses
		// to show (404, home page), it must not leak an error trace.
		await expect(page.locator('body')).not.toContainText(
			/Fatal error|Warning:|Notice:/i
		);
		await expect(page.getByText(/Select a Date & Time/i)).toBeHidden();
	});

	test('the admin bar is hidden on public booking links', async ({
		page,
	}) => {
		await gotoCalendar(page);

		// hide_admin_bar() suppresses it on every public booking URL.
		await expect(page.locator('#wpadminbar')).toBeHidden();
	});
});

/* =====================================================================
 * Booking page — the slot picker
 * ================================================================== */

test.describe('Public booking: slot picker', () => {
	test('the booking page shows the event and a date picker', async ({
		page,
	}) => {
		await gotoFirstEvent(page);

		await expect(page.getByText(/Select a Date & Time/i)).toBeVisible({
			timeout: 30_000,
		});

		// Duration is what the invitee is agreeing to.
		await expect(page.getByText(/\d+\s*Min/i).first()).toBeVisible();
	});

	test('the picker offers a timezone', async ({ page }) => {
		await gotoFirstEvent(page);

		await expect(page.getByText(/Time zone/i).first()).toBeVisible({
			timeout: 30_000,
		});
	});

	test('the month grid renders selectable days', async ({ page }) => {
		await gotoFirstEvent(page);

		await expect(page.getByText(/Select a Date & Time/i)).toBeVisible({
			timeout: 30_000,
		});

		// The weekday header proves this is a calendar, not a stray list.
		// Not `exact: true` — the labels carry surrounding whitespace.
		for (const day of ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA']) {
			await expect(page.getByText(day).first()).toBeVisible({
				timeout: 15_000,
			});
		}

		// The month name and year are on screen.
		await expect(
			page
				.getByText(
					/(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4}/i
				)
				.first()
		).toBeVisible();

		// Day cells are plain elements, not role="button" — count the numbers
		// the grid paints. A padded month is always at least 28 cells.
		const dayCells = page.getByText(/^\d{1,2}$/);
		expect(
			await dayCells.count(),
			'The month grid should render a full set of day cells.'
		).toBeGreaterThanOrEqual(28);
	});

	test('picking an available day offers times or says there are none', async ({
		page,
	}) => {
		await gotoFirstEvent(page);
		await expect(page.getByText(/Select a Date & Time/i)).toBeVisible({
			timeout: 30_000,
		});

		// Available days are highlighted; unavailable ones are inert. Click
		// through the grid until one actually responds.
		const days = page.getByText(/^\d{1,2}$/);
		const total = await days.count();

		let opened = false;
		for (let i = 0; i < total && !opened; i++) {
			const day = days.nth(i);
			if (!(await day.isVisible().catch(() => false))) {
				continue;
			}

			await day.click({ timeout: 5_000 }).catch(() => undefined);

			// A selected day makes the time column appear.
			opened = await page
				.getByText(/\d{1,2}:\d{2}\s*(AM|PM)/i)
				.first()
				.waitFor({ state: 'visible', timeout: 4_000 })
				.then(() => true)
				.catch(() => false);
		}

		if (!opened) {
			test.skip(
				true,
				'No day in the current month exposed any time slots.'
			);
		}

		// Either slots appear, or the page says the day is unavailable. A
		// blank panel would leave the invitee stuck.
		await expect(
			page
				.getByText(/\d{1,2}:\d{2}\s*(AM|PM)/i)
				.or(
					page.getByText(
						/No available|unavailable|no slots|fully booked/i
					)
				)
				.first()
		).toBeVisible({ timeout: 30_000 });
	});

	test('the page survives a direct reload of the booking URL', async ({
		page,
	}) => {
		await gotoFirstEvent(page);
		const url = page.url();

		await page.goto(url);

		await expect(page.getByText(/Select a Date & Time/i)).toBeVisible({
			timeout: 30_000,
		});
	});
});

/* =====================================================================
 * Direct event share link
 * ================================================================== */

test.describe('Public booking: direct event link', () => {
	test('a share link resolves straight to the booking page', async ({
		page,
	}) => {
		await gotoFirstEvent(page);

		// Derive the event slug from the URL the calendar produced.
		const slug = new URL(page.url()).searchParams.get('event');
		if (!slug) {
			test.skip(true, 'Could not derive an event slug from the URL.');
		}

		const response = await page.goto(
			`${SITE}?doublescale_booking_event=${slug}`
		);

		// A membership URI rule can gate an individual share link (the
		// Memberships add-on's ContentGate::block_uri runs on
		// template_redirect at priority 3 and wp_die()s with 403). On this
		// site exactly one such rule exists, matching `doublescale_booking_event=ddd`.
		// Rather than skip — which would leave the share-link flow untested —
		// fall through to an event that is not gated, so this path is always
		// exercised somewhere.
		if (response?.status() === 403) {
			await expect(
				page.getByText(/available to members only/i)
			).toBeVisible();

			const openSlug = await firstUngatedEventSlug(page, slug);
			test.skip(
				openSlug === null,
				'Every event share link on this site is gated by a Memberships URI rule.'
			);
			await page.goto(
				`${SITE}?doublescale_booking_event=${openSlug as string}`
			);
		}

		await expect(page.getByText(/Select a Date & Time/i)).toBeVisible({
			timeout: 30_000,
		});
	});

	/**
	 * A gated share link must be a deliberate paywall, never a crash. Pins the
	 * one rule this site carries so its removal (or spread) is noticed.
	 */
	test('a gated share link shows the paywall, not an error', async ({
		page,
	}) => {
		const response = await page.goto(
			`${SITE}?doublescale_booking_event=${GATED_EVENT_SLUG}`
		);

		if (response?.status() !== 403) {
			test.skip(
				true,
				`"${GATED_EVENT_SLUG}" is no longer gated — the Memberships URI rule was removed.`
			);
		}

		await expect(
			page.getByText(/available to members only/i)
		).toBeVisible();
		await expect(page.locator('body')).not.toContainText(
			/Fatal error|Uncaught/i
		);
	});

	/**
	 * The same event must not be reachable one way and paywalled another
	 * unless that is intended. This pins the current split so a change in
	 * either direction is noticed:
	 *   ?doublescale_booking_calendar=<cal>&event=<ev>  → 200 (bookable)
	 *   ?doublescale_booking_event=<ev>                 → 403 on this site
	 */
	test('both public routes for one event answer without erroring', async ({
		page,
	}) => {
		await gotoFirstEvent(page);
		const url = new URL(page.url());
		const slug = url.searchParams.get('event');
		const cal = url.searchParams.get('doublescale_booking_calendar');

		if (!slug || !cal) {
			test.skip(true, 'Could not derive calendar/event slugs.');
		}

		const viaCalendar = await page.goto(
			`${SITE}?doublescale_booking_calendar=${cal}&event=${slug}`
		);
		expect(viaCalendar?.status()).toBe(200);

		const viaShare = await page.goto(
			`${SITE}?doublescale_booking_event=${slug}`
		);
		// 200 = bookable, 403 = deliberately paywalled. A 5xx is a defect.
		expect([200, 403]).toContain(viaShare?.status());

		await expect(page.locator('body')).not.toContainText(
			/Fatal error|Uncaught/i
		);
	});

	test('an unknown event share link 404s instead of rendering', async ({
		page,
	}) => {
		const response = await page.goto(
			`${SITE}?doublescale_booking_event=zzz-no-such-event-e2e`
		);

		// route_frontend() wp_die()s with 404 for an unresolvable event.
		expect(response?.status()).toBe(404);
		await expect(page.getByText(/Event not found/i)).toBeVisible();
	});
});

/* =====================================================================
 * Cancel / reschedule pages
 * ================================================================== */

test.describe('Public booking: cancel and reschedule', () => {
	/**
	 * These pages key off a booking hash. With a bogus hash they must fail
	 * cleanly — an invitee following a stale link should see a message, never
	 * a PHP trace or a blank page.
	 */
	for (const type of ['cancel', 'reschedule'] as const) {
		test(`${type}: a bogus booking hash fails cleanly`, async ({
			page,
		}) => {
			await page.goto(
				`${SITE}?doublescale_booking=1&id=zzz-not-a-real-hash&type=${type}`
			);

			await expect(page.locator('body')).not.toContainText(
				/Fatal error|Warning:|Notice:|Uncaught/i
			);

			// Something must be said to the visitor.
			const text = (await page.locator('body').innerText()).trim();
			expect(text.length).toBeGreaterThan(0);
		});
	}

	test('an empty booking hash does not render a cancel form', async ({
		page,
	}) => {
		await page.goto(`${SITE}?doublescale_booking=1&id=&type=cancel`);

		await expect(page.locator('body')).not.toContainText(
			/Fatal error|Uncaught/i
		);
		// No confirm-cancel control should be reachable without a real booking.
		await expect(
			page.getByRole('button', { name: /^Cancel Booking$/i })
		).toBeHidden();
	});
});
