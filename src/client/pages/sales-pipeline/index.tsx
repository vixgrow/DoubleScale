/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { ProFeatureNotice } from '@quillcrm/components/pro-feature-notice';
import { PipelineSettingsModal } from './components/pipeline-settings-modal';
// import { NewDealModal } from './components/new-deal-modal';
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
import { NewDealModal } from './components/new-deal-modal';

const SalesPipeline: React.FC = () => {
	return (
		<ProFeatureNotice
			featureName={__('Sales Pipeline', 'quillcrm')}
			description={__(
				'Manage your sales process with visual pipeline boards, track deals through stages, and close more sales with our powerful CRM features.',
				'quillcrm'
			)}
		/>
	);
};

export default SalesPipeline;

/* Original implementation moved to Pro plugin
const SalesPipelineOld: React.FC = () => {
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
	const [notice, setNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
	const [filters, setFilters] = useState<Filters>({
		search: '',
		ownerId: null,
		expectedCloseDateRange: { from: null, to: null },
		createdDateRange: { from: null, to: null },
		valueRange: { min: null, max: null },
		status: 'all',
		priority: null,
	});

	// Bulk operations state
	const [selectMode, setSelectMode] = useState(false);
	const [selectedDealIds, setSelectedDealIds] = useState<number[]>([]);
	const [isPerformingBulk, setIsPerformingBulk] = useState(false);

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

	// Clear selection when pipeline changes or select mode is disabled
	useEffect(() => {
		setSelectedDealIds([]);
	}, [selectMode, selectedPipelineId]);

	// Bulk operations handlers
	const toggleSelectMode = () => {
		setSelectMode(!selectMode);
		if (selectMode) {
			setSelectedDealIds([]);
		}
	};

	const toggleDealSelection = (dealId: number) => {
		setSelectedDealIds(prev => {
			if (prev.includes(dealId)) {
				return prev.filter(id => id !== dealId);
			} else {
				return [...prev, dealId];
			}
		});
	};

	const selectAllVisible = () => {
		const visibleDealIds = deals.map(deal => deal.id);
		setSelectedDealIds(visibleDealIds);
	};

	const clearSelection = () => {
		setSelectedDealIds([]);
	};

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
				selectMode={selectMode}
				toggleSelectMode={toggleSelectMode}
				selectedCount={selectedDealIds.length}
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

			{notice && (
           <NoticeBanner
           notice={notice}
           closeNotice={() => setNotice(null)}
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
							selectMode={selectMode}
							selectedDealIds={selectedDealIds}
							toggleDealSelection={toggleDealSelection}
							selectAllVisible={selectAllVisible}
							clearSelection={clearSelection}
							isPerformingBulk={isPerformingBulk}
							setIsPerformingBulk={setIsPerformingBulk}
							onNotice={(notice) => setNotice(notice)}
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
				// onSuccess={refreshData}
				onSuccess={(notice) => {
					refreshData();
					if (notice) {
					  setNotice(notice); 
					}
				  }}
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
				onNotice={(notice) => setNotice(notice)}
			
				pipeline={selectedPipeline}
			/>

			<EditDealModal
				visible={editDealModalVisible}
				onClose={() => {
					setEditDealModalVisible(false);
					setEditingDeal(null);
				}}
				onSuccess={(notice) => {
					refreshData();
					setEditDealModalVisible(false);
					setEditingDeal(null);

					if (notice) {
						setNotice(notice); 
					}
				}}
				deal={editingDeal}
				pipelines={pipelines || []}
			/>

			{selectedPipeline && (
				<DuplicatePipelineModal
					visible={duplicatePipelineModalVisible}
					onClose={() => setDuplicatePipelineModalVisible(false)}
					onSuccess={async (newPipeline, notice) => {
						await refreshData();
						if (notice) {
						  setNotice(notice);
						}
						setDuplicatePipelineModalVisible(false);
					  }}
					pipeline={selectedPipeline}
				/>
			)}

			<NewPipelineModal
				visible={newPipelineModalVisible}
				onClose={() => setNewPipelineModalVisible(false)}
				onSuccess={async (newPipeline, notice) => {
					await refreshData();
					if (newPipeline?.id) {
					  setSelectedPipelineId(newPipeline.id);
					}
					if (notice) {
					  setNotice(notice); 
					}
				  }}
			/>
			<EditPipelineModal
				visible={editPipelineModalVisible}
				onClose={() => setEditPipelineModalVisible(false)}
				onSuccess={async (updatedPipeline, notice) => {
					await refreshData();
					if (updatedPipeline?.id) {
					  setSelectedPipelineId(updatedPipeline.id);
					}
					if (notice) {
					  setNotice(notice);
					}
					setEditPipelineModalVisible(false);
				  }}
				pipeline={selectedPipeline}
			/>
			<DeleteDeal
				visible={deleteDealModalVisible}
				onClose={() => setDeleteDealModalVisible(false)}
				deal={dealToDelete}
				onConfirm={(notice) => {
					refreshData();
					setDeleteDealModalVisible(false);
					if (notice) {
						setNotice(notice); 
					 }
				}}
			/>
			<AddNoteModal
				visible={addNoteVisible}
				onClose={() => setAddNoteVisible(false)}
				dealId={selectedDealForNote?.id}
				onSuccess={(notice) => {
					setAddNoteVisible(false);
					refreshData();
					if (notice) {
						setNotice(notice);
					}
				}}
				dealTitle={selectedDealForNote?.title}
			/>
			<LogCallModal
				visible={logCallVisible}
				onClose={() => setLogCallVisible(false)}
				onSuccess={(notice) => {
					refreshData();
					if (notice) {
					  setNotice(notice);
					}
				  }}
				dealId={selectedDealForCall?.id || 0}
				dealTitle={selectedDealForCall?.title}
				dealContact={selectedDealForCall?.contact}
				dealContactName={selectedDealForCall?.contact?.first_name}
			/>
			<ScheduleMeetingModal
				visible={ScheduleMeetingVisible}
				onClose={() => setScheduleMeetingVisible(false)}
				onSuccess={(notice) => {
					refreshData();
					if (notice) {
					  setNotice(notice);
					}
				  }}
				dealId={selectedDealForCall?.id || 0}
				dealTitle={selectedDealForCall?.title}
			/>
			<LogEmailModal
				visible={LogEmailVisible}
				onClose={() => setLogEmailVisible(false)}
				onSuccess={(notice) => {
					refreshData();
					if (notice) {
					  setNotice(notice);
					}
				  }}
				dealId={selectedDealForCall?.id || 0}
				dealTitle={selectedDealForCall?.title}
			/>
			<DeletePipelineDialog
				visible={deleteDialogOpen}
				onClose={() => setDeleteDialogOpen(false)}
				pipeline={selectedPipeline}
				pipelines={pipelines}
				onConfirm={async (notice) => {
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
				if (notice) {
					setNotice(notice);
				}
			}}
			/>
		</div>
	);
};
*/

