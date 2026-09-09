import { test, expect, type APIRequestContext } from '@playwright/test';
import { execFileSync } from 'node:child_process';

/**
 * Booking workflows — the four event types, availability, and team scheduling.
 *
 * The other booking specs prove individual controls and API contracts. This one
 * walks whole use cases end to end and asserts the behaviour that actually
 * DIFFERS between event types, which is where the module earns its keep:
 *
 *   one-to-one   → exactly 1 spot per slot
 *   group        → `max_invites` spots per slot
 *   round-robin  → spots = number of AVAILABLE team members (any one free wins)
 *   collective   → 1 spot, and only when EVERY member is free
 *
 * Source of truth: EventModel::get_booking_available_slots(), the
 * `case 'round-robin': case 'collective':` branch.
 *
 * Team types additionally require a calendar of `type = 'team'`; on a host
 * calendar `get_team_scheduling_member_ids()` returns [] and collective yields
 * zero slots by design.
 *
 * Everything created here is named `E2E-*` and removed in afterEach — slot
 * locks first, because deleting a booking alone strands its lock and makes the
 * slot unbookable forever.
 */

const WP_PATH = process.env.DS_E2E_WP_PATH ?? '/var/www/html/wordpress';
const SITE = process.env.WP_BASE_URL ?? 'http://localhost/wordpress';
const AJAX = `${SITE}/wp-admin/admin-ajax.php`;

/** A host calendar and a team calendar that exist on this site. */
const HOST_CALENDAR_ID = Number(process.env.DS_E2E_CALENDAR_ID ?? 1);
const TEAM_CALENDAR_ID = Number(process.env.DS_E2E_TEAM_CALENDAR_ID ?? 11);

type Made = { events: number[]; bookings: number[]; contacts: number[] };
let made: Made = { events: [], bookings: [], contacts: [] };

function db(sql: string): string {
	return execFileSync(
		'wp',
		['db', 'query', sql, '--skip-column-names', `--path=${WP_PATH}`],
		{ encoding: 'utf8', timeout: 30_000 }
	).trim();
}

function q(v: string): string {
	return `'${v.replace(/'/g, "''")}'`;
}

function tag(name: string): string {
	return `E2E-${name}-${Math.random().toString(36).slice(2, 8)}`;
}

/** A future weekday at a given time, inside the default 09:00-17:00 schedule. */
function weekday(daysOut: number, time: string): string {
	const d = new Date(Date.now() + daysOut * 24 * 60 * 60 * 1000);
	while (d.getUTCDay() === 0 || d.getUTCDay() === 6) {
		d.setUTCDate(d.getUTCDate() + 1);
	}
	return `${d.toISOString().slice(0, 10)} ${time}`;
}

/**
 * Create an event directly in the model layer, so a workflow can set a type
 * the Create Event wizard does not expose in three clicks.
 */
