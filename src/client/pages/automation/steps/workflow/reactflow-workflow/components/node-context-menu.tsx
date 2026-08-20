/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * External dependencies
 */
import { useState } from 'react';

/**
 * Internal dependencies
 */
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
	AlertDialog,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
	automationAlertDialogContentClassName,
	automationModalOverlayClassName,
} from '../../automation-dialog-presets';
import { DeleteIcon } from '@doublescale/components';
import EditHeaderIcon from '@/components/icons/edit-header';

interface NodeContextMenuProps {
	onEdit?: () => void;
	onDelete?: () => void;
	onDeletePrepare?: () => void;
	children: React.ReactNode;
	disabled?: boolean;
	showDelete?: boolean;
}

const NodeContextMenu: React.FC<NodeContextMenuProps> = ({
	onEdit,
	onDelete,
	onDeletePrepare,
	children,
	disabled = false,
	showDelete = true,
}) => {
	const [showDeleteAlert, setShowDeleteAlert] = useState(false);
	const [isDeleting, setIsDeleting] = useState(false);

	const handleEdit = (e: Event) => {
		e.stopPropagation();
		if (onEdit) {
			onEdit();
		}
	};

	const handleDeleteClick = (e: Event) => {
		e.stopPropagation();
		onDeletePrepare?.();
		setShowDeleteAlert(true);
	};

	const handleDeleteConfirm = async () => {
		if (!onDelete) {
			return;
		}

		onDeletePrepare?.();
		setIsDeleting(true);
		try {
			await onDelete();
			await new Promise((resolve) => setTimeout(resolve, 50));
			setShowDeleteAlert(false);
		} finally {
			setIsDeleting(false);
		}
	};

	const handleDeleteDialogOpenChange = (open: boolean) => {
		if (!open && isDeleting) {
			return;
		}
		setShowDeleteAlert(open);
	};

	if (disabled) {
		return <>{children}</>;
	}

	return (
		<>
			{children}

			<AlertDialog
				open={showDeleteAlert}
				onOpenChange={handleDeleteDialogOpenChange}
			>
				<AlertDialogContent
					overlayClassName={automationModalOverlayClassName}
					className={cn(automationAlertDialogContentClassName)}
					onPointerDownOutside={(event) => event.preventDefault()}
				>
					<AlertDialogHeader>
						<AlertDialogTitle>
							{__('Are you sure?', 'doublescale')}
						</AlertDialogTitle>
						<AlertDialogDescription>
							{__('This action cannot be undone.', 'doublescale')}
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel disabled={isDeleting}>
							{__('No', 'doublescale')}
						</AlertDialogCancel>
						<Button
							type="button"
							variant="destructive"
							disabled={isDeleting}
							onPointerDown={(event) => {
								event.preventDefault();
								event.stopPropagation();
							}}
							onClick={(event) => {
								event.preventDefault();
								event.stopPropagation();
								void handleDeleteConfirm();
							}}
						>
							{isDeleting
								? __('Deleting...', 'doublescale')
								: __('Yes', 'doublescale')}
						</Button>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</>
	);
};

export default NodeContextMenu;
