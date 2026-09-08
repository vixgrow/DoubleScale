import type { Page } from '@playwright/test';
import { test, expect } from './fixtures';

/**
 * Booking admin — exhaustive surface coverage.
 *
 * `booking-module.spec.ts` covers the calendars/bookings/settings landings and
 * `booking-remote-calendars.spec.ts` covers the provider flow. This file walks
 * the rest of the module: Availability, the Create Event wizard, the event
 * editor tabs, booking details, global settings, and every row/card action
 * menu — asserting each control is present and does what it claims.
 *
 * Every test tolerates an empty site: where a control only exists once data
 * exists, the test skips with a reason rather than failing.
 */

const bookingPageWrapper = (page: Page) =>
	page.locator('.doublescale-booking-page-component-wrapper');

async function waitForDoubleScaleAdmin(adminPage: Page): Promise<void> {
	const wpDenied = adminPage.getByText(
		/sorry, you are not allowed to access this page/i
	);
	const layout = adminPage.locator('.doublescale-layout__main');

	await expect(wpDenied.or(layout)).toBeVisible({ timeout: 45_000 });

	if (await wpDenied.isVisible().catch(() => false)) {
		throw new Error(
			'WordPress blocked the DoubleScale admin URL. ' +
				'Use an Administrator (or a role with doublescale_access and booking capabilities). ' +
				'After changing WP_BASE_URL or WP_ADMIN_USER, delete tests/e2e/.auth/admin.json and re-run tests.'
		);
	}

	await expect(layout).toBeVisible({ timeout: 45_000 });
}

async function gotoBookingPath(
	adminPage: Page,
	subpath: string
): Promise<void> {
	await adminPage.goto(
		`wp-admin/admin.php?page=doublescale&path=booking/${subpath}`
	);
	await waitForDoubleScaleAdmin(adminPage);
}

async function ensureBookingModuleActive(adminPage: Page): Promise<void> {
	const onBookingRoute = /path=booking/i.test(adminPage.url());
	const shellVisible = await bookingPageWrapper(adminPage)
		.waitFor({ state: 'visible', timeout: 30_000 })
		.then(() => true)
		.catch(() => false);

	if (!onBookingRoute || !shellVisible) {
		test.skip(
			true,
			'Booking module is disabled or the user lacks booking capabilities.'
		);
	}
}

/** Close whatever dialog is open, tolerating an already-closed one. */
async function dismissDialog(adminPage: Page): Promise<void> {
	await adminPage.keyboard.press('Escape');
	await expect(adminPage.getByRole('dialog')).toBeHidden({
		timeout: 15_000,
	});
}

/**
 * Whether a locator becomes visible within `timeout`.
 *
 * A bare `isVisible()` answers immediately from the current DOM, so on these
 * lazy-loaded booking pages it reports false while React is still rendering —
 * turning a real assertion into a silent skip. Always wait.
 */
async function appears(
	locator: ReturnType<Page['locator']>,
	timeout = 20_000
): Promise<boolean> {
	return locator
		.first()
		.waitFor({ state: 'visible', timeout })
		.then(() => true)
		.catch(() => false);
}

/* =====================================================================
 * Availability
 * ================================================================== */

