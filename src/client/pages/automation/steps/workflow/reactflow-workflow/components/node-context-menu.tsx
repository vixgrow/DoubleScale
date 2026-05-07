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
	AlertDialogOverlay,
	AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { DeleteIcon } from '@doublescale/components';
import EditHeaderIcon from '@/components/icons/edit-header';

interface NodeContextMenuProps {
	onEdit?: () => void;
	onDelete?: () => void;
	children: React.ReactNode;
	disabled?: boolean;
	showDelete?: boolean;
}

const NodeContextMenu: React.FC<NodeContextMenuProps> = ({
	onEdit,
	onDelete,
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
				<AlertDialogOverlay className="z-[150000]" />
				<AlertDialogContent className="z-[150000]">
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
