/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useEffect, useState } from '@wordpress/element';

/**
 * External dependencies
 */

/**
 * Internal dependencies
 */
import {
	NoticeBanner,
} from '@quillcrm/components';
import { KanbanBoard } from './components/kanban-board';
import { PipelineSettingsModal } from './components/pipeline-settings-modal';
import { NewDealModal } from './components/new-deal-modal';
import { DealDetailModal } from './components/deal-detail-modal';
import { NewPipelineModal } from './components/new-pipeline-modal';
import { DuplicatePipelineModal } from './components/duplicate-pipeline-modal';
import { usePipelineData } from './hooks/use-pipeline-data';
import './styles/enhanced-buttons.scss';
import { EditPipelineModal } from './components/pipeline-edit';
import { DeletePipelineDialog } from './components/pipeline-delete';
import { EditDealModal } from './components/edit-deal-modal';
import { DeleteDeal } from './components/deal-delete';
import { Deal, Filters, Pipeline } from './types';
import { AddNoteModal } from './components/add-note-modal';
import { LogCallModal } from './components/log-call-modal';
import { ScheduleMeetingModal } from './components/schedule-meeting-modal';
import { LogEmailModal } from './components/log-email-modal';
import { ErrorState } from '@quillcrm/components/pipeline-errorState/ErrorState';
import { handleApiError } from './utils/error-handler';
import { SalesPipelineSkeleton } from './SalesPipelineSkeleton';
import { PipelineHeader } from './components/salePipeline-header/SalePipelineHeader';
import { PipelineFilters } from './components/pipeline-filters';