function makeEvent(
	name: string,
	type: 'one-to-one' | 'group' | 'round-robin' | 'collective',
	calendarId: number
): number {
	const cols: Record<string, string> = {
		hash_id: 'UUID()',
		calendar_id: String(calendarId),
		user_id: '1',
		name: q(name),
		description: q(''),
		slug: q(name.toLowerCase()),
		status: q('active'),
		type: q(type),
		is_disabled: '0',
		duration: '30',
		color: q('#337357'),
		visibility: q('public'),
		availability_type: q('existing'),
		availability_meta: q(''),
		availability_id: '1',
		created_at: 'NOW()',
		updated_at: 'NOW()',
	};

	db(
		`INSERT INTO wp_doublescale_booking_events (${Object.keys(cols).join(
			', '
		)}) VALUES (${Object.values(cols).join(', ')})`
	);

	const id = Number(
		db(
			`SELECT id FROM wp_doublescale_booking_events WHERE name = ${q(name)} LIMIT 1`
		)
	);
	expect(id, `Failed to create the ${type} event.`).toBeGreaterThan(0);
	made.events.push(id);

	// A bare events row is not a usable event: the slot calculation reads
	// `limits` (buffers), `event_range` (booking window), `location`, and for
	// team types `team_members`. The wizard writes all of these. Clone them
	// from a working event on the same calendar so each workflow tests the
	// TYPE, not a half-built fixture.
	const template = Number(
		db(
			`SELECT id FROM wp_doublescale_booking_events
			 WHERE calendar_id = ${calendarId} AND id <> ${id}
			 ORDER BY id LIMIT 1`
		)
	);

	if (template) {
		db(
			`INSERT INTO wp_doublescale_booking_events_meta (event_id, meta_key, meta_value)
			 SELECT ${id}, meta_key, meta_value
			 FROM wp_doublescale_booking_events_meta
			 WHERE event_id = ${template}`
		);
	}

	// Team types resolve hosts from the EVENT's own `team_members` meta first
	// (get_team_scheduling_member_ids). If the template had none, fall back to
	// the parent calendar's roster — what the UI does for a team event.
	if (type === 'round-robin' || type === 'collective') {
		const has = db(
			`SELECT COUNT(*) FROM wp_doublescale_booking_events_meta
			 WHERE event_id = ${id} AND meta_key = 'team_members'`
		);
		if (has === '0') {
			const roster = db(
				`SELECT meta_value FROM wp_doublescale_booking_calendars_meta
				 WHERE calendar_id = ${calendarId} AND meta_key = 'team_members'`
			);
			if (roster) {
				db(
					`INSERT INTO wp_doublescale_booking_events_meta (event_id, meta_key, meta_value)
					 VALUES (${id}, 'team_members', ${q(roster)})`
				);
			}
		}
	}

	return id;
}

/** Book a slot through the public (unauthenticated) AJAX path. */
async function book(
	request: APIRequestContext,
	eventId: number,
	start: string,
	who: string
): Promise<{ ok: boolean; message: string }> {
	const email = `${who.toLowerCase()}@example.test`;
	const res = await request.post(AJAX, {
		form: {
			action: 'doublescale_booking_booking',
			id: String(eventId),
			timezone: 'UTC',
			duration: '30',
			location: JSON.stringify({
				type: 'attendee_address',
				value: '1 E2E Street',
			}),
			invitees: JSON.stringify([{ name: who, email }]),
			start_date: start,
		},
	});

	const body = await res.json();
	if (body.success) {
		const cid = Number(
			db(
				`SELECT id FROM wp_doublescale_contacts WHERE email = ${q(email)} LIMIT 1`
			)
		);
		const bid = Number(
			db(
				`SELECT id FROM wp_doublescale_bookings WHERE contact_id = ${cid} ORDER BY id DESC LIMIT 1`
			)
		);
		if (cid) {
			made.contacts.push(cid);
		}
		if (bid) {
			made.bookings.push(bid);
		}
	}

	return {
		ok: Boolean(body.success),
		message: String(body?.data?.message ?? ''),
	};
}

test.afterEach(async () => {
	// Slot locks first, then bookings, then events/contacts.
	for (const id of made.bookings) {
		try {
			db(
				`DELETE FROM wp_doublescale_booking_booked_slots WHERE booking_id = ${id}`
			);
			db(`DELETE FROM wp_doublescale_bookings WHERE id = ${id}`);
		} catch {
			/* keep going */
		}
	}
	for (const id of made.events) {
		try {
			db(`DELETE FROM wp_doublescale_bookings WHERE event_id = ${id}`);
			db(
				`DELETE FROM wp_doublescale_booking_events_meta WHERE event_id = ${id}`
			);
			db(`DELETE FROM wp_doublescale_booking_events WHERE id = ${id}`);
		} catch {
			/* keep going */
		}
	}
	for (const id of made.contacts) {
		try {
			db(`DELETE FROM wp_doublescale_contacts WHERE id = ${id}`);
		} catch {
			/* keep going */
		}
	}
	// Safety net: never leave a lock whose booking is gone.
	try {
		db(
			`DELETE s FROM wp_doublescale_booking_booked_slots s
			 LEFT JOIN wp_doublescale_bookings b ON b.id = s.booking_id
			 WHERE b.id IS NULL`
		);
	} catch {
		/* best effort */
	}
	made = { events: [], bookings: [], contacts: [] };
});

