/**
 * Which chrome the builder shows per surface.
 *
 * Regression: the campaign breadcrumb rendered whenever a campaign happened to
 * be in the store, so opening the automation "Send Email" or an email-sequence
 * builder showed "Create Campaign › Standard Campaign › Email Template" over a
 * completely unrelated screen.
 */
import { describe, expect, it } from 'vitest';
import {
	getBuilderMode,
	shouldShowCampaignBreadcrumb,
	shouldShowPreviewButton,
} from './builderMode';

const CAMPAIGN = { hasOnSave: false, hasCampaign: true };
const EMBEDDED_WITH_CACHED_CAMPAIGN = { hasOnSave: true, hasCampaign: true };
const EMBEDDED_CLEAN = { hasOnSave: false, hasCampaign: false };

describe('getBuilderMode', () => {
	it('treats a host-owned save callback as embedded', () => {
		expect(getBuilderMode(EMBEDDED_WITH_CACHED_CAMPAIGN)).toBe('embedded');
	});

	it('treats the standalone campaign screen as campaign mode', () => {
		expect(getBuilderMode(CAMPAIGN)).toBe('campaign');
	});
});

describe('shouldShowCampaignBreadcrumb', () => {
	it('shows the breadcrumb on the campaign screen', () => {
		expect(shouldShowCampaignBreadcrumb(CAMPAIGN)).toBe(true);
	});

	// The actual reported bug.
	it('hides it in embedded mode even when a campaign is cached in the store', () => {
		expect(
			shouldShowCampaignBreadcrumb(EMBEDDED_WITH_CACHED_CAMPAIGN)
		).toBe(false);
	});

	it('hides it when there is no campaign at all', () => {
		expect(shouldShowCampaignBreadcrumb(EMBEDDED_CLEAN)).toBe(false);
	});
});

describe('shouldShowPreviewButton', () => {
	it.each([
		['campaign', CAMPAIGN],
		['embedded (automation / sequence)', EMBEDDED_WITH_CACHED_CAMPAIGN],
		['embedded with no campaign', EMBEDDED_CLEAN],
	])('is available on %s', (_label, input) => {
		expect(shouldShowPreviewButton(input)).toBe(true);
	});
});