const SalesPipeline: React.FC = () => {
	const [selectedPipelineId, setSelectedPipelineId] = useState<number | null>(
		null
	);
	const [settingsModalVisible, setSettingsModalVisible] = useState(false);
	const [newPipelineModalVisible, setNewPipelineModalVisible] =
		useState(false);
	const [editPipelineModalVisible, setEditPipelineModalVisible] =
		useState(false);
	const [duplicatePipelineModalVisible, setDuplicatePipelineModalVisible] =
		useState(false);
	const [newDealModalVisible, setNewDealModalVisible] = useState(false);
	const [editDealModalVisible, setEditDealModalVisible] = useState(false);
	const [dealDetailModalVisible, setDealDetailModalVisible] = useState(false);
	const [selectedDealId, setSelectedDealId] = useState<number | null>(null);
	const [editingDeal, setEditingDeal] = useState<any | null>(null);
	const [showDuplicateError, setShowDuplicateError] = useState(false);
	const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
	const [deleteDealModalVisible, setDeleteDealModalVisible] = useState(false);
	const [dealToDelete, setDealToDelete] = useState<any | null>(null);
	const [addNoteVisible, setAddNoteVisible] = useState(false);
	const [selectedDealForNote, setSelectedDealForNote] = useState<any | null>(
		null
	);
	const [logCallVisible, setLogCallVisible] = useState(false);
	const [selectedDealForCall, setSelectedDealForCall] = useState<Deal | null>(
		null
	);
	const [ScheduleMeetingVisible, setScheduleMeetingVisible] = useState(false);
	const [LogEmailVisible, setLogEmailVisible] = useState(false);
	const [filters, setFilters] = useState<Filters>({
		search: '',
		ownerId: null,
		expectedCloseDateRange: { from: null, to: null },
		createdDateRange: { from: null, to: null },
		valueRange: { min: null, max: null },
		status: 'all',
		priority: null,
	});



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
	console.log('Loading value:', loading);
	

    // Set default pipeline on load
	useEffect(() => {
		if (pipelines && pipelines.length > 0 && !selectedPipelineId) {
			setSelectedPipelineId(pipelines[0].id);
		}

	}, [pipelines, selectedPipelineId]);

	// handle note

	const handleAddNote = (deal: Deal) => {
		setSelectedDealForNote(deal);
		setAddNoteVisible(true);
	};
	const handleLogCall = (deal: Deal) => {
		setSelectedDealForCall(deal);
		setLogCallVisible(true);
	};
	const handleScheduleMeetingVisible = (deal: Deal) => {
		setSelectedDealForCall(deal);
		setScheduleMeetingVisible(true);
	};
	const handleLogEmailVisible = (deal: Deal) => {
		setSelectedDealForCall(deal);
		setLogEmailVisible(true);
	};


	if (error) {
		// return (
		// 	<div className="sales-pipeline-error">
		// 		<PageHeader
		// 			title={__('Error loading pipeline data', 'quillcrm')}
		// 			subtitle={__('Pipelines', 'quillcrm')}
		// 			actions={[
		// 				{
		// 					label: __('Retry', 'quillcrm'),
		// 					variant: 'default',
		// 					size: 'default',
		// 					icon: <RefreshCw size={16} />,
		// 					className: 'sales-pipeline-btn btn-secondary',
		// 					onClick: refreshData,
		// 				},
		// 			]}
		// 		/>
		// 		<div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
		// 			<p className="text-red-700">{error}</p>
		// 		</div>
		const errorInfo = handleApiError(
			'load pipeline',
			error,
			'Error loading pipeline data'
		);
		return <ErrorState type={errorInfo.type} onRetry={refreshData} />;
	}

	return (
		<div className="sales-pipeline">
			<PipelineHeader
				pipelines={pipelines}
				selectedPipeline={selectedPipeline}
				selectedPipelineId={selectedPipelineId}
				setSelectedPipelineId={setSelectedPipelineId}
				setNewPipelineModalVisible={setNewPipelineModalVisible}
				setDuplicatePipelineModalVisible={
					setDuplicatePipelineModalVisible
				}
				setEditPipelineModalVisible={setEditPipelineModalVisible}
				setDeleteDialogOpen={setDeleteDialogOpen}
				setNewDealModalVisible={setNewDealModalVisible}
			/>

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

			<div className='mt-6'>
				{loading ? (
					<SalesPipelineSkeleton/>

				) :
				selectedPipeline && (
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
							onDealDelete={(deal) => {
								setDealToDelete(deal);
								setDeleteDealModalVisible(true);
							}}
							onDealAddNote={(deal) => handleAddNote(deal)}
							onDealLogCall={(deal) => handleLogCall(deal)}
							onDealScheduleMeeting={(deal) =>
								handleScheduleMeetingVisible(deal)
							}
							onDealLogEmail={(deal) => handleLogEmailVisible(deal)}
							loading={loading}
						/>
					</div>
				)}

			</div>
			
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
				onUpdate={
					refreshData}
				onEdit={(deal) => {
					setEditingDeal(deal);
					setEditDealModalVisible(true);
					setDealDetailModalVisible(false);
					refreshData();
				}}
				onDeleted={() => {   
					setDealDetailModalVisible(false);
					setSelectedDealId(null);
					refreshData();
				}}
				pipeline={selectedPipeline}
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
				// onSuccess={() => {
				// 	refreshData();
				// 	// Auto-select the newly created pipeline if it's the first one
				// 	if (!selectedPipelineId && pipelines.length === 0) {
				// 		// Will be handled by useEffect when pipelines update
				// 	}
				// }}
				onSuccess={async (newPipeline) => {
							await refreshData();
										
							if (newPipeline?.id) {
							setSelectedPipelineId(newPipeline.id);
						}
						}}
			/>
			<EditPipelineModal
				visible={editPipelineModalVisible}
				onClose={() => setEditPipelineModalVisible(false)}
				onSuccess={async (updatedPipeline: Pipeline) => {
					await refreshData();
					if (updatedPipeline?.id) {
						setSelectedPipelineId(updatedPipeline.id);
					}
					setEditPipelineModalVisible(false);
				}}
				pipeline={selectedPipeline}
			/>
			<DeleteDeal
				visible={deleteDealModalVisible}
				onClose={() => setDeleteDealModalVisible(false)}
				deal={dealToDelete}
				// pipeline={selectedPipeline}
				// pipelines={pipelines}
				onConfirm={() => {
					refreshData();
					setDeleteDealModalVisible(false);
				}}
			/>
			<AddNoteModal
				visible={addNoteVisible}
				onClose={() => setAddNoteVisible(false)}
				dealId={selectedDealForNote?.id}
				onSuccess={() => {
					setAddNoteVisible(false);
					refreshData();
				}}
				dealTitle={selectedDealForNote?.title}
			/>
			<LogCallModal
				visible={logCallVisible}
				onClose={() => setLogCallVisible(false)}
				onSuccess={refreshData}
				dealId={selectedDealForCall?.id || 0}
				dealTitle={selectedDealForCall?.title}
				dealContact={selectedDealForCall?.contact}
				dealContactName={selectedDealForCall?.contact?.first_name}
			/>
			<ScheduleMeetingModal
				visible={ScheduleMeetingVisible}
				onClose={() => setScheduleMeetingVisible(false)}
				onSuccess={refreshData}
				dealId={selectedDealForCall?.id || 0}
				dealTitle={selectedDealForCall?.title}
			/>
			<LogEmailModal
				visible={LogEmailVisible}
				onClose={() => setLogEmailVisible(false)}
				onSuccess={refreshData}
				dealId={selectedDealForCall?.id || 0}
				dealTitle={selectedDealForCall?.title}
			/>
			<DeletePipelineDialog
				visible={deleteDialogOpen}
				onClose={() => setDeleteDialogOpen(false)}
				pipeline={selectedPipeline}
				pipelines={pipelines}
				onConfirm={async () => {
				await refreshData();
				// If the deleted pipeline was selected, switch to the first available pipeline
				if (selectedPipelineId === selectedPipeline?.id && pipelines.length > 1) {
					const remainingPipelines = pipelines.filter(p => p.id !== selectedPipeline?.id);
					if (remainingPipelines.length > 0) {
						setSelectedPipelineId(remainingPipelines[0].id);
					} else {
						setSelectedPipelineId(null);
					}
				}
			}}
			/>
		</div>
	);
};

