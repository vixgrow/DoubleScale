/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useEffect, useState } from '@wordpress/element';

/**
 * External dependencies
 */
import { Skeleton } from 'antd';
import {
	Plus,
	Settings,
	Copy,
	Zap,
	RefreshCw,
	MoreHorizontal,
	Pencil,
	Trash2,
	ChevronDown,
	Eye,
} from 'lucide-react';
// import { Button } from "@/components/ui/button"
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreVertical } from 'lucide-react';

/**
 * Internal dependencies
 */
import {
	EditIcon,
	NoticeBanner,
	PageHeader,
	PlusIcon,
} from '@quillcrm/components';
import { KanbanBoard } from './components/kanban-board';
import { PipelineFilters } from './components/pipeline-filters';
import { PipelineSettingsModal } from './components/pipeline-settings-modal';
import { NewDealModal } from './components/new-deal-modal';
import { DealDetailModal } from './components/deal-detail-modal';
import { EditDealModal } from './components/edit-deal-modal';
import { NewPipelineModal } from './components/new-pipeline-modal';
import { DuplicatePipelineModal } from './components/duplicate-pipeline-modal';
import { usePipelineData } from './hooks/use-pipeline-data';
import './styles/enhanced-buttons.scss';
import { useCapabilities } from '@quillcrm/hooks/use-capabilities';
import { Popover } from '@quillcrm/components/ui/popover-dialog';
import { Button } from '@quillcrm/components/ui/button';
import ArrowIcon from '@quillcrm/components/icons/dropdown-header';
import MoreHorizantail from '@quillcrm/components/icons/moreHorizantal-header';
import ViewIcon from '@quillcrm/components/icons/view-header';
import EditHeaderIcon from '@quillcrm/components/icons/edit-header';
import TrashIcon from '@quillcrm/components/icons/trash';
import ArrowColoredIcon from '@quillcrm/components/icons/dropdown-headerColored';
import AddPipIcon from '@quillcrm/components/icons/addpip-header';
import DuplicatePipelineHeader from '@quillcrm/components/icons/duplicate-pipeline-header';
import { EditPipelineModal } from './components/pipeline-edit';
import { DeletePipelineDialog } from './components/pipeline-delete';

// Import types for proper typing
type Filters = {
	search: string;
	ownerId: number | null;
	dateRange: {
		from: Date | null;
		to: Date | null;
	};
	status: 'open' | 'won' | 'lost' | 'all';
	priority: string | null;
};

