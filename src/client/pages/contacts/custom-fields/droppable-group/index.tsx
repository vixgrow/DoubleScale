/**
 * wordpress dependencies
 */
import { __ } from '@wordpress/i18n';
/**
 * external dependencies
 */
import React from 'react';
import { useDroppable } from '@dnd-kit/core';
/**
 * internal dependencies
 */
import { Button } from '@/components/ui/button';
import { CopyIcon, DeleteIcon, EditIcon } from '@quillcrm/components';
import './style.scss';

interface DroppableGroupProps {
	id: string;
	title: string;
	fieldsCount: number;
	deletable: boolean;
	onDelete: () => void;
	children: React.ReactNode;
}

export const DroppableGroup: React.FC<DroppableGroupProps> = ({
	id,
	title,
	fieldsCount,
	deletable,
	onDelete,
	children,
}) => {
	const { setNodeRef, isOver } = useDroppable({
		id,
		data: {
			type: 'group',
			groupId: id.split('-')[1],
		},
	});

	return (
		<div
			ref={setNodeRef}
			className={`custom-fields-group flex flex-col gap-[10px] ${
				isOver
					? 'bg-blue-50 border-2 border-blue-300 border-dashed'
					: ''
			}`}
		>
			<div className="custom-fields-group-header flex justify-between items-center">
				<div className="custom-fields-group-title">{title}</div>
				<div className="flex gap-6 items-center border-l pl-6">
					<Button className="text-[#292D32] shadow-none border-none bg-transparent hover:bg-transparent p-0">
						<CopyIcon />
					</Button>
					<Button className="text-[#292D32] shadow-none border-none bg-transparent hover:bg-transparent p-0">
						<EditIcon />
					</Button>
					{deletable && (
						<Button
							onClick={onDelete}
							className="text-[#EF4444] shadow-none border-none bg-transparent hover:bg-transparent p-0"
						>
							<DeleteIcon width={24} height={24} />
						</Button>
					)}
				</div>
			</div>
			<div className="custom-fields-group-items">{children}</div>
		</div>
	);
};