export default SalesPipeline;

/**
 * WordPress dependencies
 */
// import { __ } from '@wordpress/i18n';
// import { useEffect, useState } from '@wordpress/element';

// /**
//  * Internal dependencies
//  */
// import {
// 	NoticeBanner,
// 	PageHeader,
// 	PlusIcon,
// } from '@quillcrm/components';
// import { Button } from '@quillcrm/components/ui/button';
// import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
// import ArrowIcon from '@quillcrm/components/icons/dropdown-header';
// import ArrowColoredIcon from '@quillcrm/components/icons/dropdown-headerColored';
// import AddPipIcon from '@quillcrm/components/icons/addpip-header';
// import DuplicatePipelineHeader from '@quillcrm/components/icons/duplicate-pipeline-header';
// import ViewIcon from '@quillcrm/components/icons/view-header';
// import EditHeaderIcon from '@quillcrm/components/icons/edit-header';
// import TrashIcon from '@quillcrm/components/icons/trash';
// import { KanbanBoard } from './components/kanban-board';
// import { PipelineSettingsModal } from './components/pipeline-settings-modal';
// import { NewDealModal } from './components/new-deal-modal';
// import { DealDetailModal } from './components/deal-detail-modal';
// import { NewPipelineModal } from './components/new-pipeline-modal';
// import { DuplicatePipelineModal } from './components/duplicate-pipeline-modal';
// import { usePipelineData } from './hooks/use-pipeline-data';
// import './styles/enhanced-buttons.scss';
// import { EditPipelineModal } from './components/pipeline-edit';
// import { DeletePipelineDialog } from './components/pipeline-delete';
// import { EditDealModal } from './components/edit-deal-modal';
// import { DeleteDeal } from './components/deal-delete';
// import { Deal } from './types';
// import { AddNoteModal } from './components/add-note-modal';
// import { LogCallModal } from './components/log-call-modal';
// import { ScheduleMeetingModal } from './components/schedule-meeting-modal';
// import { LogEmailModal } from './components/log-email-modal';
// import { ErrorState } from '@quillcrm/components/pipeline-errorState/ErrorState';
// import { handleApiError } from './utils/error-handler';
// import { SalesPipelineSkeleton } from './SalesPipelineSkeleton';
// import { PipelineFilters } from './components/pipeline-filters';

// type Filters = {
// 	search: string;
// 	ownerId: number | null;
// 	dateRange: {
// 		from: Date | null;
// 		to: Date | null;
// 	};
// 	status: 'open' | 'won' | 'lost';
// 	priority: string | null;
// };