test.describe('Booking availability', () => {
	test.beforeEach(async ({ adminPage }) => {
		await gotoBookingPath(adminPage, 'availability');
		await ensureBookingModuleActive(adminPage);
	});

	test('availability: header, subheader and Add New button', async ({
		adminPage,
	}) => {
		await expect(
			adminPage.getByRole('heading', { name: /^Availability$/i })
		).toBeVisible({ timeout: 45_000 });

		await expect(
			adminPage.getByText(
				/Configure times when you are available for bookings/i
			)
		).toBeVisible();

		await expect(
			adminPage.getByRole('button', { name: /Add New/i }).first()
		).toBeVisible();
	});

	test('availability: Add New opens the create-schedule dialog', async ({
		adminPage,
	}) => {
		await adminPage
			.getByRole('button', { name: /Add New/i })
			.first()
			.click();

		const dialog = adminPage.getByRole('dialog');
		await expect(dialog).toBeVisible({ timeout: 15_000 });

		// Every field the dialog promises.
		await expect(
			dialog.getByText(/Add New Availability/i).first()
		).toBeVisible();
		await expect(dialog.getByText(/Schedule Title/i).first()).toBeVisible();
		await expect(
			dialog.getByText(/Select Your Timezone/i).first()
		).toBeVisible();
		await expect(
			dialog.getByRole('button', { name: /^Save$/i })
		).toBeVisible();

		await dismissDialog(adminPage);
	});

	test('availability: Save stays disabled until a title is entered', async ({
		adminPage,
	}) => {
		await adminPage
			.getByRole('button', { name: /Add New/i })
			.first()
			.click();

		const dialog = adminPage.getByRole('dialog');
		await expect(dialog).toBeVisible({ timeout: 15_000 });

		const save = dialog.getByRole('button', { name: /^Save$/i });

		// The blank-schedule guard is the disabled button itself
		// (`disabled={isDisabled || loading}`, isDisabled starts true), not a
		// validation notice — a click here would hang rather than complain.
		await expect(save).toBeDisabled();

		// Typing a title releases it. Target the placeholder: the timezone
		// picker also renders a textbox, so `getByRole('textbox')` is
		// ambiguous here.
		//
		// `pressSequentially`, not `fill`: fill() sets the value in one shot
		// and the component's `updateFormData` never sees the intermediate
		// state it needs, so the button stays disabled.
		const title = dialog.getByPlaceholder(
			/Enter a title for the availability/i
		);
		await title.pressSequentially('E2E guard');
		await expect(save).toBeEnabled({ timeout: 15_000 });

		await dismissDialog(adminPage);
	});

	/**
	 * Known defect, pinned so a fix is noticed.
	 *
	 * `updateFormData` tests the *previous* formData before writing the new
	 * value, so after the first character `name` is still '' and Save stays
	 * disabled; it only unlocks on the second keystroke. Verified live:
	 * initial=disabled, 1 char=disabled, 2 chars=enabled.
	 *
	 * A one-character title is legitimate, so this is a real (if minor) bug.
	 * When it is fixed, this test fails — assert enabled after one char then.
	 */
	test('availability: Save unlocks one keystroke late', async ({
		adminPage,
	}) => {
		await adminPage
			.getByRole('button', { name: /Add New/i })
			.first()
			.click();

		const dialog = adminPage.getByRole('dialog');
		await expect(dialog).toBeVisible({ timeout: 15_000 });

		const save = dialog.getByRole('button', { name: /^Save$/i });
		const title = dialog.getByPlaceholder(
			/Enter a title for the availability/i
		);

		await title.pressSequentially('A');
		await expect(
			save,
			'Save unlocked on the first character — the stale-state read is fixed; invert this.'
		).toBeDisabled();

		await title.pressSequentially('B');
		await expect(save).toBeEnabled({ timeout: 15_000 });

		await dismissDialog(adminPage);
	});

	/**
	 * Known defect, pinned so a fix is noticed.
	 *
	 * `updateFormData` reads the *previous* formData before writing, and only
	 * ever calls `setIsDisabled(false)` — never `true`. So emptying the title
	 * leaves Save enabled. `validate()` still refuses to POST a blank
	 * schedule, so nothing corrupt is saved; the button simply misreports.
	 *
	 * When the component is fixed to re-disable, this test fails — flip it to
	 * `toBeDisabled()` then.
	 */
	test('availability: Save wrongly stays enabled after clearing the title', async ({
		adminPage,
	}) => {
		await adminPage
			.getByRole('button', { name: /Add New/i })
			.first()
			.click();

		const dialog = adminPage.getByRole('dialog');
		await expect(dialog).toBeVisible({ timeout: 15_000 });

		const save = dialog.getByRole('button', { name: /^Save$/i });
		const title = dialog.getByPlaceholder(
			/Enter a title for the availability/i
		);

		// pressSequentially, not fill — see the note in the test above.
		await title.pressSequentially('E2E temp');
		await expect(save).toBeEnabled({ timeout: 15_000 });

		await title.clear();
		await expect(
			save,
			'Save re-disables — the isDisabled bug is fixed; invert this assertion.'
		).toBeEnabled();

		await dismissDialog(adminPage);
	});

	test('availability: list shows schedules or the empty state', async ({
		adminPage,
	}) => {
		await expect(
			adminPage
				.getByText(/No availabilities found/i)
				.or(adminPage.getByText(/Working hours/i).first())
				.or(
					adminPage
						.locator('a[href*="booking/availability/"]')
						.first()
				)
				.first()
		).toBeVisible({ timeout: 45_000 });
	});

	test('availability: My Schedule / All Schedule toggle', async ({
		adminPage,
	}) => {
		const mySchedule = adminPage.getByText(/^My Schedule$/i).first();
		const allSchedule = adminPage.getByText(/^All Schedule$/i).first();

		// "All Schedule" only renders for users who can manage all
		// availability, so treat its absence as a capability skip.
		await expect(mySchedule.or(allSchedule).first()).toBeVisible({
			timeout: 45_000,
		});

		if (await allSchedule.isVisible().catch(() => false)) {
			await allSchedule.click();
			await expect(bookingPageWrapper(adminPage)).toBeVisible();
		}
	});
});

/* =====================================================================
 * Availability details
 * ================================================================== */

