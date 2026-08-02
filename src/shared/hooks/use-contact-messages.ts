/**
 * Custom hook for fetching contact messages (Email/SMS/WhatsApp)
 *
 * Eliminates duplicate fetch logic across email, SMS, and WhatsApp components.
 * Provides unified data fetching, loading states, and error handling.
 *
 * @since 1.0.0
 */

import { useState, useEffect } from '@wordpress/element';
import apiFetch from '@wordpress/api-fetch';
import { addQueryArgs } from '@wordpress/url';
import { useDispatch } from '@wordpress/data';
import { __, sprintf } from '@wordpress/i18n';

/**
 * Hook options interface
 */
interface UseContactMessagesOptions {
	/** Contact ID to fetch messages for */
	contactId: number;
	/** Message channel type */
	mode: 'email' | 'sms' | 'whatsapp';
	/** Number of messages per page */
	perPage?: number;
	/** Current page number */
	page?: number;
}

/**
 * Generic message type (email/SMS/WhatsApp)
 */
interface Message {
	id: number;
	recipient: string;
	status: string;
	status_name: string;
	sent_at: string;
	clicked: string;
	opened?: string;
	external_id?: string;
	[key: string]: any;
}

/**
 * Analytics response structure
 */
interface MessagesResponse {
	messages: {
		data: Message[];
		total: number;
		per_page: number;
		current_page: number;
	};
	mode: string;
	// Email-specific stats
	total_sent?: number;
	total_opened?: number;
	total_clicked?: number;
	// SMS/WhatsApp-specific stats
	total_delivered?: number;
	total_failed?: number;
}

/**
 * Hook return type
 */
interface UseContactMessagesReturn {
	/** Loading state */
	loading: boolean;
	/** Messages response data */
	data: MessagesResponse | null;
	/** Error message if fetch failed */
	error: string | null;
	/** Function to manually refetch messages */
	refetch: () => Promise<void>;
}

/**
 * Custom hook to fetch and manage contact messages
 *
 * @example
 * ```tsx
 * const { loading, data, error, refetch } = useContactMessages({
 *   contactId: 123,
 *   mode: 'email',
 *   perPage: 10,
 *   page: 1
 * });
 *
 * const messages = data?.messages.data || [];
 * const totalSent = data?.total_sent || 0;
 * ```
 */
export const useContactMessages = ({
	contactId,
	mode,
	perPage = 10,
	page = 1,
}: UseContactMessagesOptions): UseContactMessagesReturn => {
	const [loading, setLoading] = useState<boolean>(true);
	const [data, setData] = useState<MessagesResponse | null>(null);
	const [error, setError] = useState<string | null>(null);
	const { createNotice } = useDispatch('doublescale/core');

	/**
	 * Fetch messages from API
	 */
	const fetchMessages = async (): Promise<void> => {
		setLoading(true);
		setError(null);

		try {
			const response = (await apiFetch({
				path: addQueryArgs(`/doublescale/v1/contacts/${contactId}/messages`, {
					mode,
					per_page: perPage,
					page,
				}),
			})) as MessagesResponse;

			// Validate response structure
			if (!response || !response.messages) {
				throw new Error(
					`Invalid response structure for ${mode} messages`
				);
			}

			setData(response);
		} catch (err: any) {
			const errorMsg =
				err.message ||
				sprintf(
					/* translators: %s: message channel, e.g. "email" or "sms". */
					__('Failed to fetch %s messages', 'doublescale'),
					mode
				);

			setError(errorMsg);

			// Show error notice to user
			createNotice({
				type: 'error',
				message: errorMsg,
			});

			console.error(`[useContactMessages] Error fetching ${mode}:`, err);
		} finally {
			setLoading(false);
		}
	};

	/**
	 * Auto-fetch on mount and when dependencies change
	 */
	useEffect(() => {
		fetchMessages();
	}, [contactId, mode, perPage, page]);

	return {
		loading,
		data,
		error,
		refetch: fetchMessages,
	};
};
