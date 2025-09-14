/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useState } from '@wordpress/element';
import { useDispatch } from '@wordpress/data';

/**
 * External dependencies
 */
import { Modal, Tabs, Button, Divider, Spin } from 'antd';
import { Settings, Plus, List, BarChart3, Edit3 } from 'lucide-react';

/**
 * Internal dependencies
 */
import { AddStageForm } from '../add-stage-form';
import { StageListManager } from '../stage-list-manager';
import { PipelineBasicInfoForm } from '../pipeline-basic-info-form';
import { useStageOperations } from '../../hooks/use-stage-operations';
import './style.scss';

interface Pipeline {
	id: number;
	name: string;
	description: string;
	stages: Array<{
		id: number;
		pipeline_id: number;
		name: string;
		color: string;
		sort_order: number;
		win_probability: number;
		deal_count?: number;
		total_value?: number;
	}>;
}

interface PipelineSettingsModalProps {
	pipeline: Pipeline | null;
	visible: boolean;
	onClose: () => void;
	onUpdate: () => void;
	updatePipelineOptimistically?: (pipelineId: number, updates: any) => void;
	addStageOptimistically?: (pipelineId: number, stage: any) => void;
	updateStageOptimistically?: (
		pipelineId: number,
		stageId: number,
		updates: any
	) => void;
	removeStageOptimistically?: (pipelineId: number, stageId: number) => void;
	reorderStagesOptimistically?: (
		pipelineId: number,
		newStages: any[]
	) => void;
}