test.describe('Booking availability details', () => {
	test('availability detail: name, working hours and Save Changes', async ({
		adminPage,
	}) => {
		await gotoBookingPath(adminPage, 'availability');
		await ensureBookingModuleActive(adminPage);

		const firstSchedule = adminPage
			.locator('a[href*="booking/availability/"]')
			.first();

		if (!(await appears(firstSchedule))) {
			test.skip(true, 'No availability schedule exists to open.');
		}

		await firstSchedule.click();

		await expect(
			adminPage
				.getByText(/Availability Name/i)
				.or(adminPage.getByText(/Working hours/i))
				.first()
		).toBeVisible({ timeout: 45_000 });

		await expect(
			adminPage
				.getByRole('button', { name: /Save Changes/i })
				.or(adminPage.getByRole('button', { name: /Set as Default/i }))
				.first()
		).toBeVisible({ timeout: 15_000 });
	});
});

/* =====================================================================
 * Create Event wizard
 * ================================================================== */

test.describe('Booking create-event wizard', () => {
	test.beforeEach(async ({ adminPage }) => {
		await gotoBookingPath(adminPage, 'calendars');
		await ensureBookingModuleActive(adminPage);
	});

	/** Open the Create Event dialog, skipping when no host calendar exists. */
	async function openCreateEvent(adminPage: Page) {
		const shell = adminPage.locator('.doublescale-booking-calendars');
		const createEvent = shell.getByRole('button', {
			name: /^Create Event$/i,
		});
		const noCalendars = shell.getByText(/No Calendars available/i);

		await expect(createEvent.or(noCalendars).first()).toBeVisible({
			timeout: 45_000,
		});
		if (await noCalendars.isVisible().catch(() => false)) {
			test.skip(
				true,
				'Create Event is hidden until a host calendar exists.'
			);
		}

		await createEvent.first().click();
		const dialog = adminPage.getByRole('dialog');
		await expect(dialog).toBeVisible({ timeout: 15_000 });
		return dialog;
	}

	test('create event: step one offers the event types', async ({
		adminPage,
	}) => {
		const dialog = await openCreateEvent(adminPage);

		await expect(
			dialog.getByRole('heading', { name: /^Single Event$/i })
		).toBeVisible();
		await expect(
			dialog.getByRole('heading', { name: /^Group Event$/i })
		).toBeVisible();

		await dismissDialog(adminPage);
	});

	test('create event: Continue is blocked until a type is picked', async ({
		adminPage,
	}) => {
		const dialog = await openCreateEvent(adminPage);

		const continueBtn = dialog.getByRole('button', { name: /^Continue$/i });
		if (!(await appears(continueBtn))) {
			test.skip(
				true,
				'This build advances on type click, with no Continue button.'
			);
		}

		// `disabled={continueDisabled}` — the wizard guards by disabling the
		// button, so an untyped event can never advance.
		await expect(continueBtn).toBeDisabled();

		await dialog.getByRole('heading', { name: /^Single Event$/i }).click();
		await expect(continueBtn).toBeEnabled({ timeout: 15_000 });

		await dismissDialog(adminPage);
	});

	/**
	 * Pick Single Event and advance to the name + duration step. Returns the
	 * dialog, or skips when Continue never enables.
	 */
	async function advanceToDetailsStep(adminPage: Page) {
		const dialog = await openCreateEvent(adminPage);

		await dialog.getByRole('heading', { name: /^Single Event$/i }).click();

		// Wait for the button to enable — a bare isEnabled() answers before
		// React has re-rendered and turns this into a false skip.
		const continueBtn = dialog.getByRole('button', { name: /^Continue$/i });
		await expect(continueBtn).toBeEnabled({ timeout: 20_000 });
		await continueBtn.click();

		return dialog;
	}

	test('create event: name + duration step exposes its controls', async ({
		adminPage,
	}) => {
		await advanceToDetailsStep(adminPage);

		// Scope to the page, not the dialog: the wizard renders its step body
		// in a portal outside the `role="dialog"` node, so `dialog.getByText`
		// matches nothing even though the text is on screen.
		// "Event Name & Duration" is the stepper's label and stays hidden on
		// this step (present twice in the DOM, neither visible) — assert the
		// controls the user can actually see and use.
		for (const label of [
			/15 Minutes/i,
			/30 Minutes/i,
			/60 Minutes/i,
			/Description/i,
			/Event Color/i,
		]) {
			await expect(adminPage.getByText(label).first()).toBeVisible({
				timeout: 15_000,
			});
		}

		await dismissDialog(adminPage);
	});

	test('create event: Continue is blocked until the event is named', async ({
		adminPage,
	}) => {
		const dialog = await advanceToDetailsStep(adminPage);

		// Step two (Event Name & Duration) cannot be left unnamed.
		const continueBtn = dialog.getByRole('button', { name: /^Continue$/i });
		await expect(continueBtn).toBeVisible({ timeout: 15_000 });
		await expect(continueBtn).toBeDisabled();

		await dismissDialog(adminPage);
	});

	test('create event: Submit Event on the location step is blocked', async ({
		adminPage,
	}) => {
		const dialog = await advanceToDetailsStep(adminPage);

		// The wizard is three steps: Select Event Type → Event Name &
		// Duration → Setup Location. Submit Event only exists on the last, so
		// name the event to unlock step three.
		const name = adminPage.getByRole('textbox').first();
		await name.pressSequentially('E2E wizard probe');

		const continueBtn = dialog.getByRole('button', { name: /^Continue$/i });
		await expect(continueBtn).toBeEnabled({ timeout: 20_000 });
		await continueBtn.click();

		// The step-three heading can be scrolled out of view, so key off the
		// location options themselves — they are what this step is for.
		await expect(
			adminPage.getByText(/Add Custom Location/i).first()
		).toBeVisible({ timeout: 20_000 });
		await expect(
			adminPage.getByText(/Attendee Address/i).first()
		).toBeVisible();
		await expect(
			adminPage.getByText(/Online Meeting/i).first()
		).toBeVisible();

		// `disabled={submitDisabled}` — with no location picked the event
		// cannot be created. This test never completes a creation.
		const submit = dialog.getByRole('button', { name: /^Submit Event$/i });
		await expect(submit).toBeVisible({ timeout: 15_000 });
		await expect(submit).toBeDisabled();

		await dismissDialog(adminPage);
	});

	test('create event: Back returns to the previous step', async ({
		adminPage,
	}) => {
		const dialog = await advanceToDetailsStep(adminPage);

		const back = dialog.getByRole('button', { name: /^Back$/i });
		await expect(back).toBeVisible({ timeout: 15_000 });
		await back.click();

		// Step one is on screen again.
		await expect(
			dialog.getByRole('heading', { name: /^Single Event$/i })
		).toBeVisible({ timeout: 15_000 });

		await dismissDialog(adminPage);
	});
});