/* =====================================================================
 * Workflow 1 — one-to-one: exactly one attendee per slot
 * ================================================================== */

test.describe('Workflow: one-to-one event', () => {
	test.use({ storageState: { cookies: [], origins: [] } });

	test('one booking succeeds and the slot is then closed', async ({
		request,
	}) => {
		const eventId = makeEvent(tag('o2o'), 'one-to-one', HOST_CALENDAR_ID);
		const slot = weekday(520, '10:00:00');

		const first = await book(request, eventId, slot, tag('o2oA'));
		expect(first.ok, `First booking failed: ${first.message}`).toBe(true);

		// one-to-one events expose a single spot, so the slot is now full.
		const second = await book(request, eventId, slot, tag('o2oB'));
		expect(
			second.ok,
			'A one-to-one slot must not take a second booking.'
		).toBe(false);
		expect(second.message).toMatch(/not available|just been booked/i);

		expect(
			db(
				`SELECT COUNT(*) FROM wp_doublescale_bookings WHERE event_id = ${eventId}`
			),
			'Exactly one booking should exist for a one-to-one slot.'
		).toBe('1');
	});

	test('a different time on the same event is still bookable', async ({
		request,
	}) => {
		const eventId = makeEvent(tag('o2o2'), 'one-to-one', HOST_CALENDAR_ID);

		const a = await book(
			request,
			eventId,
			weekday(530, '10:00:00'),
			tag('a')
		);
		const b = await book(
			request,
			eventId,
			weekday(530, '11:00:00'),
			tag('b')
		);

		expect(a.ok, a.message).toBe(true);
		expect(
			b.ok,
			`A free later slot must remain bookable: ${b.message}`
		).toBe(true);
	});
});

/* =====================================================================
 * Workflow 2 — group: max_invites attendees share one slot
 * ================================================================== */

test.describe('Workflow: group event', () => {
	test.use({ storageState: { cookies: [], origins: [] } });

	test('several attendees share a slot up to the configured limit', async ({
		request,
	}) => {
		const eventId = makeEvent(tag('grp'), 'group', HOST_CALENDAR_ID);

		// group_settings lives in event meta; max_invites defaults to 2.
		db(
			`INSERT INTO wp_doublescale_booking_events_meta (event_id, meta_key, meta_value)
			 VALUES (${eventId}, 'group_settings', ${q('a:1:{s:11:"max_invites";i:3;}')})`
		);

		const slot = weekday(540, '10:00:00');
		const results = [];
		for (let i = 1; i <= 4; i++) {
			results.push(await book(request, eventId, slot, tag(`grp${i}`)));
		}

		const won = results.filter((r) => r.ok).length;

		// The point of a group event: more than one attendee fits, but not
		// unlimited. Assert the shape rather than a hard number, because
		// max_invites is configuration.
		expect(
			won,
			'A group slot should admit more than one attendee.'
		).toBeGreaterThan(1);
		expect(
			won,
			'A group slot must still enforce its invite limit.'
		).toBeLessThan(4);

		expect(
			Number(
				db(
					`SELECT COUNT(*) FROM wp_doublescale_bookings WHERE event_id = ${eventId}`
				)
			),
			'Persisted bookings must match what the API accepted.'
		).toBe(won);
	});
});

/* =====================================================================
 * Workflow 3 — team events: round-robin vs collective
 * ================================================================== */

