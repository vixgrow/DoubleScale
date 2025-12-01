/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * External dependencies
 */
import { MoreVertical } from 'lucide-react';
import { useState } from 'react';
/**
 * Internal dependencies
 */
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogOverlay,
	AlertDialogPortal,
	AlertDialogTitle,
	AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { DeleteIcon } from '@quillcrm/components';
import EditHeaderIcon from '@/components/icons/edit-header';

interface NodeActionsDropdownProps {
	onEdit?: () => void;
	onDelete?: () => void;
	editLabel?: string;
	deleteLabel?: string;
	deleteTitle?: string;
	deleteDescription?: string;
	showEdit?: boolean;
	showDelete?: boolean;
	disabled?: boolean;
}

const NodeActionsDropdown: React.FC<NodeActionsDropdownProps> = ({
	onEdit,
	onDelete,
	editLabel = __('Edit', 'quillcrm'),
	deleteLabel = __('Delete', 'quillcrm'),
	deleteTitle = __('Delete this item?', 'quillcrm'),
	deleteDescription = __('This action cannot be undone.', 'quillcrm'),
	showEdit = true,
	showDelete = true,
	disabled = false,
}) => {
	const [isDeleting, setIsDeleting] = useState(false);
	const [isDialogOpen, setIsDialogOpen] = useState(false);

	if (disabled || (!showEdit && !showDelete)) {
		return null;
	}

	const handleDelete = async () => {
		if (!onDelete) return;

		setIsDeleting(true);
		try {
			await onDelete();
			setIsDialogOpen(false);
		} catch (error) {
			console.error('Delete failed:', error);
		} finally {
			setIsDeleting(false);
		}
	};

	return (
		<div
			className="qcrm-reactflow-node__dropdown"
			onClick={(e) => {
				e.stopPropagation();
				e.preventDefault();
			}}
			onMouseDown={(e) => {
				e.stopPropagation();
			}}
			onMouseUp={(e) => {
				e.stopPropagation();
			}}
		>
			<DropdownMenu>
				<DropdownMenuTrigger asChild>
					<Button
						variant="ghost"
						size="icon"
						className="qcrm-reactflow-node__dropdown-btn h-8 w-8"
						onClick={(e) => {
							e.stopPropagation();
							e.preventDefault();
						}}
						onMouseDown={(e) => {
							e.stopPropagation();
						}}
					>
						<MoreVertical className="h-4 w-4" />
					</Button>
				</DropdownMenuTrigger>
				<DropdownMenuContent align="end" className="z-[150000]">
					{showEdit && onEdit && (
						<DropdownMenuItem
							onClick={onEdit}
							className="hover:bg-gray-100 cursor-pointer pointer-events-auto"
						>
							<EditHeaderIcon/>
							<span>{editLabel}</span>
						</DropdownMenuItem>
					)}
					{showDelete && onDelete && (
						<AlertDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
							<AlertDialogTrigger asChild>
								<DropdownMenuItem
									className="text-destructive focus:text-destructive pointer-events-auto cursor-pointer hover:bg-gray-100"
									onSelect={(e) => e.preventDefault()}
								>
									<DeleteIcon />
									<span>{deleteLabel}</span>
								</DropdownMenuItem>
							</AlertDialogTrigger>
							<AlertDialogPortal>
								<AlertDialogOverlay className="z-[150000]" />
								<AlertDialogContent className="z-[150000]">
									<AlertDialogHeader>
										<AlertDialogTitle>
											{deleteTitle}
										</AlertDialogTitle>
										<AlertDialogDescription>
											{deleteDescription}
										</AlertDialogDescription>
									</AlertDialogHeader>
									<AlertDialogFooter>
										<AlertDialogCancel disabled={isDeleting}>
											{__('Cancel', 'quillcrm')}
										</AlertDialogCancel>
										<AlertDialogAction
											onClick={(e) => {
												e.preventDefault();
												handleDelete();
											}}
											disabled={isDeleting}
										>
											{isDeleting ? __('Deleting...', 'quillcrm') : __('Delete', 'quillcrm')}
										</AlertDialogAction>
									</AlertDialogFooter>
								</AlertDialogContent>
							</AlertDialogPortal>
						</AlertDialog>
					)}
				</DropdownMenuContent>
			</DropdownMenu>
		</div>
	);
};

export default NodeActionsDropdown;