// const SalesPipeline: React.FC = () => {
// 	const [isPipelineSwitching, setIsPipelineSwitching] = useState(false);
// 	const [selectedPipelineId, setSelectedPipelineId] = useState<number | null>(null);
// 	const [settingsModalVisible, setSettingsModalVisible] = useState(false);
// 	const [newPipelineModalVisible, setNewPipelineModalVisible] = useState(false);
// 	const [editPipelineModalVisible, setEditPipelineModalVisible] = useState(false);
// 	const [duplicatePipelineModalVisible, setDuplicatePipelineModalVisible] = useState(false);
// 	const [newDealModalVisible, setNewDealModalVisible] = useState(false);
// 	const [editDealModalVisible, setEditDealModalVisible] = useState(false);
// 	const [dealDetailModalVisible, setDealDetailModalVisible] = useState(false);
// 	const [selectedDealId, setSelectedDealId] = useState<number | null>(null);
// 	const [editingDeal, setEditingDeal] = useState<any | null>(null);
// 	const [showDuplicateError, setShowDuplicateError] = useState(false);
// 	const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
// 	const [deleteDealModalVisible, setDeleteDealModalVisible] = useState(false);
// 	const [dealToDelete, setDealToDelete] = useState<any | null>(null);
// 	const [addNoteVisible, setAddNoteVisible] = useState(false);
// 	const [selectedDealForNote, setSelectedDealForNote] = useState<any | null>(null);
// 	const [logCallVisible, setLogCallVisible] = useState(false);
// 	const [selectedDealForCall, setSelectedDealForCall] = useState<Deal | null>(null);
// 	const [ScheduleMeetingVisible, setScheduleMeetingVisible] = useState(false);
// 	const [LogEmailVisible, setLogEmailVisible] = useState(false);
// 	const [lastPipelineId, setLastPipelineId] = useState<number | null>(null);
// 	const [filters, setFilters] = useState<Filters>({
// 		search: '',
// 		ownerId: null,
// 		dateRange: { from: null, to: null },
// 		status: 'open',
// 		priority: null,
// 	});

// 	const {
// 		pipelines,
// 		selectedPipeline,
// 		deals,
// 		loading,
// 		error,
// 		refreshData,
// 		updateDealOptimistically,
// 		updatePipelineOptimistically,
// 		addStageOptimistically,
// 		updateStageOptimistically,
// 		removeStageOptimistically,
// 		reorderStagesOptimistically,
// 	} = usePipelineData(selectedPipelineId, filters);

// 	useEffect(() => {
// 		if (pipelines && pipelines.length > 0 && !selectedPipelineId) {
// 			setSelectedPipelineId(pipelines[0].id);
// 		}
// 	}, [pipelines, selectedPipelineId]);

// 	useEffect(() => {
// 		setIsPipelineSwitching(true);
// 		refreshData().finally(() => {
// 			setIsPipelineSwitching(false);
// 		});
// 		setLastPipelineId(selectedPipelineId);
// 	}, [selectedPipelineId]);

// 	const handleAddNote = (deal: Deal) => {
// 		setSelectedDealForNote(deal);
// 		setAddNoteVisible(true);
// 	};

// 	const handleLogCall = (deal: Deal) => {
// 		setSelectedDealForCall(deal);
// 		setLogCallVisible(true);
// 	};

// 	const handleScheduleMeetingVisible = (deal: Deal) => {
// 		setSelectedDealForCall(deal);
// 		setScheduleMeetingVisible(true);
// 	};

// 	const handleLogEmailVisible = (deal: Deal) => {
// 		setSelectedDealForCall(deal);
// 		setLogEmailVisible(true);
// 	};

// 	if (error) {
// 		const errorInfo = handleApiError('load pipeline', error, 'Error loading pipeline data');
// 		return <ErrorState type={errorInfo.type} onRetry={refreshData} />;
// 	}

// 	return (
// 		<div className="sales-pipeline qcrm-contacts-list w-full h-full flex flex-col overflow-hidden">
// 			{/* Page Header */}
// 			<div className='flex-shrink-0'>
// 			<div className="flex justify-between items-center mb-6">
// 				<PageHeader
// 					title={selectedPipeline ? selectedPipeline.name : __('Select a pipeline', 'quillcrm')}
// 					subtitle={__('Pipelines', 'quillcrm')}
// 					actions={[]}
// 				/>

