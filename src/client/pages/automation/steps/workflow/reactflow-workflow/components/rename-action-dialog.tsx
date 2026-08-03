/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useEffect, useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import {
	automationDialogBodyClassName,
	automationDialogHeaderClassName,
	automationDialogSurfaceMedium,
	automationModalOverlayClassName,
} from '../../automation-dialog-presets';

interface RenameActionDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	currentLabel: string;
	catalogLabel: string;
	onSave: (label: string) => Promise<void>;
}

const RenameActionDialog: React.FC<RenameActionDialogProps> = ({
	open,
	onOpenChange,
	currentLabel,
	catalogLabel,
	onSave,
}) => {
	const [label, setLabel] = useState(currentLabel);
	const [isSaving, setIsSaving] = useState(false);

	useEffect(() => {
		if (open) {
			setLabel(currentLabel);
		}
	}, [open, currentLabel]);

	const handleSave = async () => {
		setIsSaving(true);
		try {
			await onSave(label.trim());
			onOpenChange(false);
		} finally {
			setIsSaving(false);
		}
	};

	const handleClear = async () => {
		setIsSaving(true);
		try {
			await onSave('');
			onOpenChange(false);
		} finally {
			setIsSaving(false);
		}
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent
				overlayClassName={automationModalOverlayClassName}
				className={cn(automationDialogSurfaceMedium, 'gap-0 p-0')}
			>
				<DialogHeader
					className={cn(
						automationDialogHeaderClassName,
						'border-b border-border px-6 py-4'
					)}
				>
					<DialogTitle>{__('Rename Action', 'doublescale')}</DialogTitle>
					<DialogDescription>
						{__(
							'Give this action a custom name to make complex workflows easier to follow.',
							'doublescale'
						)}
					</DialogDescription>
				</DialogHeader>

				<div className={cn(automationDialogBodyClassName, 'px-6 py-4')}>
					<div className="space-y-2">
						<Label htmlFor="action-custom-label">
							{__('Display name', 'doublescale')}
						</Label>
						<Input
							id="action-custom-label"
							value={label}
							onChange={(event) => setLabel(event.target.value)}
							placeholder={catalogLabel}
							maxLength={120}
							autoFocus
							onKeyDown={(event) => {
								if (event.key === 'Enter') {
									event.preventDefault();
									void handleSave();
								}
							}}
						/>
						<p className="text-xs text-muted-foreground">
							{__('Default:', 'doublescale')} {catalogLabel}
						</p>
					</div>
				</div>

				<DialogFooter className="border-t border-border px-6 py-4">
					<Button
						type="button"
						variant="ghost"
						onClick={() => onOpenChange(false)}
						disabled={isSaving}
					>
						{__('Cancel', 'doublescale')}
					</Button>
					{currentLabel && (
						<Button
							type="button"
							variant="outline"
							onClick={() => void handleClear()}
							disabled={isSaving}
						>
							{__('Clear name', 'doublescale')}
						</Button>
					)}
					<Button
						type="button"
						onClick={() => void handleSave()}
						disabled={isSaving}
					>
						{isSaving ? __('Saving...', 'doublescale') : __('Save', 'doublescale')}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
};

export default RenameActionDialog;
