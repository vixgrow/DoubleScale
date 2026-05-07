/**
 * Custom hook for resending emails (campaign or individual)
 *
 * Handles resending both campaign emails and individual emails
 * with proper validation, loading states, and error handling.
 *
 * @since 1.0.0
 */

import { useState, useCallback } from '@wordpress/element';
import apiFetch from '@wordpress/api-fetch';
import { __ } from '@wordpress/i18n';
import { useDispatch } from '@wordpress/data';
import type { Contact, CampaignEmail } from '@doublescale/client';
import { useSendMessage } from './use-send-message';

/**
 * Hook options interface
 */
interface UseResendEmailOptions {
	/** Contact to resend email to */
	contact: Contact | null;
	/** Callback after successful resend */
	onSuccess?: () => void;
	/** Callback after failed resend */
	onError?: (error: string) => void;
}

/**
 * Hook return interface
 */
interface UseResendEmailReturn {
	/** Whether email is currently being resent */
	isResending: boolean;
	/** Resend email function */
	resendEmail: (campaignEmail: CampaignEmail) => Promise<boolean>;
}

/**
 * Message source types (matches backend enum)
 */
const MESSAGE_SOURCE_TYPES = {
	CAMPAIGN: 1,
	AUTOMATION: 2,
	ACTIVITY: 3,
} as const;

/**
 * Custom hook to resend emails
 *
 * @example
 * ```tsx
 * const { isResending, resendEmail } = useResendEmail({
 *   contact,
 *   onSuccess: () => {
 *     console.log('Email resent!');
 *     refetchMessages();
 *   }
 * });
 *
 * // Resend campaign email
 * await resendEmail(campaignEmailObject);
 *
 * // Resend individual email
 * await resendEmail(individualEmailObject);
 * ```
 */
export const useResendEmail = ({
	contact,
	onSuccess,
	onError,
}: UseResendEmailOptions): UseResendEmailReturn => {
	const [isResending, setIsResending] = useState<boolean>(false);
	const { createNotice } = useDispatch('doublescale/core');

	// Use the send message hook for individual emails
	const { sendMessage, isSending: isSendingIndividual } = useSendMessage({
		contact,
		channel: 'email',
		onSuccess: () => {
			setIsResending(false);
			onSuccess?.();
		},
		onError: (error) => {
			setIsResending(false);
			onError?.(error);
		},
	});

	/**
	 * Resend a campaign email via the campaign endpoint
	 */
	const resendCampaignEmail = async (
		campaignEmail: CampaignEmail
	): Promise<boolean> => {
		try {
			await apiFetch({
				path: `/qc/v1/campaigns/${campaignEmail.source_id}/messages/${campaignEmail.id}/resend`,
				method: 'POST',
			});

			createNotice({
				type: 'success',
				message: __('Email queued for resending!', 'doublescale'),
			});

			onSuccess?.();
			return true;
		} catch (err: any) {
			const errorMessage =
				err.message || __('Failed to resend campaign email', 'doublescale');

			createNotice({
				type: 'error',
				message: errorMessage,
			});

			onError?.(errorMessage);
			console.error('[useResendEmail] Error resending campaign email:', err);
			return false;
		}
	};

	/**
	 * Resend an individual email via the contact send-message endpoint
	 */
	const resendIndividualEmail = async (
		campaignEmail: CampaignEmail
	): Promise<boolean> => {
		// Extract email data from the message
		const subject =
			campaignEmail.template?.subject ||
			campaignEmail.activity?.data?.subject ||
			'';
		const body =
			campaignEmail.template?.body ||
			campaignEmail.activity?.data?.body ||
			'';
		const to = campaignEmail.recipient || contact?.email || '';

		// Validate we have the required data
		if (!subject || !body || !to) {
			const errorMessage = __(
				'Missing required email data (subject, body, or recipient)',
				'doublescale'
			);
			createNotice({
				type: 'error',
				message: errorMessage,
			});
			onError?.(errorMessage);
			return false;
		}

		// Use the sendMessage hook to resend
		return await sendMessage({
			to,
			subject,
			body,
		});
	};

	/**
	 * Main resend function that routes to appropriate handler
	 */
	const resendEmail = useCallback(
		async (campaignEmail: CampaignEmail): Promise<boolean> => {
			if (!campaignEmail) {
				const errorMessage = __('No email selected to resend', 'doublescale');
				createNotice({
					type: 'error',
					message: errorMessage,
				});
				onError?.(errorMessage);
				return false;
			}

			setIsResending(true);

			try {
				// Determine if this is a campaign email or individual email
				const isCampaignEmail =
					campaignEmail.source_type === MESSAGE_SOURCE_TYPES.CAMPAIGN &&
					campaignEmail.campaign;

				if (isCampaignEmail) {
					// Resend via campaign endpoint
					return await resendCampaignEmail(campaignEmail);
				} else {
					// Resend via individual message endpoint
					return await resendIndividualEmail(campaignEmail);
				}
			} catch (error: any) {
				const errorMessage =
					error.message || __('Failed to resend email', 'doublescale');

				createNotice({
					type: 'error',
					message: errorMessage,
				});

				onError?.(errorMessage);
				console.error('[useResendEmail] Unexpected error:', error);
				return false;
			} finally {
				// Only reset if not using sendMessage (which handles its own state)
				if (
					campaignEmail.source_type === MESSAGE_SOURCE_TYPES.CAMPAIGN &&
					campaignEmail.campaign
				) {
					setIsResending(false);
				}
			}
		},
		[contact, sendMessage, onSuccess, onError]
	);

	return {
		isResending: isResending || isSendingIndividual,
		resendEmail,
	};
};