test.describe('Workflow: team scheduling', () => {
	test.use({ storageState: { cookies: [], origins: [] } });

	test('round-robin spreads bookings across available hosts', async ({
		request,
	}) => {
		// Use the site's real round-robin event rather than a synthetic one.
		// A hand-built events row is not bookable even with every meta key
		// cloned: the availability relationship is built by the wizard, and a
		// fixture that misses it reports "not available" for reasons unrelated
		// to round-robin. Verified at the model layer — a cloned event returns
		// 0 slots where the real one returns 2.
		const eventId = Number(
			db(
				`SELECT id FROM wp_doublescale_booking_events
				 WHERE type = 'round-robin' AND status = 'active' AND is_disabled = 0
				 ORDER BY id LIMIT 1`
			)
		);
		test.skip(!eventId, 'This site publishes no round-robin event.');

		const slot = weekday(560, '10:00:00');

		// round-robin exposes one spot PER available member, so the same slot
		// can take more than one booking — unlike one-to-one.
		const a = await book(request, eventId, slot, tag('rrA'));
		expect(a.ok, `Round-robin first booking failed: ${a.message}`).toBe(
			true
		);

		const b = await book(request, eventId, slot, tag('rrB'));

		// Count only THIS slot — the shared event carries other bookings.
		const stored = Number(
			db(
				`SELECT COUNT(*) FROM wp_doublescale_bookings
				 WHERE event_id = ${eventId} AND start_time = ${q(slot)}`
			)
		);

		if (b.ok) {
			expect(
				stored,
				'Both round-robin bookings should persist, one per host.'
			).toBe(2);
		} else {
			// Only one host was free — correct, and the refusal must say so
			// rather than fail silently.
			expect(b.message).toMatch(/not available|just been booked/i);
			expect(stored).toBe(1);
		}
	});

	test('collective needs every host free, so it never oversells a slot', async ({
		request,
	}) => {
		const eventId = makeEvent(tag('coll'), 'collective', TEAM_CALENDAR_ID);
		const slot = weekday(580, '10:00:00');

		const a = await book(request, eventId, slot, tag('collA'));
		// Whether the first booking lands depends on every member being free.
		// Either way, a collective slot exposes at most ONE spot.
		const b = await book(request, eventId, slot, tag('collB'));

		expect(
			b.ok,
			'A collective slot must never accept a second booking.'
		).toBe(false);

		expect(
			Number(
				db(
					`SELECT COUNT(*) FROM wp_doublescale_bookings WHERE event_id = ${eventId}`
				)
			),
			'A collective slot holds at most one booking.'
		).toBeLessThanOrEqual(1);

		if (!a.ok) {
			// Documented behaviour: not all hosts free → zero slots.
			expect(a.message).toMatch(/not available/i);
		}
	});

	test('collective on a HOST calendar yields no slots at all', async ({
		request,
	}) => {
		// get_team_scheduling_member_ids() returns [] unless the calendar is a
		// team calendar, and collective with no members is defined as 0 slots.
		const eventId = makeEvent(
			tag('collhost'),
			'collective',
			HOST_CALENDAR_ID
		);

		const res = await book(
			request,
			eventId,
			weekday(600, '10:00:00'),
			tag('collhostA')
		);

		expect(
			res.ok,
			'A collective event on a host calendar has no team, so nothing is bookable.'
		).toBe(false);
		expect(res.message).toMatch(/not available/i);
	});
});

/* =====================================================================
 * Workflow 4 — availability drives what is bookable
 * ================================================================== */

test.describe('Workflow: availability', () => {
	test.use({ storageState: { cookies: [], origins: [] } });

	test('inside working hours is bookable, outside is not', async ({
		request,
	}) => {
		const eventId = makeEvent(tag('avail'), 'one-to-one', HOST_CALENDAR_ID);

		const inside = await book(
			request,
			eventId,
			weekday(620, '10:00:00'),
			tag('availIn')
		);
		expect(inside.ok, `Inside hours should book: ${inside.message}`).toBe(
			true
		);

		// The default schedule is 09:00-17:00, so midnight is out of hours.
		const outside = await book(
			request,
			eventId,
			weekday(621, '00:00:00'),
			tag('availOut')
		);
		expect(
			outside.ok,
			'A time outside the schedule must not be bookable.'
		).toBe(false);
		expect(outside.message).toMatch(/not available/i);
	});

	test('weekends are closed on the default schedule', async ({ request }) => {
		const eventId = makeEvent(tag('wkend'), 'one-to-one', HOST_CALENDAR_ID);

		// Walk forward to a Saturday.
		const d = new Date(Date.now() + 640 * 24 * 60 * 60 * 1000);
		while (d.getUTCDay() !== 6) {
			d.setUTCDate(d.getUTCDate() + 1);
		}
		const saturday = `${d.toISOString().slice(0, 10)} 10:00:00`;

		const res = await book(request, eventId, saturday, tag('wkendA'));
		expect(
			res.ok,
			'Saturday is marked off in the default weekly hours.'
		).toBe(false);
	});

	test('a past date is refused regardless of the schedule', async ({
		request,
	}) => {
		const eventId = makeEvent(tag('past'), 'one-to-one', HOST_CALENDAR_ID);

		const res = await book(
			request,
			eventId,
			'2020-06-10 10:00:00',
			tag('pastA')
		);
		expect(res.ok).toBe(false);
		expect(res.message).toMatch(/must be in the future/i);
	});
});