// 				<div className="flex gap-4">
// 					{/* Pipeline dropdown + Actions */}
// 					<div className="flex items-center gap-1">
// 						<div className="flex items-center">
// 							<DropdownMenu>
// 								<DropdownMenuTrigger asChild>
// 									<Button
// 										variant="outline"
// 										disabled={pipelines.length <= 0}
// 										className={`text-base font-medium !text-[#374151] leading-[26px] tracking-[-.5px] flex items-center justify-center gap-3 h-10 border !border-[#374151] py-2 px-4 rounded-l-[8px] rounded-r-none ${
// 											pipelines.length <= 1 ? 'cursor-default' : ''
// 										}`}
// 									>
// 										{selectedPipeline ? selectedPipeline.name : 'Select Pipeline'}
// 										<ArrowIcon />
// 									</Button>
// 								</DropdownMenuTrigger>

// 								{pipelines.length > 1 && (
// 									<DropdownMenuContent
// 										style={{ boxShadow: '3px 3px 4px 0 rgba(0, 0, 0, 0.25)' }}
// 										className="p-4 flex flex-col gap-[10px] rounded-[10px] border border-[#F5F5F5]"
// 									>
// 										{pipelines.map((pipeline) => (
// 											<DropdownMenuItem
// 												key={pipeline.id}
// 												onClick={() => setSelectedPipelineId(pipeline.id)}
// 												className={selectedPipelineId === pipeline.id ? 'bg-gray-100' : ''}
// 											>
// 												{pipeline.name}
// 											</DropdownMenuItem>
// 										))}
// 									</DropdownMenuContent>
// 								)}
// 							</DropdownMenu>

// 							{/* Actions Dropdown */}
// 							<DropdownMenu>
// 								<DropdownMenuTrigger asChild>
// 									<Button
// 										variant="outline"
// 										size="icon"
// 										className="rounded-l-none rounded-r-[8px] text-base font-medium !text-[#374151] flex items-center justify-center h-10 w-10 p-0 border !border-[#374151]"
// 									>
// 										<PlusIcon color='#374151' width={24} height={24}/>
// 									</Button>
// 								</DropdownMenuTrigger>
// 								<DropdownMenuContent
// 									align="end"
// 									style={{ boxShadow: '3px 3px 4px 0 rgba(0, 0, 0, 0.25)' }}
// 									className="p-4 flex flex-col gap-[10px] rounded-[10px] border border-[#F5F5F5]"
// 								>
// 									<DropdownMenuItem className="flex items-center gap-2 text-[#2E2C2F] font-medium text-sm leading-[16px]">
// 										<ViewIcon />
// 										{__('View Pipeline', 'quillcrm')}
// 									</DropdownMenuItem>
// 									<DropdownMenuItem
// 										onClick={() => setEditPipelineModalVisible(true)}
// 										disabled={!selectedPipeline}
// 										className="flex items-center gap-2 text-[#374151] font-medium text-sm leading-[16px]"
// 									>
// 										<EditHeaderIcon />
// 										{__('Edit Pipeline', 'quillcrm')}
// 									</DropdownMenuItem>
// 									<DropdownMenuItem
// 										onClick={() => setDeleteDialogOpen(true)}
// 										className="flex items-center gap-2 text-[#2E2C2F] font-medium text-sm leading-[16px]"
// 									>
// 										<TrashIcon />
// 										{__('Delete Pipeline', 'quillcrm')}
// 									</DropdownMenuItem>
// 								</DropdownMenuContent>
// 							</DropdownMenu>
// 						</div>
// 					</div>

// 					{/* New Pipeline Dropdown */}
// 					<div className="flex items-center gap-1">
// 						<DropdownMenu>
// 							<DropdownMenuTrigger asChild>
// 								<Button
// 									variant="outline"
// 									className="text-base font-medium !text-[#3B82F6] leading-[26px] tracking-[-.5px] flex items-center justify-center gap-3 h-10 border !border-[#3B82F6] py-2 px-4 rounded-[8px]"
// 								>
// 									New Pipeline
// 									<ArrowColoredIcon />
// 								</Button>
// 							</DropdownMenuTrigger>
// 							<DropdownMenuContent
// 								style={{ boxShadow: '3px 3px 4px 0 rgba(0, 0, 0, 0.25)' }}
// 								className="p-4 flex flex-col gap-[10px] rounded-[10px] border border-[#F5F5F5]"
// 							>
// 								<DropdownMenuItem
// 									onClick={() => setNewPipelineModalVisible(true)}
// 									className="flex items-center cursor-pointer gap-2 text-[#2E2C2F] font-medium text-sm leading-[16px]"
// 								>
// 									<AddPipIcon />
// 									New Pipeline
// 								</DropdownMenuItem>
// 								<DropdownMenuItem
// 									onClick={() => setDuplicatePipelineModalVisible(true)}
// 									disabled={!selectedPipeline}
// 									className="flex items-center cursor-pointer gap-2 text-[#2E2C2F] font-medium text-sm leading-[16px]"
// 								>
// 									<DuplicatePipelineHeader />
// 									Duplicate Pipeline
// 								</DropdownMenuItem>
// 							</DropdownMenuContent>
// 						</DropdownMenu>
// 					</div>

