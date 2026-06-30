/**
 * Fetch a tracked email message linked to an activity row.
 */

import apiFetch from '@wordpress/api-fetch';
import { addQueryArgs } from '@wordpress/url';
import type { CampaignEmail } from '@doublescale/client';

interface ContactMessagesResponse {
	messages: {
		data: CampaignEmail[];
		total: number;
	};
}

/**
 * Load the communication-tracking row for a CRM-sent email activity.
 */
export async function fetchContactEmailByActivityId(
	contactId: number,
	activityId: number
): Promise<CampaignEmail | null> {
	const response = (await apiFetch({
		path: addQueryArgs(`/doublescale/v1/contacts/${contactId}/messages`, {
			mode: 'email',
			activity_id: activityId,
			per_page: 1,
			page: 1,
		}),
	})) as ContactMessagesResponse;

	return response.messages?.data?.[0] ?? null;
}
