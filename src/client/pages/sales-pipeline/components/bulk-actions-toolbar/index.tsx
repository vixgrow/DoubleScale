/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useState } from '@wordpress/element';
import { useDispatch } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { Button } from '@quillcrm/components/ui/button';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useDealOperations } from '../../hooks/use-deal-operations';
import { BulkUpdateModals } from './BulkUpdateModals';
import TrashIcon from '@quillcrm/components/icons/trash';
import { X } from 'lucide-react';

interface BulkActionsToolbarProps {
	selectedCount: number;
	selectedDealIds: number[];
	pipeline: {
		id: number;
		stages: Array<{
			id: number;
			name: string;
			color: string;
			sort_order: number;
		}>;
	};
	clearSelection: () => void;
	selectAllVisible: () => void;
	isPerformingBulk: boolean;
	setIsPerformingBulk: (performing: boolean) => void;
	onComplete: () => void;
}

export const BulkActionsToolbar: React.FC<BulkActionsToolbarProps> = ({
	selectedCount,
	selectedDealIds,
	pipeline,
	clearSelection,
	selectAllVisible,
	isPerformingBulk,
	setIsPerformingBulk,
	onComplete,
}) => {
	const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
	const [showStageModal, setShowStageModal] = useState(false);
	const [showOwnerModal, setShowOwnerModal] = useState(false);
	const [showPriorityModal, setShowPriorityModal] = useState(false);
	const [showPipelineModal, setShowPipelineModal] = useState(false);

	const { bulkDeleteDeals, bulkUpdateDeals } = useDealOperations();
	const dispatch = useDispatch('quillcrm/core');
	const createNotice = dispatch?.createNotice;

	const handleBulkDelete = async () => {
		setIsPerformingBulk(true);
		try {
			const deletedCount = await bulkDeleteDeals(selectedDealIds);
			createNotice?.({
				type: 'success',
				message: __(
					`Successfully deleted ${deletedCount} deal(s)`,
					'quillcrm'
				),
			});
			setShowDeleteConfirm(false);
			onComplete();
		} catch (error: any) {
			createNotice?.({
				type: 'error',
				message: error.message || __('Failed to delete deals', 'quillcrm'),
			});
		} finally {
			setIsPerformingBulk(false);
		}
	};

	const handleBulkUpdate = async (field: string, value: any, additionalValue?: any) => {
		setIsPerformingBulk(true);
		try {
			const data: any = {};
			data[field] = value;

			// For pipeline moves, also set the stage_id
			if (field === 'pipeline_id' && additionalValue) {
				data['stage_id'] = additionalValue;
			}

			const updatedCount = await bulkUpdateDeals(selectedDealIds, data);
			
			// Provide specific feedback for pipeline moves
			if (field === 'pipeline_id') {
				createNotice?.({
					type: 'success',
					message: __(
						`Successfully moved ${updatedCount} deal(s) to the selected pipeline`,
						'quillcrm'
					),
				});
			} else {
				createNotice?.({
					type: 'success',
					message: __(
						`Successfully updated ${updatedCount} deal(s)`,
						'quillcrm'
					),
				});
			}

			// Close modals
			setShowStageModal(false);
			setShowOwnerModal(false);
			setShowPriorityModal(false);
			setShowPipelineModal(false);

			onComplete();
		} catch (error: any) {
			createNotice?.({
				type: 'error',
				message: error.message || __('Failed to update deals', 'quillcrm'),
			});
		} finally {
			setIsPerformingBulk(false);
		}
	};

	return (
		<>
			<div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50">
				<div className="bg-white rounded-lg shadow-2xl border border-gray-200 px-6 py-4 flex items-center gap-4">
					{/* Selection Count */}
					<div className="flex items-center gap-3">
						<span className="text-sm font-semibold text-gray-700">
							{__('%d selected', 'quillcrm').replace('%d', String(selectedCount))}
						</span>
						<Button
							variant="ghost"
							size="sm"
							onClick={clearSelection}
							className="h-8 w-8 p-0"
						>
							<X size={16} />
						</Button>
					</div>

					{/* Divider */}
					<div className="h-8 w-px bg-gray-300" />

					{/* Actions */}
					<div className="flex items-center gap-2">
						{/* Delete Button */}
						<Button
							variant="outline"
							size="sm"
							onClick={() => setShowDeleteConfirm(true)}
							disabled={isPerformingBulk}
							className="flex items-center gap-2 text-red-600 border-red-600 hover:bg-red-50"
						>
							<TrashIcon width={16} height={16} />
							{__('Delete', 'quillcrm')}
						</Button>

						{/* Bulk Actions Dropdown */}
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button
									variant="outline"
									size="sm"
									disabled={isPerformingBulk}
									className="flex items-center gap-2"
								>
									{__('More Actions', 'quillcrm')}
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent align="end" className="w-48">
								<DropdownMenuItem onClick={() => setShowStageModal(true)}>
									{__('Move to Stage', 'quillcrm')}
								</DropdownMenuItem>
								<DropdownMenuItem onClick={() => setShowOwnerModal(true)}>
									{__('Change Owner', 'quillcrm')}
								</DropdownMenuItem>
								<DropdownMenuItem onClick={() => setShowPriorityModal(true)}>
									{__('Change Priority', 'quillcrm')}
								</DropdownMenuItem>
								<DropdownMenuItem onClick={() => setShowPipelineModal(true)}>
									{__('Move to Pipeline', 'quillcrm')}
								</DropdownMenuItem>
								<DropdownMenuItem onClick={selectAllVisible}>
									{__('Select All Visible', 'quillcrm')}
								</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>
					</div>
				</div>
			</div>

			{/* Delete Confirmation Dialog */}
			{showDeleteConfirm && (
				<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]">
					<div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
						<h3 className="text-lg font-semibold mb-2">
							{__('Delete Deals', 'quillcrm')}
						</h3>
						<p className="text-gray-600 mb-6">
							{__('Are you sure you want to delete %d deal(s)? This action cannot be undone.', 'quillcrm').replace('%d', String(selectedCount))}
						</p>
						<div className="flex justify-end gap-3">
							<Button
								variant="outline"
								onClick={() => setShowDeleteConfirm(false)}
								disabled={isPerformingBulk}
							>
								{__('Cancel', 'quillcrm')}
							</Button>
							<Button
								onClick={handleBulkDelete}
								disabled={isPerformingBulk}
								className="bg-red-600 hover:bg-red-700 text-white"
							>
								{isPerformingBulk
									? __('Deleting...', 'quillcrm')
									: __('Delete', 'quillcrm')}
							</Button>
						</div>
					</div>
				</div>
			)}

			{/* Bulk Update Modals */}
			<BulkUpdateModals
				pipeline={pipeline}
				showStageModal={showStageModal}
				showOwnerModal={showOwnerModal}
				showPriorityModal={showPriorityModal}
				showPipelineModal={showPipelineModal}
				onCloseStage={() => setShowStageModal(false)}
				onCloseOwner={() => setShowOwnerModal(false)}
				onClosePriority={() => setShowPriorityModal(false)}
				onClosePipeline={() => setShowPipelineModal(false)}
				onUpdate={handleBulkUpdate}
				isPerforming={isPerformingBulk}
			/>
		</>
	);
};