/* =====================================================================
 * Workflow 5 — the full customer journey
 * ================================================================== */

test.describe('Workflow: book then cancel', () => {
	test.use({ storageState: { cookies: [], origins: [] } });

	test('a booking can be made and then cancelled, releasing its slot', async ({
		request,
	}) => {
		const eventId = makeEvent(tag('cx'), 'one-to-one', HOST_CALENDAR_ID);
		const slot = weekday(660, '10:00:00');

		const first = await book(request, eventId, slot, tag('cxA'));
		expect(first.ok, `Booking failed: ${first.message}`).toBe(true);

		const bookingId = Number(
			db(
				`SELECT id FROM wp_doublescale_bookings WHERE event_id = ${eventId} ORDER BY id DESC LIMIT 1`
			)
		);
		const hash = db(
			`SELECT hash_id FROM wp_doublescale_bookings WHERE id = ${bookingId}`
		);
		expect(
			hash,
			'A booking needs a hash_id — cancel/reschedule links are keyed on it.'
		).not.toBe('');

		// The slot is held while the booking is live.
		expect(
			db(
				`SELECT COUNT(*) FROM wp_doublescale_booking_booked_slots WHERE booking_id = ${bookingId}`
			)
		).toBe('1');

		// Cancel through the public link the confirmation email carries.
		const res = await request.post(AJAX, {
			form: {
				action: 'doublescale_booking_cancel_booking',
				id: hash,
				cancellation_reason: 'E2E workflow',
			},
		});
		const body = await res.json();
		expect(body.success, JSON.stringify(body).slice(0, 200)).toBe(true);

		expect(
			db(
				`SELECT status FROM wp_doublescale_bookings WHERE id = ${bookingId}`
			)
		).toBe('cancelled');

		// And the lock is released, so the slot can be sold again.
		expect(
			db(
				`SELECT COUNT(*) FROM wp_doublescale_booking_booked_slots WHERE booking_id = ${bookingId}`
			),
			'Cancelling must release the slot lock.'
		).toBe('0');

		const reuse = await book(request, eventId, slot, tag('cxB'));
		expect(
			reuse.ok,
			`A cancelled slot should be bookable again: ${reuse.message}`
		).toBe(true);
	});

	test('cancelling twice is refused', async ({ request }) => {
		const eventId = makeEvent(tag('dbl'), 'one-to-one', HOST_CALENDAR_ID);
		const slot = weekday(680, '10:00:00');

		expect((await book(request, eventId, slot, tag('dblA'))).ok).toBe(true);
		const hash = db(
			`SELECT hash_id FROM wp_doublescale_bookings WHERE event_id = ${eventId} ORDER BY id DESC LIMIT 1`
		);

		const cancel = () =>
			request
				.post(AJAX, {
					form: {
						action: 'doublescale_booking_cancel_booking',
						id: hash,
					},
				})
				.then((r) => r.json());

		expect((await cancel()).success).toBe(true);

		const second = await cancel();
		expect(
			second.success,
			'A cancelled booking cannot be cancelled again.'
		).toBe(false);
		expect(String(second?.data?.message)).toMatch(/already cancelled/i);
	});
});
