/**
 * Reusable confirmation dialog for destructive and standard actions.
 */

import React from '@wordpress/element';
import { __ } from '@wordpress/i18n';

import { ColoredDeleteIcon } from '@doublescale/components';
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
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog';
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
}) => {
	if (destructive) {
		return (
			<Dialog open={open} onOpenChange={onOpenChange}>
				<DialogContent className="max-w-md gap-0 p-8 sm:rounded-xl z-[150300]">
					<DialogHeader className="space-y-0">
						<div className="flex flex-col items-center gap-6 pb-2">
							<div className="text-[#EF4444]">
								<ColoredDeleteIcon width={41} height={40} />
							</div>
							<DialogTitle className="text-center text-lg font-medium leading-snug text-[#09090B]">
								{description || title}
							</DialogTitle>
						</div>
					</DialogHeader>
					<DialogFooter className="mt-8 flex flex-row justify-end gap-2 sm:justify-end">
						<Button
							type="button"
							variant="outline"
							disabled={busy}
							onClick={() => onOpenChange(false)}
							className="border-primary text-primary"
						>
							{cancelLabel}
						</Button>
						<Button
							type="button"
							variant="destructive"
							disabled={busy}
							onClick={() => void onConfirm()}
							className="bg-destructive text-white hover:bg-destructive/90"
						>
							{busy ? __('Please wait…', 'doublescale') : confirmLabel}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		);
	}

	return (
		<AlertDialog open={open} onOpenChange={onOpenChange}>
			<AlertDialogContent className="max-w-md z-[150300]">
				<AlertDialogHeader>
					<AlertDialogTitle>{title}</AlertDialogTitle>
					<AlertDialogDescription>{description}</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel disabled={busy}>{cancelLabel}</AlertDialogCancel>
					<AlertDialogAction asChild>
						<Button
							variant="default"
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
};
