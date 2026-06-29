/**
 * Dialog to reject a sales document approval with a required reason.
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

interface RejectApprovalDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	busy?: boolean;
	onConfirm: (reason: string) => void | Promise<void>;
}

export const RejectApprovalDialog: React.FC<RejectApprovalDialogProps> = ({
	open,
	onOpenChange,
	busy = false,
	onConfirm,
}) => {
	const [reason, setReason] = useState('');
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		if (open) {
			setReason('');
			setError(null);
		}
	}, [open]);

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-md">
				<DialogHeader>
					<DialogTitle>{__('Reject document', 'doublescale')}</DialogTitle>
					<p className="text-sm text-muted-foreground">
						{__(
							'Explain what needs to change before this document can be sent to the client.',
							'doublescale'
						)}
					</p>
				</DialogHeader>
				<div className="space-y-2">
					<Label htmlFor="reject-approval-reason">
						{__('Rejection reason', 'doublescale')}
					</Label>
					<Textarea
						id="reject-approval-reason"
						value={reason}
						onChange={(e) => setReason(e.target.value)}
						rows={4}
						disabled={busy}
					/>
					{error ? <p className="text-sm text-red-600">{error}</p> : null}
				</div>
				<DialogFooter>
					<Button variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>
						{__('Cancel', 'doublescale')}
					</Button>
					<Button
						variant="destructive"
						disabled={busy}
						onClick={() => {
							const trimmed = reason.trim();
							if (!trimmed) {
								setError(__('A rejection reason is required.', 'doublescale'));
								return;
							}
							void onConfirm(trimmed);
						}}
					>
						{busy ? __('Please wait…', 'doublescale') : __('Reject', 'doublescale')}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
};