const SalesPipeline: React.FC = () => {
	const [selectedPipelineId, setSelectedPipelineId] = useState<number | null>(
		null
	);
	const [settingsModalVisible, setSettingsModalVisible] = useState(false);
	const [newPipelineModalVisible, setNewPipelineModalVisible] =useState(false);
	const [editPipelineModalVisible, setEditPipelineModalVisible] =useState(false);
	const [duplicatePipelineModalVisible, setDuplicatePipelineModalVisible] =
		useState(false);
	const [newDealModalVisible, setNewDealModalVisible] = useState(false);
	const [editDealModalVisible, setEditDealModalVisible] = useState(false);
	const [dealDetailModalVisible, setDealDetailModalVisible] = useState(false);
	const [selectedDealId, setSelectedDealId] = useState<number | null>(null);
	const [editingDeal, setEditingDeal] = useState<any | null>(null);
	const [showDuplicateError, setShowDuplicateError] = useState(false);
	const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
	const [filters, setFilters] = useState<Filters>({
		search: '',
		ownerId: null,
		dateRange: { from: null, to: null },
		status: 'open',
		priority: null,
	});

	const { isDealOwner } = useCapabilities();

	const {
		pipelines,
		selectedPipeline,
		deals,
		loading,
		error,
		refreshData,
		updateDealOptimistically,
		updatePipelineOptimistically,
		addStageOptimistically,
		updateStageOptimistically,
		removeStageOptimistically,
		reorderStagesOptimistically,
	} = usePipelineData(selectedPipelineId, filters);

	// Set default pipeline on load
	useEffect(() => {
		if (pipelines && pipelines.length > 0 && !selectedPipelineId) {
			setSelectedPipelineId(pipelines[0].id);
		}
	}, [pipelines, selectedPipelineId]);

	// const headerActions = [
	// 	{
	// 		label: __('New Pipeline', 'quillcrm'),
	// 		variant: 'gradient',
	// 		size: 'default',
	// 		icon: <Plus size={16} />,
	// 		className: 'sales-pipeline-btn btn-primary',
	// 		title: __(
	// 			'Create a new sales pipeline with custom stages',
	// 			'quillcrm'
	// 		),
	// 		onClick: () => {
	// 			setNewPipelineModalVisible(true);
	// 		},
	// 		hidden: isDealOwner(),
	// 	},
	// 	{
	// 		label: __('New Deal', 'quillcrm'),
	// 		variant: 'default',
	// 		size: 'default',
	// 		icon: <Zap size={16} />,
	// 		className: 'sales-pipeline-btn btn-secondary',
	// 		title: selectedPipeline
	// 			? __('Add a new deal to this pipeline', 'quillcrm')
	// 			: __('Select a pipeline first to add deals', 'quillcrm'),
	// 		onClick: () => {
	// 			setNewDealModalVisible(true);
	// 		},
	// 		disabled: !selectedPipeline,
	// 		hidden: isDealOwner(),
	// 	},
	// 	{
	// 		label: __('Duplicate Pipeline', 'quillcrm'),
	// 		variant: 'secondary',
	// 		size: 'default',
	// 		icon: <Copy size={16} />,
	// 		className: 'sales-pipeline-btn btn-tertiary',
	// 		title: selectedPipeline
	// 			? __(
	// 					'Create a copy of this pipeline with all stages',
	// 					'quillcrm'
	// 				)
	// 			: __('Select a pipeline first to duplicate it', 'quillcrm'),
	// 		// onClick: () => {
	// 		// 	setDuplicatePipelineModalVisible(true);
	// 		// },
	// 		onClick: () => {
	// 			if (selectedPipeline) {
	// 			  setDuplicatePipelineModalVisible(true);
	// 			} else {
	// 			  setShowDuplicateError(true);
	// 			  setTimeout(() => setShowDuplicateError(false), 3000);
	// 			}
	// 		},
	// 		disabled: !selectedPipeline,
	// 		hidden: isDealOwner(),
	// 	},
	// 	{
	// 		label: __('Settings', 'quillcrm'),
	// 		variant: 'outline',
	// 		size: 'default',
	// 		icon: <Settings size={16} />,
	// 		className: 'sales-pipeline-btn btn-utility',
	// 		title: selectedPipeline
	// 			? __('Configure pipeline stages and settings', 'quillcrm')
	// 			: __('Select a pipeline first to access settings', 'quillcrm'),
	// 		onClick: () => {
	// 			setSettingsModalVisible(true);
	// 		},
	// 		disabled: !selectedPipeline,
	// 		hidden: isDealOwner(),
	// 	},

	// ];

	if (loading) {
		return (
			<div className="sales-pipeline-loading">
				<PageHeader
					title={__('Loading...', 'quillcrm')}
					subtitle={__('Pipelines', 'quillcrm')}
					actions={[]}
				/>
				<div className="mt-6">
					<Skeleton active paragraph={{ rows: 8 }} />
				</div>
			</div>
		);
	}

	if (error) {
		return (
			<div className="sales-pipeline-error">
				<PageHeader
					title={__('Error loading pipeline data', 'quillcrm')}
					subtitle={__('Pipelines', 'quillcrm')}
					actions={[
						{
							label: __('Retry', 'quillcrm'),
							variant: 'default',
							size: 'default',
							icon: <RefreshCw size={16} />,
							className: 'sales-pipeline-btn btn-secondary',
							onClick: refreshData,
						},
					]}
				/>
				<div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
					<p className="text-red-700">{error}</p>
				</div>
			</div>
		);
	}

	return (
		<div className="sales-pipeline">
			<div className=" flex justify-between items-center ">
				<PageHeader
					title={
						selectedPipeline
							? selectedPipeline.name
							: __('Select a pipeline', 'quillcrm')
					}
					subtitle={__('Pipelines', 'quillcrm')}
					// actions={headerActions}
					actions={[]}
				/>
				<div className=" flex gap-4">
					<div className="flex items-center gap-1">
						<div className="flex items-center">
							{/* Dropdown for selecting pipeline */}
							<DropdownMenu>
								<DropdownMenuTrigger asChild>
									<Button
										variant="outline"
										disabled={pipelines.length <= 0}
										className={`text-base font-medium !text-[#374151] leading-[26px] tracking-[-.5px] flex items-center justify-center gap-3 h-10 border !border-[#374151] py-2 px-4 rounded-l-[8px] rounded-r-none ${
											pipelines.length <= 1
												? 'cursor-default'
												: ''
										}`}
									>
										{selectedPipeline
											? selectedPipeline.name
											: 'Select Pipeline'}
										<ArrowIcon />
									</Button>
								</DropdownMenuTrigger>

								{pipelines.length > 1 && (
									<DropdownMenuContent
										style={{
											boxShadow:
												'3px 3px 4px 0 rgba(0, 0, 0, 0.25);',
										}}
										className="p-4 flex flex-col gap-[10px] rounded-[10px] border  border-[#F5F5F5]"
									>
										{pipelines.map((pipeline: any) => (
											<DropdownMenuItem
												key={pipeline.id}
												onClick={() =>
													setSelectedPipelineId(
														pipeline.id
													)
												}
												className={`${
													selectedPipelineId ===
													pipeline.id
														? 'bg-gray-100'
														: ''
												}`}
											>
												{pipeline.name}
											</DropdownMenuItem>
										))}
									</DropdownMenuContent>
								)}
							</DropdownMenu>

							{/* 3-dots dropdown for actions */}
							<DropdownMenu>
								<DropdownMenuTrigger asChild>
									<Button
										variant="outline"
										size="icon"
										className="rounded-l-none rounded-r-[8px] text-base font-medium !text-[#374151] leading-[26px] tracking-[-.5px] flex items-center justify-center gap-3 h-10 border !border-[#374151] py-2 px-4"
									>
										<MoreHorizantail />
									</Button>
								</DropdownMenuTrigger>
								<DropdownMenuContent
									align="end"
									style={{
										boxShadow:
											'3px 3px 4px 0 rgba(0, 0, 0, 0.25);',
									}}
									className="p-4 flex flex-col gap-[10px] rounded-[10px] border  border-[#F5F5F5]"
								>
									<DropdownMenuItem className="flex items-center gap-2 text-[#2E2C2F] font-medium text-sm leading-[16px]">
										<ViewIcon />
										{__('View Pipeline', 'quillcrm')}
										
									</DropdownMenuItem>
									<DropdownMenuItem onClick={() =>
										setEditPipelineModalVisible(true)
									}
									disabled={!selectedPipeline} 
									className="flex items-center gap-2 text-[#374151] font-medium text-sm leading-[16px]">
										<EditHeaderIcon />
										{__('Edit Pipeline', 'quillcrm')}
									</DropdownMenuItem>
									<DropdownMenuItem onClick={() =>
										setDeleteDialogOpen(true)
									} className="flex items-center gap-2 text-[#2E2C2F] font-medium text-sm leading-[16px]">
										<TrashIcon />
										{__('Delete Pipeline', 'quillcrm')}
									</DropdownMenuItem>
								</DropdownMenuContent>
							</DropdownMenu>
						</div>
					</div>
					<div className="flex items-center gap-1">
						{/* Dropdown for selecting pipeline */}
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button
									variant="outline"
									// disabled={pipelines.length <= 0}
									className={`text-base font-medium !text-[#3B82F6] leading-[26px] tracking-[-.5px] flex items-center justify-center gap-3 h-10 border !border-[#3B82F6] py-2 px-4 rounded-[8px] `}
								>
									New Pipeline
									<ArrowColoredIcon />
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent
								style={{
									boxShadow:
										'3px 3px 4px 0 rgba(0, 0, 0, 0.25);',
								}}
								className="p-4 flex flex-col gap-[10px] rounded-[10px] border  border-[#F5F5F5]"
							>
								<DropdownMenuItem
									onClick={() =>
										setNewPipelineModalVisible(true)
									}
									className="flex items-center cursor-pointer gap-2 text-[#2E2C2F] font-medium text-sm leading-[16px]"
								>
									<AddPipIcon />
									New Pipeline
								</DropdownMenuItem>
								<DropdownMenuItem
									onClick={() =>
										setDuplicatePipelineModalVisible(true)
									}
									disabled={!selectedPipeline}
									className="flex items-center cursor-pointer gap-2 text-[#2E2C2F] font-medium text-sm leading-[16px]"
								>
									<DuplicatePipelineHeader />
									Duplicate Pipeline
								</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>
					</div>
					<div className='flex items-center gap-1'>
					<Button
									onClick={() =>
										setNewDealModalVisible(true)
									}
									className={`text-base font-medium !text-[#FFF] leading-[26px] tracking-[-.5px] flex items-center justify-center gap-[6px] h-10 bg-[#1E3A8A] py-2 px-4 rounded-[8px] `}
								>
									<span className='mt-1'>
									<PlusIcon width={32} height={32} color='#FFF'/>
									</span>
									Add New Deal
									
								</Button>
					</div>

				</div>
			</div>
			
			{showDuplicateError && (
				<NoticeBanner
					notice={{
						type: 'error',
						message: __('No pipeline selected', 'quillcrm'),
					}}
					closeNotice={() => setShowDuplicateError(false)}
				/>
			)}

			<PipelineFilters
				pipelines={pipelines || []}
				selectedPipelineId={selectedPipelineId}
				onPipelineChange={setSelectedPipelineId}
				filters={filters}
				onFiltersChange={setFilters}
			/>

			{selectedPipeline && (
				<div className="mt-6">
					<KanbanBoard
						pipeline={selectedPipeline}
						deals={(deals as any) || []}
						onRefresh={refreshData}
						updateDealOptimistically={updateDealOptimistically}
						onDealView={(dealId: number) => {
							setSelectedDealId(dealId);
							setDealDetailModalVisible(true);
						}}
						onDealEdit={(deal) => {
							setEditingDeal(deal);
							setEditDealModalVisible(true);
						}}
					/>
				</div>
			)}

			<PipelineSettingsModal
				pipeline={selectedPipeline as any}
				visible={settingsModalVisible}
				onClose={() => setSettingsModalVisible(false)}
				onUpdate={refreshData}
				updatePipelineOptimistically={updatePipelineOptimistically}
				addStageOptimistically={addStageOptimistically}
				updateStageOptimistically={updateStageOptimistically}
				removeStageOptimistically={removeStageOptimistically}
				reorderStagesOptimistically={reorderStagesOptimistically}
			/>

			<NewDealModal
				visible={newDealModalVisible}
				onClose={() => setNewDealModalVisible(false)}
				onSuccess={refreshData}
				pipeline={selectedPipeline}
			/>

			<DealDetailModal
				dealId={selectedDealId}
				visible={dealDetailModalVisible}
				onClose={() => {
					setDealDetailModalVisible(false);
					setSelectedDealId(null);
				}}
				onUpdate={refreshData}
				onEdit={(deal) => {
					setEditingDeal(deal);
					setEditDealModalVisible(true);
					setDealDetailModalVisible(false);
				}}
			/>

			<EditDealModal
				visible={editDealModalVisible}
				onClose={() => {
					setEditDealModalVisible(false);
					setEditingDeal(null);
				}}
				onSuccess={() => {
					refreshData();
					setEditDealModalVisible(false);
					setEditingDeal(null);
				}}
				deal={editingDeal}
				pipelines={pipelines || []}
			/>

			{/* <DuplicatePipelineModal
				visible={duplicatePipelineModalVisible}
				onClose={() => setDuplicatePipelineModalVisible(false)}
				onSuccess={() => {
					refreshData();
				}}
				pipeline={selectedPipeline}
			/> */}

			{selectedPipeline && (
				<DuplicatePipelineModal
					visible={duplicatePipelineModalVisible}
					onClose={() => setDuplicatePipelineModalVisible(false)}
					onSuccess={() => {
						refreshData();
						setDuplicatePipelineModalVisible(false);
					}}
					pipeline={selectedPipeline}
				/>
			)}

			<NewPipelineModal
				visible={newPipelineModalVisible}
				onClose={() => setNewPipelineModalVisible(false)}
				onSuccess={() => {
					refreshData();
					// Auto-select the newly created pipeline if it's the first one
					if (!selectedPipelineId && pipelines.length === 0) {
						// Will be handled by useEffect when pipelines update
					}
				}}
			/>
			<EditPipelineModal
  visible={editPipelineModalVisible}
  onClose={() => setEditPipelineModalVisible(false)}
  onSuccess={async (updatedPipeline) => {
    await refreshData();

    
    if (updatedPipeline?.id) {
      setSelectedPipelineId(updatedPipeline.id);
    }

    setEditPipelineModalVisible(false);
  }}
  pipeline={selectedPipeline}
/>
<DeletePipelineDialog
  open={deleteDialogOpen}
  onClose={() => setDeleteDialogOpen(false)}
  pipeline={selectedPipeline}
  pipelines={pipelines}
  onConfirm={refreshData}
/>

		</div>
	);
};

export default SalesPipeline;
