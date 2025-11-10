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
import { PipelineFilters } from './components/pipeline-filters';
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
import { Deal, Filters } from './types';
import { AddNoteModal } from './components/add-note-modal';
import { LogCallModal } from './components/log-call-modal';
import { ScheduleMeetingModal } from './components/schedule-meeting-modal';
import { LogEmailModal } from './components/log-email-modal';
import { ErrorState } from '@quillcrm/components/pipeline-errorState/ErrorState';
import { handleApiError } from './utils/error-handler';
import { SalesPipelineSkeleton } from './SalesPipelineSkeleton';
import { PipelineHeader } from './components/salePipeline-header/SalePipelineHeader';
import { PipelineFilters } from './components/pipeline-filters';

// Import types for proper typing
type Filters = {
	search: string;
	ownerId: number | null;
	dateRange: {
		from: Date | null;
		to: Date | null;
	};
	status: 'open' | 'won' | 'lost';
	priority: string | null;
};

const SalesPipeline: React.FC = () => {
	const [isPipelineSwitching, setIsPipelineSwitching] = useState(false);
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
	const [lastPipelineId, setLastPipelineId] = useState<number | null>(null);
	const [filters, setFilters] = useState<Filters>({
		search: '',
		ownerId: null,
		dateRange: { from: null, to: null },
		status: 'open',
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

	useEffect(() => {
		// if (!selectedPipelineId) return;
		// if (selectedPipelineId === lastPipelineId) return;
	
		setIsPipelineSwitching(true);
		refreshData().finally(() => {
			setIsPipelineSwitching(false);
		});
	
		setLastPipelineId(selectedPipelineId); 
	}, [selectedPipelineId]);


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
				setIsPipelineSwitching={setIsPipelineSwitching}
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
				{loading || isPipelineSwitching ?(
					<SalesPipelineSkeleton/>

				):
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
				onConfirm={refreshData}
			/>
		</div>
	);
};

export default SalesPipeline;