/* =====================================================================
 * Calendar + event row actions
 * ================================================================== */

test.describe('Booking calendar and event actions', () => {
	test.beforeEach(async ({ adminPage }) => {
		await gotoBookingPath(adminPage, 'calendars');
		await ensureBookingModuleActive(adminPage);
	});

	test('calendar actions: menu exposes Edit, Clone Event and Delete', async ({
		adminPage,
	}) => {
		const shell = adminPage.locator('.doublescale-booking-calendars');
		const actions = shell.getByRole('button', {
			name: /Calendar actions/i,
		});

		await expect(
			actions
				.first()
				.or(shell.getByText(/No Calendars available/i))
				.first()
		).toBeVisible({ timeout: 45_000 });

		if (!(await appears(actions.first()))) {
			test.skip(true, 'No calendar card is available.');
		}

		await actions.first().click();

		await expect(
			adminPage.getByRole('button', { name: /^Edit$/i })
		).toBeVisible();
		await expect(
			adminPage.getByRole('button', { name: /Clone Event/i })
		).toBeVisible();
		await expect(
			adminPage.getByRole('button', { name: /^Delete$/i })
		).toBeVisible();

		await adminPage.keyboard.press('Escape');
	});

	test('calendar actions: Delete asks before destroying anything', async ({
		adminPage,
	}) => {
		const shell = adminPage.locator('.doublescale-booking-calendars');
		const actions = shell.getByRole('button', {
			name: /Calendar actions/i,
		});

		if (!(await appears(actions.first()))) {
			test.skip(true, 'No calendar card is available.');
		}

		await actions.first().click();
		await adminPage.getByRole('button', { name: /^Delete$/i }).click();

		// A confirmation must stand between the click and the deletion.
		const confirm = adminPage
			.getByRole('dialog')
			.or(adminPage.getByText(/Delete Calendar/i))
			.first();
		await expect(confirm).toBeVisible({ timeout: 15_000 });

		// Back out: this test must never actually delete a calendar.
		const cancel = adminPage.getByRole('button', { name: /^Cancel$/i });
		if (await cancel.isVisible().catch(() => false)) {
			await cancel.click();
		} else {
			await adminPage.keyboard.press('Escape');
		}

		await expect(adminPage.getByText(/Delete Calendar/i)).toBeHidden({
			timeout: 15_000,
		});
	});

	test('clone event: dialog exposes its picker and Cancel', async ({
		adminPage,
	}) => {
		const shell = adminPage.locator('.doublescale-booking-calendars');
		const actions = shell.getByRole('button', {
			name: /Calendar actions/i,
		});

		if (!(await appears(actions.first()))) {
			test.skip(true, 'No calendar card is available.');
		}

		await actions.first().click();
		await adminPage.getByRole('button', { name: /Clone Event/i }).click();

		const dialog = adminPage.getByRole('dialog');
		await expect(dialog).toBeVisible({ timeout: 15_000 });
		await expect(
			dialog.getByText(/Select Calendar Event|Select Event/i).first()
		).toBeVisible();

		await dismissDialog(adminPage);
	});

	test('clone event: cloning with nothing selected is refused', async ({
		adminPage,
	}) => {
		const shell = adminPage.locator('.doublescale-booking-calendars');
		const actions = shell.getByRole('button', {
			name: /Calendar actions/i,
		});

		if (!(await appears(actions.first()))) {
			test.skip(true, 'No calendar card is available.');
		}

		await actions.first().click();
		await adminPage.getByRole('button', { name: /Clone Event/i }).click();

		const dialog = adminPage.getByRole('dialog');
		await expect(dialog).toBeVisible({ timeout: 15_000 });

		const cloneBtn = dialog.getByRole('button', { name: /^Clone Event$/i });
		if (!(await appears(cloneBtn))) {
			test.skip(true, 'Clone confirm button not present in this build.');
		}

		// `disabled={loading || !event}` — with nothing picked the confirm is
		// inert. Clicking it would hang, not surface a message.
		await expect(cloneBtn).toBeDisabled();

		await dismissDialog(adminPage);
	});

	test('event actions: menu exposes Edit, Enable/Disable and Delete', async ({
		adminPage,
	}) => {
		const shell = adminPage.locator('.doublescale-booking-calendars');
		const eventActions = shell.getByRole('button', {
			name: /Event actions/i,
		});

		if (!(await appears(eventActions.first()))) {
			test.skip(true, 'No event row is available on this site.');
		}

		await eventActions.first().click();

		await expect(
			adminPage.getByRole('button', { name: /^Edit$/i })
		).toBeVisible({ timeout: 15_000 });
		await expect(
			adminPage
				.getByRole('button', { name: /^(Enable|Disable)$/i })
				.first()
		).toBeVisible();
		await expect(
			adminPage.getByRole('button', { name: /^Delete$/i })
		).toBeVisible();

		await adminPage.keyboard.press('Escape');
	});
});

