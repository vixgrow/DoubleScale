/**
 * Helpers for distinguishing CRM-sent emails from manually logged emails.
 *
 * Both use activity_type `email_sent`; manual logs set data.source = 'manual'.
 */

export type EmailActivitySource = 'manual' | 'sent';

/**
 * True when the activity was created via "Add Log Email" (not sent through CRM).
 */
export function isManualEmailLog(
	data?: Record<string, unknown> | null
): boolean {
	if (!data) {
		return false;
	}

	if (data.source === 'manual') {
		return true;
	}

	if (data.source === 'sent') {
		return false;
	}

	// Legacy rows: manual logs store sent_at but never delivery metadata.
	const sentAt = data.sent_at;
	const hasSentAt =
		typeof sentAt === 'string' ? sentAt.trim() !== '' : Boolean(sentAt);

	return (
		hasSentAt &&
		!data.message_id &&
		!data.from_email
	);
}

/**
 * Display key used for icons / badge styling in activity timelines.
 */
export function getEmailActivityDisplayType(
	data?: Record<string, unknown> | null
): 'email_sent' | 'email_logged' {
	return isManualEmailLog(data) ? 'email_logged' : 'email_sent';
}
