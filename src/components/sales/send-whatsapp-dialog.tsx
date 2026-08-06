/**
 * Dialog to share a sales document over WhatsApp.
 *
 * Two delivery paths, deliberately kept distinct:
 *
 * - **Share link** (always available): opens wa.me with the message prefilled.
 *   The admin still has to press send inside WhatsApp, so the document is only
 *   marked as sent afterwards, via `onConfirmSent`.
 * - **Send automatically** (Pro, provider configured): the server delivers the
 *   message and the document is marked sent in the same request.
 */

import { useCallback, useEffect, useState } from '@wordpress/element';
import type React from 'react';
import { __ } from '@wordpress/i18n';

import { Button } from '@/components/ui/button';
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { CustomDialogHeader, WhatsAppIcon } from '@doublescale/components';
import { formatSalesRestError } from './sales-approval-utils';
import type { WhatsappShareOptions, WhatsappShareResponse } from '@/hooks/sales';

interface SendWhatsappDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	title: string;
	description: string;
	/** Builds the share payload, or delivers it when `mode: 'auto'`. */
	onPrepare: (options: WhatsappShareOptions) => Promise<WhatsappShareResponse | { sent: boolean }>;
	/** Marks the document sent after the admin used the wa.me link. */
	onConfirmSent?: (message: string) => void | Promise<void>;
	/** Called once the document has actually been marked as sent. */
	onSent?: () => void;
	/** Hides automatic sending when no provider is connected. */
	autoSendAvailable?: boolean;
}

const isShareResponse = (
	value: WhatsappShareResponse | { sent: boolean }
): value is WhatsappShareResponse => 'link' in value;

export const SendWhatsappDialog: React.FC<SendWhatsappDialogProps> = ({
	open,
	onOpenChange,
	title,
	description,
	onPrepare,
	onConfirmSent,
	onSent,
	autoSendAvailable = false,
}) => {
	const [phone, setPhone] = useState('');
	const [message, setMessage] = useState('');
	const [link, setLink] = useState('');
	const [loading, setLoading] = useState(false);
	const [busy, setBusy] = useState(false);
	const [error, setError] = useState('');
	const [opened, setOpened] = useState(false);

	// Prepared on open, not on click: window.open() must run synchronously
	// inside the click handler or popup blockers discard the new tab.
	useEffect(() => {
		if (!open) {
			return;
		}

		let cancelled = false;
		setPhone('');
		setMessage('');
		setLink('');
		setError('');
		setOpened(false);
		setLoading(true);

		void onPrepare({ mode: 'link' })
			.then((result) => {
				if (cancelled || !isShareResponse(result)) {
					return;
				}
				setPhone(result.phone);
				setMessage(result.text);
				setLink(result.link);
			})
			.catch((err: unknown) => {
				if (!cancelled) {
					setError(
						formatSalesRestError(
							err,
							__('Could not prepare the WhatsApp message.', 'doublescale')
						)
					);
				}
			})
			.finally(() => {
				if (!cancelled) {
					setLoading(false);
				}
			});

		return () => {
			cancelled = true;
		};
	}, [open, onPrepare]);

	// Rebuild the deep link locally so edits to the phone or message apply
	// without another round trip.
	const shareLink = useCallback(() => {
		const digits = phone.replace(/\D+/g, '');
		const base = `https://wa.me/${digits}`;
		return message ? `${base}?text=${encodeURIComponent(message)}` : base;
	}, [phone, message]);

	const handleOpenWhatsapp = () => {
		window.open(shareLink() || link, '_blank', 'noopener,noreferrer');
		setOpened(true);
	};

	const handleConfirmSent = async () => {
		if (!onConfirmSent) {
			onOpenChange(false);
			return;
		}

		setBusy(true);
		setError('');
		try {
			await onConfirmSent(message);
			onSent?.();
			onOpenChange(false);
		} catch (err: unknown) {
			setError(
				formatSalesRestError(err, __('Could not update the document status.', 'doublescale'))
			);
		} finally {
			setBusy(false);
		}
	};

	const handleAutoSend = async () => {
		setBusy(true);
		setError('');
		try {
			await onPrepare({ mode: 'auto', message, phone });
			onSent?.();
			onOpenChange(false);
		} catch (err: unknown) {
			setError(
				formatSalesRestError(err, __('Could not send the WhatsApp message.', 'doublescale'))
			);
		} finally {
			setBusy(false);
		}
	};

	const disabled = loading || busy;

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent
				className="max-w-lg z-[150220] bg-white"
				overlayClassName="z-[150210] bg-black/45 backdrop-blur-[1px]"
			>
				<DialogHeader>
					<CustomDialogHeader
						title={title}
						subtitle={description}
						icon={<WhatsAppIcon width={24} height={24} />}
					/>
				</DialogHeader>

				<div className="space-y-4">
					<div className="space-y-2">
						<Label htmlFor="send-whatsapp-phone">
							{__('WhatsApp number', 'doublescale')}
						</Label>
						<Input
							id="send-whatsapp-phone"
							value={phone}
							onChange={(e) => setPhone(e.target.value)}
							placeholder={__('e.g. +20 100 123 4567', 'doublescale')}
							disabled={disabled}
						/>
						{!loading && phone === '' ? (
							<p className="text-xs text-muted-foreground">
								{__(
									'This contact has no saved number — add one here, or leave it empty to pick the recipient inside WhatsApp.',
									'doublescale'
								)}
							</p>
						) : null}
					</div>

					<div className="space-y-2">
						<Label htmlFor="send-whatsapp-message">{__('Message', 'doublescale')}</Label>
						<Textarea
							id="send-whatsapp-message"
							value={message}
							onChange={(e) => setMessage(e.target.value)}
							rows={6}
							placeholder={
								loading ? __('Preparing message…', 'doublescale') : undefined
							}
							disabled={disabled}
						/>
					</div>

					{error ? <p className="text-sm text-destructive">{error}</p> : null}

					{opened ? (
						<p className="text-sm text-muted-foreground">
							{__(
								'Once you have sent it in WhatsApp, mark the document as sent below.',
								'doublescale'
							)}
						</p>
					) : null}
				</div>

				<DialogFooter className="flex sm:justify-end gap-2">
					<Button
						variant="outline"
						onClick={() => onOpenChange(false)}
						disabled={busy}
						className="border-primary text-primary bg-white"
					>
						{__('Cancel', 'doublescale')}
					</Button>

					{autoSendAvailable ? (
						<Button
							variant="outline"
							onClick={() => void handleAutoSend()}
							disabled={disabled}
							className="border-primary text-primary bg-white"
						>
							{__('Send automatically', 'doublescale')}
						</Button>
					) : null}

					{opened ? (
						<Button disabled={busy} onClick={() => void handleConfirmSent()}>
							{busy
								? __('Please wait…', 'doublescale')
								: __('Mark as sent', 'doublescale')}
						</Button>
					) : (
						<Button disabled={disabled} onClick={handleOpenWhatsapp}>
							{loading
								? __('Please wait…', 'doublescale')
								: __('Open WhatsApp', 'doublescale')}
						</Button>
					)}
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
};
