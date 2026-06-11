/**
 * Reusable confirmation dialog for destructive actions.
 */

import React from '@wordpress/element';
import { __ } from '@wordpress/i18n';

import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';

interface ConfirmDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	title: string;
	description: string;
	confirmLabel?: string;
	cancelLabel?: string;
	destructive?: boolean;
	busy?: boolean;
	onConfirm: () => void | Promise<void>;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
	open,
	onOpenChange,
	title,
	description,
	confirmLabel = __('Confirm', 'doublescale'),
	cancelLabel = __('Cancel', 'doublescale'),
	destructive = false,
	busy = false,
	onConfirm,
}) => (
	<AlertDialog open={open} onOpenChange={onOpenChange}>
		<AlertDialogContent className="max-w-md">
			<AlertDialogHeader>
				<AlertDialogTitle>{title}</AlertDialogTitle>
				<AlertDialogDescription>{description}</AlertDialogDescription>
			</AlertDialogHeader>
			<AlertDialogFooter>
				<AlertDialogCancel disabled={busy}>{cancelLabel}</AlertDialogCancel>
				<AlertDialogAction asChild>
					<Button
						variant={destructive ? 'destructive' : 'default'}
						disabled={busy}
						onClick={(e) => {
							e.preventDefault();
							void onConfirm();
						}}
					>
						{busy ? __('Please wait…', 'doublescale') : confirmLabel}
					</Button>
				</AlertDialogAction>
			</AlertDialogFooter>
		</AlertDialogContent>
	</AlertDialog>
);
