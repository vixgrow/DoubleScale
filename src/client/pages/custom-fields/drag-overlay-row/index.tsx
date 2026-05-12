/**
 * wordpress dependencies
 */
import { __ } from '@wordpress/i18n';
/**
 * external dependencies
 */
import React from 'react';
/**
 * internal dependencies
 */
import { Button } from '@/components/ui/button';
import { DeleteIcon, MoveIcon } from '@doublescale/components';
import EditHeaderIcon from '@doublescale/shared/icons/edit-header';
import { CustomField } from '@doublescale/client';

interface DragOverlayRowProps {
	field: CustomField;
	fieldTypes: Record<string, any>;
}

const dragHandleOffset = ({ transform }) => {
	return {
		...transform,
		x: transform.x - 520, // Adjust this value to align the drag handle with cursor
		y: transform.y,
	};
};

export const DragOverlayRow: React.FC<DragOverlayRowProps> = ({
	field,
	fieldTypes,
}) => {
	return (
		<div
			className="bg-white border rounded shadow-lg p-4 opacity-90 min-w-[600px] flex items-center gap-4 transform-gpu relative"
			style={{ left: '-520px' }}
		>
			<div className="w-6 h-6 border border-gray-300 rounded"></div>
			<div className="flex items-center gap-2 flex-1">
				<div className="font-medium text-[#09090B]">{field.name}</div>
			</div>
			<div className="text-sm text-gray-600 capitalize min-w-[100px]">
				{fieldTypes[field.type]?.name || field.type}
			</div>
			<div className="text-sm text-gray-600 min-w-[120px]">
				{field.created_at}
			</div>
			<div className="flex gap-2">
				<Button
					size="sm"
					variant="outline"
					className="text-[#292D32] border-accent shadow-none hover:bg-gray-50 p-2 cursor-grab"
					title={__('Move field', 'doublescale')}
					disabled
				>
					<MoveIcon width={16} height={16} />
				</Button>
				<Button
					size="sm"
					variant="outline"
					className="text-[#292D32] border-accent shadow-none hover:bg-gray-50 p-2"
					title={__('Edit field', 'doublescale')}
					disabled
				>
					<EditHeaderIcon width={16} height={16} />
				</Button>
				<Button
					size="sm"
					variant="outline"
					className="text-[#EF4444] hover:bg-red-50 p-2 border-accent shadow-none"
					title={__('Delete field', 'doublescale')}
					disabled
				>
					<DeleteIcon width={16} height={16} />
				</Button>
			</div>
		</div>
	);
};