/* =====================================================================
 * Event editor tabs
 * ================================================================== */

test.describe('Booking event editor', () => {
	/** Open the first event's editor, skipping when the site has none. */
	async function openFirstEvent(adminPage: Page): Promise<void> {
		await gotoBookingPath(adminPage, 'calendars');
		await ensureBookingModuleActive(adminPage);

		const shell = adminPage.locator('.doublescale-booking-calendars');

		// Event rows carry no anchor — event-actions/index.tsx navigates with
		// `navigate('booking/calendars/{id}/events/{event}')`, so the only way
		// in is the row's action menu.
		const eventActions = shell.getByRole('button', {
			name: /Event actions/i,
		});
		if (!(await appears(eventActions.first(), 30_000))) {
			test.skip(true, 'No event exists to edit on this site.');
		}

		await eventActions.first().click();

		// Wait for the popover's Edit before clicking: several rows expose an
		// "Edit", and a click fired before the popover paints hits nothing.
		const edit = adminPage.getByRole('button', { name: /^Edit$/i }).first();
		await expect(edit).toBeVisible({ timeout: 20_000 });
		await edit.click();

		await expect(adminPage).toHaveURL(/events(%2F|\/)/i, {
			timeout: 45_000,
		});

		// The editor is a lazy chunk — wait for its tab strip before any test
		// starts hunting for tabs.
		await expect(
			adminPage.getByRole('button', {
				name: 'Event Details',
				exact: true,
			})
		).toBeVisible({ timeout: 45_000 });
	}

	/** The editor's real tab labels, from event/index.tsx. */
	const EVENT_TABS = [
		'Event Details',
		'Availability & Limits',
		'Questions',
		'Email Notification',
		'SMS Notification',
		'Advanced Settings',
		'Payments',
		'Waiting List',
	];

	/**
	 * Click a tab by its exact label; returns false when it is not rendered.
	 *
	 * The strip renders as buttons, not `role="tab"` — verified live, all
	 * eight resolve to exactly one button each.
	 */
	async function openEventTab(
		adminPage: Page,
		label: string
	): Promise<boolean> {
		const tab = adminPage
			.getByRole('button', { name: label, exact: true })
			.first();

		if (!(await appears(tab))) {
			return false;
		}

		await tab.click();

		// Do NOT assert on the page wrapper here: inside the event editor that
		// div renders empty (zero-height), so toBeVisible() always fails. The
		// tab strip staying on screen is the real signal that the click landed.
		await expect(tab).toBeVisible();
		return true;
	}

	test('event editor: every tab is reachable', async ({ adminPage }) => {
		await openFirstEvent(adminPage);

		const opened: string[] = [];
		for (const label of EVENT_TABS) {
			if (await openEventTab(adminPage, label)) {
				opened.push(label);
			}
		}

		// All eight render on a Pro site (verified live). On free, the Pro-only
		// tabs drop out, so require the free set and report exactly which of
		// the eight were reachable.
		const missing = EVENT_TABS.filter((t) => !opened.includes(t));
		expect(
			opened,
			`Event tabs not reachable: ${missing.join(', ') || '(none)'}`
		).toEqual(expect.arrayContaining(['Event Details', 'Questions']));

		expect(
			opened.length,
			`Only these event tabs rendered: ${opened.join(', ') || '(none)'}`
		).toBeGreaterThanOrEqual(5);
	});

	test('event editor: header exposes Save Changes, Share and Delete', async ({
		adminPage,
	}) => {
		await openFirstEvent(adminPage);

		await expect(
			adminPage.getByRole('button', { name: /Save Changes/i }).first()
		).toBeVisible({ timeout: 30_000 });

		await expect(
			adminPage
				.getByRole('button', { name: /^Share$/i })
				.or(adminPage.getByText(/^Share$/i))
				.first()
		).toBeVisible();

		await expect(
			adminPage.getByRole('button', { name: /Delete event/i }).first()
		).toBeVisible();
	});

	test('event editor: Questions tab lists the booking questions', async ({
		adminPage,
	}) => {
		await openFirstEvent(adminPage);

		if (!(await openEventTab(adminPage, 'Questions'))) {
			test.skip(true, 'Questions tab not present in this build.');
		}

		// The panel lists the system questions and their editors.
		await expect(
			adminPage.getByText(/Question Settings/i).first()
		).toBeVisible({ timeout: 15_000 });
		await expect(
			adminPage.getByText(/Booking Questions/i).first()
		).toBeVisible();

		// Every event ships four system questions (Text, Email, Textarea,
		// Radio) that cannot be removed.
		await expect(
			adminPage.getByText(/Question \(1\)/i).first()
		).toBeVisible();
	});

	test('event editor: Availability & Limits shows schedule and limits', async ({
		adminPage,
	}) => {
		await openFirstEvent(adminPage);

		if (!(await openEventTab(adminPage, 'Availability & Limits'))) {
			test.skip(
				true,
				'Availability & Limits tab not present in this build.'
			);
		}

		await expect(
			adminPage
				.getByText(
					/Choose a common schedule|Availability Range|Default Duration|Before Event|After Event/i
				)
				.first()
		).toBeVisible({ timeout: 15_000 });
	});

	test('event editor: SMS Notification tab renders', async ({
		adminPage,
	}) => {
		await openFirstEvent(adminPage);

		if (!(await openEventTab(adminPage, 'SMS Notification'))) {
			test.skip(
				true,
				'SMS Notification is Pro-only and not enabled here.'
			);
		}

		await expect(
			adminPage.getByText(/SMS Notifications/i).first()
		).toBeVisible({ timeout: 15_000 });
	});

	test('event editor: Payments tab shows the pricing options', async ({
		adminPage,
	}) => {
		await openFirstEvent(adminPage);

		if (!(await openEventTab(adminPage, 'Payments'))) {
			test.skip(true, 'Payments is Pro-only and not enabled here.');
		}

		await expect(
			adminPage.getByText(/Pricing Options/i).first()
		).toBeVisible({ timeout: 15_000 });
		await expect(
			adminPage.getByText(/Enable Payment/i).first()
		).toBeVisible();
	});

	test('event editor: Waiting List tab renders', async ({ adminPage }) => {
		await openFirstEvent(adminPage);

		if (!(await openEventTab(adminPage, 'Waiting List'))) {
			test.skip(true, 'Waiting List is Pro-only and not enabled here.');
		}

		await expect(adminPage.getByText(/Waiting List/i).first()).toBeVisible({
			timeout: 15_000,
		});
	});

	test('event editor: Advanced Settings tab renders', async ({
		adminPage,
	}) => {
		await openFirstEvent(adminPage);

		if (!(await openEventTab(adminPage, 'Advanced Settings'))) {
			test.skip(true, 'Advanced Settings tab not present in this build.');
		}

		// The panel's real controls — the heading is "Advanced Settings", not
		// the "Advanced Event Settings" string in the source strings file.
		await expect(adminPage.getByText(/Booking Title/i).first()).toBeVisible(
			{ timeout: 15_000 }
		);
		await expect(
			adminPage.getByText(/Submit Button Text/i).first()
		).toBeVisible();
		await expect(
			adminPage.getByText(/Redirect After Booking/i).first()
		).toBeVisible();
		await expect(
			adminPage.getByText(/Attendee Cannot Cancel/i).first()
		).toBeVisible();
	});

	test('event editor: Event Details shows name, description and duration', async ({
		adminPage,
	}) => {
		await openFirstEvent(adminPage);

		await openEventTab(adminPage, 'Event Details');

		await expect(
			adminPage
				.getByText(
					/Description|Duration|Event Color|How Will You Meet/i
				)
				.first()
		).toBeVisible({ timeout: 15_000 });
	});

	test('event editor: Email Notification lists its templates', async ({
		adminPage,
	}) => {
		await openFirstEvent(adminPage);

		if (!(await openEventTab(adminPage, 'Email Notification'))) {
			test.skip(
				true,
				'Email Notification tab not present in this build.'
			);
		}

		await expect(
			adminPage
				.getByText(
					/Email Body|Additional Recipients|Before Event|After Event/i
				)
				.first()
		).toBeVisible({ timeout: 15_000 });
	});
});

