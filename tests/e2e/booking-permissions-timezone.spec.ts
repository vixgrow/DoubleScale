import { test, expect, type APIRequestContext } from '@playwright/test';
import { execFileSync } from 'node:child_process';
import {
	activePublicEventId,
	db,
	q,
	SITE,
	WP_PATH,
} from './booking-public-helpers';

const AJAX = `${SITE}/wp-admin/admin-ajax.php`;

function futureWeekday(daysOut: number, time: string): string {
	const d = new Date(Date.now() + daysOut * 24 * 60 * 60 * 1000);
	while (d.getUTCDay() === 0 || d.getUTCDay() === 6) {
		d.setUTCDate(d.getUTCDate() + 1);
	}
	return `${d.toISOString().slice(0, 10)} ${time}`;
}

async function createPublicBooking(request: APIRequestContext, eventId: number) {
	const name = `E2E-Perm-${Date.now().toString(36)}`;
	const email = `${name.toLowerCase()}@example.test`;
	const start = futureWeekday(90, '10:00:00');
	const res = await request.post(AJAX, {
		form: {
			action: 'doublescale_booking_booking',
			id: String(eventId),
			timezone: 'UTC',
			duration: '30',
			start_date: start,
			location: JSON.stringify({
				type: 'attendee_phone',
				value: '+15551234567',
			}),
			invitees: JSON.stringify([{ name, email }]),
		},
	});
	const body = await res.json();
	expect(body.success, JSON.stringify(body).slice(0, 300)).toBe(true);
	const hash = db(
		`SELECT b.hash_id FROM wp_doublescale_bookings b
		 JOIN wp_doublescale_contacts c ON c.id = b.contact_id
		 WHERE c.email = ${q(email)} LIMIT 1`
	);
	expect(hash).not.toBe('');
	return { hash, email, eventId };
}

function patchAttendeeCannotCancel(eventId: number, enabled: boolean): string {
	const flag = enabled ? 'true' : 'false';
	return execFileSync(
		'wp',
		[
			'eval',
			`$row = $GLOBALS['wpdb']->get_row($GLOBALS['wpdb']->prepare(
				"SELECT meta_value FROM {$GLOBALS['wpdb']->prefix}doublescale_booking_events_meta WHERE event_id = %d AND meta_key = 'advanced_settings' LIMIT 1",
				${eventId}
			));
			$d = maybe_unserialize($row ? $row->meta_value : '');
			if (!is_array($d)) { $d = array(); }
			$d['attendee_cannot_cancel'] = ${flag};
			$d['permission_denied_message'] = '';
			$exists = $GLOBALS['wpdb']->get_var($GLOBALS['wpdb']->prepare(
				"SELECT COUNT(*) FROM {$GLOBALS['wpdb']->prefix}doublescale_booking_events_meta WHERE event_id = %d AND meta_key = 'advanced_settings'",
				${eventId}
			));
			if ($exists) {
				$GLOBALS['wpdb']->update(
					$GLOBALS['wpdb']->prefix . 'doublescale_booking_events_meta',
					array('meta_value' => serialize($d)),
					array('event_id' => ${eventId}, 'meta_key' => 'advanced_settings')
				);
			} else {
				$GLOBALS['wpdb']->insert(
					$GLOBALS['wpdb']->prefix . 'doublescale_booking_events_meta',
					array('event_id' => ${eventId}, 'meta_key' => 'advanced_settings', 'meta_value' => serialize($d))
				);
			}
			echo 'ok';`,
			`--path=${WP_PATH}`,
		],
		{ encoding: 'utf8', timeout: 30_000 }
	).trim();
}

function cleanupBooking(email: string): void {
	try {
		db(
			`DELETE s FROM wp_doublescale_booking_booked_slots s
			 JOIN wp_doublescale_bookings b ON b.id = s.booking_id
			 JOIN wp_doublescale_contacts c ON c.id = b.contact_id
			 WHERE c.email = ${q(email)}`
		);
		db(
			`DELETE b FROM wp_doublescale_bookings b
			 JOIN wp_doublescale_contacts c ON c.id = b.contact_id
			 WHERE c.email = ${q(email)}`
		);
		db(`DELETE FROM wp_doublescale_contacts WHERE email = ${q(email)}`);
	} catch {
		/* best effort */
	}
}

test.describe('Booking permissions and timezone', () => {
	test.use({ storageState: { cookies: [], origins: [] } });

	test('cancel denied when attendee cannot cancel', async ({ page, request }) => {
		const eventId = activePublicEventId();
		if (!eventId) {
			test.skip(true, 'No active public booking event with availability exists.');
		}

		const booking = await createPublicBooking(request, eventId);
		try {
			expect(patchAttendeeCannotCancel(eventId, true)).toBe('ok');

			await page.goto(
				`${SITE}/?doublescale_booking=booking&id=${encodeURIComponent(booking.hash)}&type=cancel`
			);
			await expect(page.locator('.cancellation-denied-message')).toBeVisible({
				timeout: 30_000,
			});
			await expect(
				page.getByText(/do not have permission to (cancel|view)/i)
			).toBeVisible();
			await expect(page.locator('#cancel_booking_button')).toHaveCount(0);
		} finally {
			patchAttendeeCannotCancel(eventId, false);
			cleanupBooking(booking.email);
		}
	});
});
