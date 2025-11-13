/**
 * Custom hook for sending messages to contacts (Email/SMS/WhatsApp)
 *
 * Provides a unified interface for sending messages across all channels
 * with validation, loading states, and error handling.
 *
 * @since 1.0.0
 */

import { useState } from '@wordpress/element';
import apiFetch from '@wordpress/api-fetch';
import { __ } from '@wordpress/i18n';
import { useDispatch } from '@wordpress/data';
import type { Contact } from '@quillcrm/client';

/**
 * Message channel types
 */
export type MessageChannel = 'email' | 'sms' | 'whatsapp';

/**
 * Base message data interface
 */
interface BaseMessageData {
	to: string;
	body: string;
}

/**
 * Email-specific message data
 */
interface EmailMessageData extends BaseMessageData {
	subject: string;
}

/**
 * SMS/WhatsApp message data
 */
interface PhoneMessageData extends BaseMessageData {}

/**
 * Union type for all message data
 */
export type MessageData = EmailMessageData | PhoneMessageData;

/**
 * Hook options interface
 */
interface UseSendMessageOptions {
	/** Contact to send message to */
	contact: Contact | null;
	/** Message channel */
	channel: MessageChannel;
	/** Callback after successful send */
	onSuccess?: () => void;
	/** Callback after failed send */
	onError?: (error: string) => void;
}

/**
 * Hook return interface
 */
interface UseSendMessageReturn {
	/** Whether message is currently being sent */
	isSending: boolean;
	/** Send message function */
	sendMessage: (data: MessageData) => Promise<boolean>;
	/** Validation error if any */
	validationError: string | null;
}

/**
 * Validate email message data
 */
const validateEmailData = (data: MessageData): string | null => {
	const emailData = data as EmailMessageData;

	if (!emailData.to || !emailData.to.trim()) {
		return __('Please enter a recipient email address', 'quillcrm');
	}

	if (!emailData.subject || !emailData.subject.trim()) {
		return __('Please enter an email subject', 'quillcrm');
	}

	if (!emailData.body || !emailData.body.trim()) {
		return __('Please enter an email body', 'quillcrm');
	}

	return null;
};

/**
 * Validate phone message data (SMS/WhatsApp)
 */
const validatePhoneData = (data: MessageData): string | null => {
	const phoneData = data as PhoneMessageData;

	if (!phoneData.to || !phoneData.to.trim()) {
		return __('Please enter a phone number', 'quillcrm');
	}

	if (phoneData.to.length < 10) {
		return __(
			'Please enter a valid phone number (E.164 format: +1234567890)',
			'quillcrm'
		);
	}

	if (!phoneData.body || !phoneData.body.trim()) {
		return __('Please enter a message', 'quillcrm');
	}

	return null;
};

/**
 * Custom hook to send messages to contacts
 *
 * @example
 * ```tsx
 * const { isSending, sendMessage } = useSendMessage({
 *   contact,
 *   channel: 'email',
 *   onSuccess: () => {
 *     console.log('Email sent!');
 *     closeDialog();
 *   }
 * });
 *
 * // Send email
 * await sendMessage({
 *   to: 'user@example.com',
 *   subject: 'Hello',
 *   body: '<p>Email content</p>'
 * });
 *
 * // Send SMS
 * await sendMessage({
 *   to: '+1234567890',
 *   body: 'SMS message'
 * });
 * ```
 */
export const useSendMessage = ({
	contact,
	channel,
	onSuccess,
	onError,
}: UseSendMessageOptions): UseSendMessageReturn => {
	const [isSending, setIsSending] = useState<boolean>(false);
	const [validationError, setValidationError] = useState<string | null>(null);
	const { createNotice } = useDispatch('quillcrm/core');

	/**
	 * Send message to contact
	 *
	 * @param data Message data (varies by channel)
	 * @returns Promise<boolean> Success status
	 */
	const sendMessage = async (data: MessageData): Promise<boolean> => {
		setValidationError(null);

		// Validate contact
		if (!contact?.id) {
			const error = __('Contact ID is missing', 'quillcrm');
			setValidationError(error);
			createNotice({
				type: 'error',
				message: error,
			});
			onError?.(error);
			return false;
		}

		// Validate message data based on channel
		let error: string | null = null;
		if (channel === 'email') {
			error = validateEmailData(data);
		} else {
			error = validatePhoneData(data);
		}

		if (error) {
			setValidationError(error);
			createNotice({
				type: 'error',
				message: error,
			});
			onError?.(error);
			return false;
		}

		setIsSending(true);

		try {
			// Prepare API payload
			const payload: any = {
				channel,
				to: data.to,
				body: data.body,
			};

			// Add subject for email
			if (channel === 'email' && 'subject' in data) {
				payload.subject = data.subject;
			}

			// Send message via API
			await apiFetch({
				path: `/qc/v1/contacts/${contact.id}/send-message`,
				method: 'POST',
				data: payload,
			});

			// Show success notification
			const successMessages = {
				email: __('Email sent successfully', 'quillcrm'),
				sms: __('SMS sent successfully!', 'quillcrm'),
				whatsapp: __('WhatsApp message sent successfully!', 'quillcrm'),
			};

			createNotice({
				type: 'success',
				message: successMessages[channel],
			});

			// Call success callback
			onSuccess?.();

			return true;
		} catch (err: any) {
			// Extract error message from various WordPress REST API error formats
			let errorMessage = __(`Failed to send ${channel}`, 'quillcrm');

			// Try different error formats in order of specificity
			if (err.message && typeof err.message === 'string') {
				// Standard Error object or apiFetch error with message
				errorMessage = err.message;
			} else if (err.data?.message) {
				// WordPress REST API error format: { data: { message: "..." } }
				errorMessage = err.data.message;
			} else if (err.code && err.message) {
				// WP_Error format: { code: "error_code", message: "..." }
				errorMessage = err.message;
			} else if (typeof err === 'string') {
				// Plain string error
				errorMessage = err;
			}

			setValidationError(errorMessage);

			// Show error notification
			createNotice({
				type: 'error',
				message: errorMessage,
			});

			// Call error callback
			onError?.(errorMessage);

			console.error(`[useSendMessage] Error sending ${channel}:`, err);

			return false;
		} finally {
			setIsSending(false);
		}
	};

	return {
		isSending,
		sendMessage,
		validationError,
	};
};