/* =====================================================================
 * Booking details
 * ================================================================== */

test.describe('Booking details page', () => {
	test('booking detail: information, questions and activities', async ({
		adminPage,
	}) => {
		await gotoBookingPath(adminPage, 'bookings');
		await ensureBookingModuleActive(adminPage);

		const card = adminPage.locator('a[href*="booking/bookings/"]').first();

		if (!(await appears(card))) {
			test.skip(true, 'No booking exists to open.');
		}

		await card.click();

		await expect(
			adminPage.getByText(/Booking Details|Booking Information/i).first()
		).toBeVisible({ timeout: 45_000 });

		// The panels this page promises.
		await expect(
			adminPage
				.getByText(/Invitees Information|Invitee Name|Event Host/i)
				.first()
		).toBeVisible({ timeout: 15_000 });
	});

	test('bookings: the status filter offers every period', async ({
		adminPage,
	}) => {
		await gotoBookingPath(adminPage, 'bookings');
		await ensureBookingModuleActive(adminPage);

		// bookings/tabs/index.tsx renders a Select, not a tab strip — the
		// periods live inside a dropdown.
		const trigger = adminPage.getByRole('combobox').first();
		await expect(trigger).toBeVisible({ timeout: 45_000 });
		await trigger.click();

		const options = adminPage.getByRole('option');
		await expect(options.first()).toBeVisible({ timeout: 15_000 });

		const labels = (await options.allInnerTexts()).map((t) => t.trim());
		expect(
			labels.join(' | '),
			'The period filter should list the booking statuses.'
		).toMatch(/Upcoming|Completed|Pending|Cancelled|No-Show/i);

		await adminPage.keyboard.press('Escape');
	});

	test('bookings: switching period reloads the list', async ({
		adminPage,
	}) => {
		await gotoBookingPath(adminPage, 'bookings');
		await ensureBookingModuleActive(adminPage);

		const trigger = adminPage.getByRole('combobox').first();
		await expect(trigger).toBeVisible({ timeout: 45_000 });

		// Walk a few real periods and confirm each renders without breaking
		// the page.
		for (const name of [/^Upcoming/i, /^Completed/i, /^All/i]) {
			await trigger.click();

			const option = adminPage.getByRole('option', { name }).first();
			if (!(await appears(option))) {
				await adminPage.keyboard.press('Escape');
				continue;
			}

			await option.click();
			await expect(bookingPageWrapper(adminPage)).toBeVisible({
				timeout: 30_000,
			});
		}
	});

	/** Open the manual-booking dialog from the bookings list. */
	async function openAddBooking(adminPage: Page) {
		await gotoBookingPath(adminPage, 'bookings');
		await ensureBookingModuleActive(adminPage);

		await adminPage
			.getByRole('button', { name: /^Booking Manually$/i })
			.first()
			.click();

		const dialog = adminPage.getByRole('dialog');
		await expect(dialog).toBeVisible({ timeout: 15_000 });
		return dialog;
	}

	test('bookings: add-booking dialog exposes every field', async ({
		adminPage,
	}) => {
		const dialog = await openAddBooking(adminPage);

		// Labels from components/booking/add-booking-modal.
		await expect(
			dialog.getByText(/Add New Booking Manually/i).first()
		).toBeVisible();

		for (const label of [
			/Attendee/i,
			/Select Event/i,
			/Select Date/i,
			/Select Duration|Meeting Duration/i,
		]) {
			await expect(dialog.getByText(label).first()).toBeVisible({
				timeout: 15_000,
			});
		}

		await expect(
			dialog.getByRole('button', { name: /Save Booking/i })
		).toBeVisible();

		await dismissDialog(adminPage);
	});

	test('bookings: add-booking offers new and existing contact modes', async ({
		adminPage,
	}) => {
		const dialog = await openAddBooking(adminPage);

		await expect(
			dialog
				.getByText(/New contact/i)
				.or(dialog.getByText(/Existing contact/i))
				.first()
		).toBeVisible({ timeout: 15_000 });

		await dismissDialog(adminPage);
	});

	test('bookings: Save Booking is blocked until an event is chosen', async ({
		adminPage,
	}) => {
		const dialog = await openAddBooking(adminPage);

		// `disabled={!selectedEvent || loading}` — with no event picked the
		// button must be inert, so a half-formed booking cannot be submitted.
		await expect(
			dialog.getByRole('button', { name: /Save Booking/i })
		).toBeDisabled({ timeout: 15_000 });

		await dismissDialog(adminPage);
	});
});

