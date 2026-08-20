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
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from '@/components/ui/alert-dialog';
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

	const handleDeleteConfirm = () => {
		if (onDelete) {
			onDelete();
		}
		setShowDeleteAlert(false);
	};

	if (disabled) {
		return <>{children}</>;
	}

	return (
		<>
			{children}

			<AlertDialog
				open={showDeleteAlert}
				onOpenChange={setShowDeleteAlert}
			>
				<AlertDialogContent
					overlayClassName={automationModalOverlayClassName}
					className={cn(automationAlertDialogContentClassName)}
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
						<AlertDialogCancel>
							{__('No', 'doublescale')}
						</AlertDialogCancel>
						<AlertDialogAction
							onClick={handleDeleteConfirm}
							className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
						>
							{__('Yes', 'doublescale')}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</>
	);
};

export default NodeContextMenu;