export const PipelineSettingsModal: React.FC<PipelineSettingsModalProps> = ({
	pipeline,
	visible,
	onClose,
	onUpdate,
	updatePipelineOptimistically,
	addStageOptimistically,
	updateStageOptimistically,
	removeStageOptimistically,
	reorderStagesOptimistically,
}) => {
	const [activeTab, setActiveTab] = useState('stages');
	const [loading, setLoading] = useState(false);
	const { createStage, updateStage, deleteStage, reorderStages } =
		useStageOperations();
	const dispatch = useDispatch('quillcrm/core');
	const createNotice = dispatch?.createNotice;

	// Handle stage operations with loading states
	const handleAddStage = async (stageData: {
		name: string;
		color: string;
		win_probability: number;
		position?: number;
	}) => {
		if (!pipeline) return;

		// Create optimistic stage with temporary ID
		const optimisticStage = {
			id: Date.now(), // Temporary ID
			name: stageData.name,
			color: stageData.color,
			win_probability: stageData.win_probability,
			sort_order: stageData.position || pipeline.stages.length,
			pipeline_id: pipeline.id,
		};

		// Optimistically add the stage
		if (addStageOptimistically) {
			addStageOptimistically(pipeline.id, optimisticStage);
		}

		setLoading(true);
		try {
			const newStage = await createStage(pipeline.id, stageData);

			// Update optimistic stage with real data
			if (updateStageOptimistically) {
				updateStageOptimistically(
					pipeline.id,
					optimisticStage.id,
					newStage
				);
			}

			if (createNotice) {
				createNotice({
					type: 'success',
					message: __(
						`Stage "${stageData.name}" added successfully!`,
						'quillcrm'
					),
				});
			}

			// No need to refresh - optimistic update already applied
		} catch (error) {
			// Rollback optimistic update
			if (removeStageOptimistically) {
				removeStageOptimistically(pipeline.id, optimisticStage.id);
			}

			if (createNotice) {
				createNotice({
					type: 'error',
					message:
						error instanceof Error
							? error.message
							: __('Failed to add stage', 'quillcrm'),
				});
			}
			throw error; // Re-throw so the form can handle it
		} finally {
			setLoading(false);
		}
	};

	const handleUpdateStage = async (
		stageId: number,
		stageData: {
			name?: string;
			color?: string;
			win_probability?: number;
		}
	) => {
		if (!pipeline) return;

		// Optimistically update the stage
		if (updateStageOptimistically) {
			updateStageOptimistically(pipeline.id, stageId, stageData);
		}

		setLoading(true);
		try {
			await updateStage(pipeline.id, stageId, stageData);
			// No need to refresh - optimistic update already applied
		} catch (error) {
			// Rollback optimistic update
			const originalStage = pipeline.stages.find((s) => s.id === stageId);
			if (updateStageOptimistically && originalStage) {
				updateStageOptimistically(pipeline.id, stageId, originalStage);
			}
			throw error;
		} finally {
			setLoading(false);
		}
	};

	const handleDeleteStage = async (stageId: number) => {
		if (!pipeline) return;

		const stageToDelete = pipeline.stages.find((s) => s.id === stageId);
		if (!stageToDelete) return;

		// Optimistically remove the stage
		if (removeStageOptimistically) {
			removeStageOptimistically(pipeline.id, stageId);
		}

		setLoading(true);
		try {
			await deleteStage(pipeline.id, stageId);

			if (createNotice) {
				createNotice({
					type: 'success',
					message: __(
						`Stage "${stageToDelete.name}" deleted successfully!`,
						'quillcrm'
					),
				});
			}

			// No need to refresh - optimistic update already applied
		} catch (error) {
			// Rollback optimistic update
			if (addStageOptimistically) {
				addStageOptimistically(pipeline.id, stageToDelete);
			}
			throw error;
		} finally {
			setLoading(false);
		}
	};

	const handleReorderStages = async (stageIds: number[]) => {
		if (!pipeline) return;

		// Create optimistically reordered stages
		const reorderedStages = stageIds
			.map((stageId, index) => {
				const stage = pipeline.stages.find((s) => s.id === stageId);
				return stage ? { ...stage, sort_order: index } : null;
			})
			.filter(Boolean);

		// Apply optimistic update
		if (reorderStagesOptimistically) {
			reorderStagesOptimistically(pipeline.id, reorderedStages);
		}

		setLoading(true);
		try {
			await reorderStages(pipeline.id, stageIds);
			// No need to refresh - optimistic update already applied
		} catch (error) {
			// Rollback optimistic update to original order
			if (reorderStagesOptimistically) {
				reorderStagesOptimistically(pipeline.id, pipeline.stages);
			}
			throw error;
		} finally {
			setLoading(false);
		}
	};

	// Pipeline statistics
	const pipelineStats = pipeline
		? {
				totalStages: pipeline.stages.length,
				totalDeals: pipeline.stages.reduce(
					(sum, stage) => sum + (stage.deal_count || 0),
					0
				),
				totalValue: pipeline.stages.reduce(
					(sum, stage) =>
						sum + (parseFloat(String(stage.total_value || 0)) || 0),
					0
				),
				avgWinProbability:
					pipeline.stages.length > 0
						? pipeline.stages.reduce(
								(sum, stage) => sum + stage.win_probability,
								0
							) / pipeline.stages.length
						: 0,
			}
		: null;

	const tabItems = [
		{
			key: 'basic-info',
			label: (
				<span>
					<Edit3 size={16} />
					{__('Basic Info', 'quillcrm')}
				</span>
			),
			children: (
				<div className="basic-info-tab-content">
					<div className="tab-description">
						<p>
							{__(
								'Edit pipeline name and description. Changes are saved immediately.',
								'quillcrm'
							)}
						</p>
					</div>

					{pipeline && (
						<PipelineBasicInfoForm
							pipeline={pipeline}
							onUpdate={onUpdate}
							updatePipelineOptimistically={
								updatePipelineOptimistically
							}
							loading={loading}
						/>
					)}
				</div>
			),
		},
		{
			key: 'stages',
			label: (
				<span>
					<List size={16} />
					{__('Manage Stages', 'quillcrm')}
				</span>
			),
			children: (
				<div className="stages-tab-content">
					<div className="tab-description">
						<p>
							{__(
								'Drag and drop stages to reorder them. Click the edit icon to modify stage properties.',
								'quillcrm'
							)}
						</p>
					</div>

					{pipeline && (
						<StageListManager
							stages={pipeline.stages}
							onStageUpdate={handleUpdateStage}
							onStageDelete={handleDeleteStage}
							onStageReorder={handleReorderStages}
							loading={loading}
						/>
					)}
				</div>
			),
		},
		{
			key: 'add-stage',
			label: (
				<span>
					<Plus size={16} />
					{__('Add Stage', 'quillcrm')}
				</span>
			),
			children: (
				<div className="add-stage-tab-content">
					<div className="tab-description">
						<p>
							{__(
								'Add a new stage to your sales pipeline. Configure the stage name, color, and win probability.',
								'quillcrm'
							)}
						</p>
					</div>

					{pipeline && (
						<AddStageForm
							pipelineId={pipeline.id}
							existingStages={pipeline.stages}
							onStageAdd={handleAddStage}
							loading={loading}
						/>
					)}
				</div>
			),
		},
		{
			key: 'analytics',
			label: (
				<span>
					<BarChart3 size={16} />
					{__('Analytics', 'quillcrm')}
				</span>
			),
			children: (
				<div className="analytics-tab-content">
					<div className="tab-description">
						<p>
							{__(
								'Overview of your pipeline performance and statistics.',
								'quillcrm'
							)}
						</p>
					</div>

					{pipelineStats && (
						<div className="pipeline-analytics">
							<div className="stats-grid">
								<div className="stat-card">
									<div className="stat-value">
										{pipelineStats.totalStages}
									</div>
									<div className="stat-label">
										{__('Total Stages', 'quillcrm')}
									</div>
								</div>
								<div className="stat-card">
									<div className="stat-value">
										{pipelineStats.totalDeals}
									</div>
									<div className="stat-label">
										{__('Total Deals', 'quillcrm')}
									</div>
								</div>
								<div className="stat-card">
									<div className="stat-value">
										$
										{pipelineStats.totalValue.toLocaleString()}
									</div>
									<div className="stat-label">
										{__('Total Value', 'quillcrm')}
									</div>
								</div>
								<div className="stat-card">
									<div className="stat-value">
										{pipelineStats.avgWinProbability.toFixed(
											1
										)}
										%
									</div>
									<div className="stat-label">
										{__('Avg Win Rate', 'quillcrm')}
									</div>
								</div>
							</div>

							<Divider />

							<div className="stage-breakdown">
								<h4>{__('Stage Breakdown', 'quillcrm')}</h4>
								<div className="stage-stats-list">
									{pipeline?.stages
										?.sort(
											(a, b) =>
												a.sort_order - b.sort_order
										)
										?.map((stage) => (
											<div
												key={stage.id}
												className="stage-stat-item"
											>
												<div className="stage-stat-header">
													<div
														className="stage-color"
														style={{
															backgroundColor:
																stage.color,
														}}
													/>
													<span className="stage-name">
														{stage.name}
													</span>
													<span className="win-rate">
														{stage.win_probability}%
													</span>
												</div>
												<div className="stage-stat-details">
													<span className="deal-count">
														{stage.deal_count || 0}{' '}
														{(stage.deal_count ||
															0) === 1
															? __(
																	'deal',
																	'quillcrm'
																)
															: __(
																	'deals',
																	'quillcrm'
																)}
													</span>
													<span className="total-value">
														$
														{(
															parseFloat(
																String(
																	stage.total_value ||
																		0
																)
															) || 0
														).toLocaleString()}
													</span>
												</div>
											</div>
										))}
								</div>
							</div>
						</div>
					)}
				</div>
			),
		},
	];

	return (
		<Modal
			title={
				<div className="modal-title">
					<Settings size={20} />
					<span>
						{pipeline
							? __(
									`Pipeline Settings - ${pipeline.name}`,
									'quillcrm'
								)
							: __('Pipeline Settings', 'quillcrm')}
					</span>
				</div>
			}
			open={visible}
			onCancel={onClose}
			width={800}
			footer={
				<div className="modal-footer">
					<Button onClick={onClose}>{__('Close', 'quillcrm')}</Button>
				</div>
			}
			className="pipeline-settings-modal"
		>
			<Spin spinning={loading}>
				<div className="modal-content">
					{pipeline ? (
						<Tabs
							activeKey={activeTab}
							onChange={setActiveTab}
							items={tabItems}
							type="card"
						/>
					) : (
						<div className="no-pipeline">
							<p>{__('No pipeline selected.', 'quillcrm')}</p>
						</div>
					)}
				</div>
			</Spin>
		</Modal>
	);
};