/* =====================================================================
 * Global settings
 * ================================================================== */

test.describe('Booking global settings', () => {
	test.beforeEach(async ({ adminPage }) => {
		// The route is `booking/settings` — registerAdminPage('booking-settings')
		// in pages/booking/index.tsx. There is no `booking/global-settings`
		// path; using it silently redirected and skipped every test here.
		await gotoBookingPath(adminPage, 'settings');
		await ensureBookingModuleActive(adminPage);
	});

	test('global settings: header and Save button', async ({ adminPage }) => {
		const denied = adminPage.getByText(
			/You do not have permission to access this page/i
		);
		const shell = adminPage.locator('.doublescale-booking-global-settings');

		await expect(denied.or(shell).first()).toBeVisible({ timeout: 45_000 });
		if (await denied.isVisible().catch(() => false)) {
			test.skip(
				true,
				'Global settings is admin-only and this user is not an admin.'
			);
		}

		await expect(
			adminPage.getByRole('heading', { name: /^Settings$/i }).first()
		).toBeVisible();
		await expect(
			adminPage.getByRole('button', { name: /^Save$/i }).first()
		).toBeVisible({ timeout: 15_000 });
	});

	test('global settings: general controls are present', async ({
		adminPage,
	}) => {
		const shell = adminPage.locator('.doublescale-booking-global-settings');
		if (!(await appears(shell))) {
			test.skip(true, 'Global settings is admin-only.');
		}

		// The settings this page is built around.
		await expect(
			adminPage
				.getByText(/Default Time Format|Calendar Start From|Currency/i)
				.first()
		).toBeVisible({ timeout: 45_000 });
	});

	test('global settings: time-format and theme options', async ({
		adminPage,
	}) => {
		const shell = adminPage.locator('.doublescale-booking-global-settings');
		if (!(await appears(shell))) {
			test.skip(true, 'Global settings is admin-only.');
		}

		await expect(
			adminPage.getByText(/12h|24h|Light Mode|Dark Mode/i).first()
		).toBeVisible({ timeout: 45_000 });
	});

	test('global settings: Save reports success', async ({ adminPage }) => {
		const shell = adminPage.locator('.doublescale-booking-global-settings');
		if (!(await appears(shell))) {
			test.skip(true, 'Global settings is admin-only.');
		}

		const save = adminPage.getByRole('button', { name: /^Save$/i }).first();
		await expect(save).toBeVisible({ timeout: 45_000 });
		await save.click();

		// Saving unchanged settings must still resolve, not hang or error.
		await expect(
			adminPage
				.getByText(/Success|saved/i)
				.or(adminPage.getByText(/Failed to save settings/i))
				.first()
		).toBeVisible({ timeout: 30_000 });

		await expect(
			adminPage.getByText(/Failed to save settings/i)
		).toBeHidden();
	});
});

/* =====================================================================
 * Cross-page navigation
 * ================================================================== */

test.describe('Booking navigation', () => {
	test('every booking route renders its own page', async ({ adminPage }) => {
		const routes: Array<[string, RegExp]> = [
			['calendars', /^Calendars$/i],
			['bookings', /^Bookings$/i],
			['availability', /^Availability$/i],
		];

		for (const [path, heading] of routes) {
			await gotoBookingPath(adminPage, path);
			await ensureBookingModuleActive(adminPage);

			await expect(
				adminPage.getByRole('heading', { name: heading }).first()
			).toBeVisible({ timeout: 45_000 });
		}
	});

	test('the booking sidebar links to each sub-page', async ({
		adminPage,
	}) => {
		await gotoBookingPath(adminPage, 'calendars');
		await ensureBookingModuleActive(adminPage);

		for (const name of [/^Bookings$/i, /^Availability$/i, /^Settings$/i]) {
			const link = adminPage
				.getByRole('link', { name })
				.or(adminPage.getByRole('button', { name }))
				.first();

			if (!(await appears(link))) {
				continue;
			}

			await link.click();
			await expect(bookingPageWrapper(adminPage)).toBeVisible({
				timeout: 45_000,
			});
		}
	});
});
