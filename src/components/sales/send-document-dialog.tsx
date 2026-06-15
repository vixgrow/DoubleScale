/**
 * Dialog to send a proposal or invoice with an optional custom email message.
 */

import React, { useEffect, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

import { Button } from '@/components/ui/button';
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface SendDocumentDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	title: string;
	description: string;
	confirmLabel?: string;
	busy?: boolean;
	onConfirm: (message: string) => void | Promise<void>;
}

export const SendDocumentDialog: React.FC<SendDocumentDialogProps> = ({
	open,
	onOpenChange,
	title,
	description,
	confirmLabel = __('Send', 'doublescale'),
	busy = false,
	onConfirm,
}) => {
	const [message, setMessage] = useState('');

	useEffect(() => {
		if (open) {
			setMessage('');
		}
	}, [open]);

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-md">
				<DialogHeader>
					<DialogTitle>{title}</DialogTitle>
					<p className="text-sm text-muted-foreground">{description}</p>
				</DialogHeader>
				<div className="space-y-2">
					<Label htmlFor="send-custom-message">
						{__('Custom message (optional)', 'doublescale')}
					</Label>
					<Textarea
						id="send-custom-message"
						value={message}
						onChange={(e) => setMessage(e.target.value)}
						rows={4}
						placeholder={__(
							'Add a personal note included in the email to the customer…',
							'doublescale'
						)}
						disabled={busy}
					/>
				</div>
				<DialogFooter>
					<Button variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>
						{__('Cancel', 'doublescale')}
					</Button>
					<Button
						disabled={busy}
						onClick={() => {
							void onConfirm(message.trim());
						}}
					>
						{busy ? __('Please wait…', 'doublescale') : confirmLabel}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
};
