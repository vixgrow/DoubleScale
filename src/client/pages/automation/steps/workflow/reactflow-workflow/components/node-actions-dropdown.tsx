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
import { DeleteIcon } from '@doublescale/components';
import EditHeaderIcon from '@/components/icons/edit-header';

interface NodeActionsDropdownProps {
	onEdit?: () => void;
	onDelete?: () => void;
	onChangeTrigger?: () => void;
	editLabel?: string;
	deleteLabel?: string;
	changeTriggerLabel?: string;
	deleteTitle?: string;
	deleteDescription?: string;
	showEdit?: boolean;
	showDelete?: boolean;
	showChangeTrigger?: boolean;
	disabled?: boolean;
}

const NodeActionsDropdown: React.FC<NodeActionsDropdownProps> = ({
	onEdit,
	onDelete,
	onChangeTrigger,
	editLabel = __('Edit', 'doublescale'),
	deleteLabel = __('Delete', 'doublescale'),
	changeTriggerLabel = __('Change Trigger', 'doublescale'),
	deleteTitle = __('Delete this item?', 'doublescale'),
	deleteDescription = __('This action cannot be undone.', 'doublescale'),
	showEdit = true,
	showDelete = true,
	showChangeTrigger = false,
	disabled = false,
}) => {
	const [isDeleting, setIsDeleting] = useState(false);
	const [isDialogOpen, setIsDialogOpen] = useState(false);

	if (disabled || (!showEdit && !showDelete && !showChangeTrigger)) {
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
			className="doublescale-reactflow-node__dropdown"
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
				<DropdownMenuTrigger
					asChild
					onClick={(e) => e.stopPropagation()}
				>
					<Button
						variant="ghost"
						size="icon"
						className="doublescale-reactflow-node__dropdown-btn h-8 w-8"
					>
						<MoreVertical className="h-4 w-4" />
					</Button>
				</DropdownMenuTrigger>
				<DropdownMenuContent
					align="end"
					className="z-[150000]"
					removePortal={true}
					onClick={(e) => e.stopPropagation()}
				>
					{showEdit && onEdit && (
						<DropdownMenuItem
							onClick={onEdit}
							className="hover:bg-gray-100 cursor-pointer pointer-events-auto"
						>
							<EditHeaderIcon />
							<span>{editLabel}</span>
						</DropdownMenuItem>
					)}
					{showChangeTrigger && onChangeTrigger && (
						<DropdownMenuItem
							onClick={onChangeTrigger}
							className="hover:bg-gray-100 cursor-pointer pointer-events-auto"
						>
							<EditHeaderIcon />
							<span>{changeTriggerLabel}</span>
						</DropdownMenuItem>
					)}
					{showDelete && onDelete && (
						<AlertDialog
							open={isDialogOpen}
							onOpenChange={setIsDialogOpen}
						>
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
										<AlertDialogCancel
											disabled={isDeleting}
										>
											{__('Cancel', 'doublescale')}
										</AlertDialogCancel>
										<AlertDialogAction
											onClick={(e) => {
												e.preventDefault();
												handleDelete();
											}}
											disabled={isDeleting}
										>
											{isDeleting
												? __('Deleting...', 'doublescale')
												: __('Delete', 'doublescale')}
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