// 					{/* Add New Deal Button */}
// 					<div className="flex items-center gap-1">
// 						<Button
// 							onClick={() => setNewDealModalVisible(true)}
// 							className="text-base font-medium !text-[#FFF] leading-[26px] tracking-[-.5px] flex items-center justify-center gap-[6px] h-10 bg-[#1E3A8A] py-2 px-4 rounded-[8px]"
// 						>
// 							+ Add New Deal
// 						</Button>
// 					</div>
// 				</div>
// 			</div>

// 			{showDuplicateError && (
// 				<NoticeBanner
// 					notice={{
// 						type: 'error',
// 						message: __('No pipeline selected', 'quillcrm'),
// 					}}
// 					closeNotice={() => setShowDuplicateError(false)}
// 				/>
// 			)}

// 			<PipelineFilters
// 				pipelines={pipelines || []}
// 				selectedPipelineId={selectedPipelineId}
// 				onPipelineChange={setSelectedPipelineId}
// 				filters={filters}
// 				onFiltersChange={setFilters}
// 			/>

// 			</div>
			

// 			<div className='mt-6 flex-1 overflow-y-auto overflow-x-hidden'>
// 				{loading || isPipelineSwitching ? (
// 					<SalesPipelineSkeleton/>
// 				) : selectedPipeline && (
// 					<div className="mt-6">
// 						<KanbanBoard
// 							pipeline={selectedPipeline}
// 							deals={(deals as any) || []}
// 							onRefresh={refreshData}
// 							updateDealOptimistically={updateDealOptimistically}
// 							onDealView={(dealId: number) => {
// 								setSelectedDealId(dealId);
// 								setDealDetailModalVisible(true);
// 							}}
// 							onDealEdit={(deal) => {
// 								setEditingDeal(deal);
// 								setEditDealModalVisible(true);
// 							}}
// 							onDealDelete={(deal) => {
// 								setDealToDelete(deal);
// 								setDeleteDealModalVisible(true);
// 							}}
// 							onDealAddNote={(deal) => handleAddNote(deal)}
// 							onDealLogCall={(deal) => handleLogCall(deal)}
// 							onDealScheduleMeeting={(deal) => handleScheduleMeetingVisible(deal)}
// 							onDealLogEmail={(deal) => handleLogEmailVisible(deal)}
// 							loading={loading}
// 						/>
// 					</div>
// 				)}
// 			</div>

// 			{/* All Modals */}
// 			<PipelineSettingsModal
// 				pipeline={selectedPipeline as any}
// 				visible={settingsModalVisible}
// 				onClose={() => setSettingsModalVisible(false)}
// 				onUpdate={refreshData}
// 				updatePipelineOptimistically={updatePipelineOptimistically}
// 				addStageOptimistically={addStageOptimistically}
// 				updateStageOptimistically={updateStageOptimistically}
// 				removeStageOptimistically={removeStageOptimistically}
// 				reorderStagesOptimistically={reorderStagesOptimistically}
// 			/>

// 			<NewDealModal
// 				visible={newDealModalVisible}
// 				onClose={() => setNewDealModalVisible(false)}
// 				onSuccess={refreshData}
// 				pipeline={selectedPipeline}
// 			/>

// 			<DealDetailModal
// 				dealId={selectedDealId}
// 				visible={dealDetailModalVisible}
// 				onClose={() => {
// 					setDealDetailModalVisible(false);
// 					setSelectedDealId(null);
// 				}}
// 				onUpdate={refreshData}
// 				onEdit={(deal) => {
// 					setEditingDeal(deal);
// 					setEditDealModalVisible(true);
// 					setDealDetailModalVisible(false);
// 					refreshData();
// 				}}
// 				onDeleted={() => {
// 					setDealDetailModalVisible(false);
// 					setSelectedDealId(null);
// 					refreshData();
// 				}}
// 				pipeline={selectedPipeline}
// 			/>

