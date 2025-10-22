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
import { DeleteIcon, EditIcon } from '@quillcrm/components';

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
			<DropdownMenu>
				<DropdownMenuTrigger asChild>
					<div onContextMenu={(e) => e.preventDefault()}>
						{children}
					</div>
				</DropdownMenuTrigger>
				<DropdownMenuContent
					className="qcrm-reactflow-context-menu"
					side="bottom"
					align="start"
					onContextMenu={(e) => e.preventDefault()}
				>
					{onEdit && (
						<DropdownMenuItem onSelect={handleEdit}>
							<EditIcon />
							{__('Edit', 'quillcrm')}
						</DropdownMenuItem>
					)}
					{showDelete && (
						<>
							<DropdownMenuSeparator />
							<DropdownMenuItem
								onSelect={handleDeleteClick}
								className="text-destructive focus:text-destructive"
							>
								<DeleteIcon/>
								{__('Delete', 'quillcrm')}
							</DropdownMenuItem>
						</>
					)}
				</DropdownMenuContent>
			</DropdownMenu>

			<AlertDialog open={showDeleteAlert} onOpenChange={setShowDeleteAlert}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>
							{__('Are you sure?', 'quillcrm')}
						</AlertDialogTitle>
						<AlertDialogDescription>
							{__('This action cannot be undone.', 'quillcrm')}
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>
							{__('No', 'quillcrm')}
						</AlertDialogCancel>
						<AlertDialogAction
							onClick={handleDeleteConfirm}
							className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
						>
							{__('Yes', 'quillcrm')}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</>
	);
};

export default NodeContextMenu;
