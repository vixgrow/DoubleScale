/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useEffect, useState } from '@wordpress/element';

/**
 * External dependencies
 */
import { Skeleton } from 'antd';
import { Plus, Settings, Copy, Zap, RefreshCw } from 'lucide-react';

/**
 * Internal dependencies
 */
import { PageHeader } from '@quillcrm/components';
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
	const [newPipelineModalVisible, setNewPipelineModalVisible] =
		useState(false);
	const [duplicatePipelineModalVisible, setDuplicatePipelineModalVisible] =
		useState(false);
	const [newDealModalVisible, setNewDealModalVisible] = useState(false);
	const [editDealModalVisible, setEditDealModalVisible] = useState(false);
	const [dealDetailModalVisible, setDealDetailModalVisible] = useState(false);
	const [selectedDealId, setSelectedDealId] = useState<number | null>(null);
	const [editingDeal, setEditingDeal] = useState<any | null>(null);
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

	const headerActions = [
		{
			label: __('New Pipeline', 'quillcrm'),
			variant: 'gradient',
			size: 'default',
			icon: <Plus size={16} />,
			className: 'sales-pipeline-btn btn-primary',
			title: __(
				'Create a new sales pipeline with custom stages',
				'quillcrm'
			),
			onClick: () => {
				setNewPipelineModalVisible(true);
			},
			hidden: isDealOwner(),
		},
		{
			label: __('New Deal', 'quillcrm'),
			variant: 'default',
			size: 'default',
			icon: <Zap size={16} />,
			className: 'sales-pipeline-btn btn-secondary',
			title: selectedPipeline
				? __('Add a new deal to this pipeline', 'quillcrm')
				: __('Select a pipeline first to add deals', 'quillcrm'),
			onClick: () => {
				setNewDealModalVisible(true);
			},
			disabled: !selectedPipeline,
			hidden: isDealOwner(),
		},
		{
			label: __('Duplicate Pipeline', 'quillcrm'),
			variant: 'secondary',
			size: 'default',
			icon: <Copy size={16} />,
			className: 'sales-pipeline-btn btn-tertiary',
			title: selectedPipeline
				? __(
						'Create a copy of this pipeline with all stages',
						'quillcrm'
					)
				: __('Select a pipeline first to duplicate it', 'quillcrm'),
			onClick: () => {
				setDuplicatePipelineModalVisible(true);
			},
			disabled: !selectedPipeline,
			hidden: isDealOwner(),
		},
		{
			label: __('Settings', 'quillcrm'),
			variant: 'outline',
			size: 'default',
			icon: <Settings size={16} />,
			className: 'sales-pipeline-btn btn-utility',
			title: selectedPipeline
				? __('Configure pipeline stages and settings', 'quillcrm')
				: __('Select a pipeline first to access settings', 'quillcrm'),
			onClick: () => {
				setSettingsModalVisible(true);
			},
			disabled: !selectedPipeline,
			hidden: isDealOwner(),
		},
	];

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
			<PageHeader
				title={
					selectedPipeline
						? selectedPipeline.name
						: __('Select a pipeline', 'quillcrm')
				}
				subtitle={__('Pipelines', 'quillcrm')}
				actions={headerActions}
			/>

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

			<DuplicatePipelineModal
				visible={duplicatePipelineModalVisible}
				onClose={() => setDuplicatePipelineModalVisible(false)}
				onSuccess={() => {
					refreshData();
				}}
				pipeline={selectedPipeline}
			/>

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
		</div>
	);
};

export default SalesPipeline;