// 			<EditDealModal
// 				visible={editDealModalVisible}
// 				onClose={() => {
// 					setEditDealModalVisible(false);
// 					setEditingDeal(null);
// 				}}
// 				onSuccess={() => {
// 					refreshData();
// 					setEditDealModalVisible(false);
// 					setEditingDeal(null);
// 				}}
// 				deal={editingDeal}
// 				pipelines={pipelines || []}
// 			/>

// 			{selectedPipeline && (
// 				<DuplicatePipelineModal
// 					visible={duplicatePipelineModalVisible}
// 					onClose={() => setDuplicatePipelineModalVisible(false)}
// 					onSuccess={() => {
// 						refreshData();
// 						setDuplicatePipelineModalVisible(false);
// 					}}
// 					pipeline={selectedPipeline}
// 				/>
// 			)}

// 			<NewPipelineModal
// 				visible={newPipelineModalVisible}
// 				onClose={() => setNewPipelineModalVisible(false)}
// 				// onSuccess={() => {
// 				// 	refreshData();
// 				// 	if (!selectedPipelineId && pipelines.length === 0) {
// 				// 		// Will be handled by useEffect when pipelines update
// 				// 	}
// 				// }}
// 				onSuccess={async (newPipeline) => {
// 					await refreshData();
					
// 					if (newPipeline?.id) {
// 						setSelectedPipelineId(newPipeline.id);
// 					}
// 				}}
// 			/>

// 			<EditPipelineModal
// 				visible={editPipelineModalVisible}
// 				onClose={() => setEditPipelineModalVisible(false)}
// 				onSuccess={async (updatedPipeline) => {
// 					await refreshData();
// 					if (updatedPipeline?.id) {
// 						setSelectedPipelineId(updatedPipeline.id);
// 					}
// 					setEditPipelineModalVisible(false);
// 				}}
// 				pipeline={selectedPipeline}
// 			/>

// 			<DeleteDeal
// 				visible={deleteDealModalVisible}
// 				onClose={() => setDeleteDealModalVisible(false)}
// 				deal={dealToDelete}
// 				onConfirm={() => {
// 					refreshData();
// 					setDeleteDealModalVisible(false);
// 				}}
// 			/>

// 			<AddNoteModal
// 				visible={addNoteVisible}
// 				onClose={() => setAddNoteVisible(false)}
// 				dealId={selectedDealForNote?.id}
// 				onSuccess={() => {
// 					setAddNoteVisible(false);
// 					refreshData();
// 				}}
// 				dealTitle={selectedDealForNote?.title}
// 			/>

// 			<LogCallModal
// 				visible={logCallVisible}
// 				onClose={() => setLogCallVisible(false)}
// 				onSuccess={refreshData}
// 				dealId={selectedDealForCall?.id || 0}
// 				dealTitle={selectedDealForCall?.title}
// 				dealContact={selectedDealForCall?.contact}
// 				dealContactName={selectedDealForCall?.contact?.first_name}
// 			/>

// 			<ScheduleMeetingModal
// 				visible={ScheduleMeetingVisible}
// 				onClose={() => setScheduleMeetingVisible(false)}
// 				onSuccess={refreshData}
// 				dealId={selectedDealForCall?.id || 0}
// 				dealTitle={selectedDealForCall?.title}
// 			/>

// 			<LogEmailModal
// 				visible={LogEmailVisible}
// 				onClose={() => setLogEmailVisible(false)}
// 				onSuccess={refreshData}
// 				dealId={selectedDealForCall?.id || 0}
// 				dealTitle={selectedDealForCall?.title}
// 			/>

// 			<DeletePipelineDialog
// 				visible={deleteDialogOpen}
// 				onClose={() => setDeleteDialogOpen(false)}
// 				pipeline={selectedPipeline}
// 				pipelines={pipelines}
// 				onConfirm={async()=>{
// 					await refreshData()
// 					// give me first pipeline
// 					if (pipelines && pipelines.length > 1) {
						
// 						const firstPipeline = pipelines.find(p => p.id !== selectedPipelineId);
// 						if (firstPipeline) {
// 							setSelectedPipelineId(firstPipeline.id);
// 						}
// 					}
// 				}
					 
// 				}
				
// 			/>
// 		</div>
// 	);
// };

// export default SalesPipeline;