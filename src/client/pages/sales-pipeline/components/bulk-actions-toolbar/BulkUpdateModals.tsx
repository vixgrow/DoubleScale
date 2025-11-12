/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useState, useEffect } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { Button } from '@quillcrm/components/ui/button';
import {
	Select,
	SelectTrigger,
	SelectContent,
	SelectItem,
	SelectValue,
} from '@/components/ui/select';
import { usePipelineData } from '../../hooks/use-pipeline-data';
import apiFetch from '@wordpress/api-fetch';

interface BulkUpdateModalsProps {
	pipeline: {
		id: number;
		stages: Array<{
			id: number;
			name: string;
			color: string;
			sort_order: number;
		}>;
	};
	showStageModal: boolean;
	showOwnerModal: boolean;
	showPriorityModal: boolean;
	showPipelineModal: boolean;
	onCloseStage: () => void;
	onCloseOwner: () => void;
	onClosePriority: () => void;
	onClosePipeline: () => void;
	onUpdate: (field: string, value: any) => void;
	isPerforming: boolean;
}

export const BulkUpdateModals: React.FC<BulkUpdateModalsProps> = ({
	pipeline,
	showStageModal,
	showOwnerModal,
	showPriorityModal,
	showPipelineModal,
	onCloseStage,
	onCloseOwner,
	onClosePriority,
	onClosePipeline,
	onUpdate,
	isPerforming,
}) => {
	const [selectedStage, setSelectedStage] = useState<string>('');
	const [selectedOwner, setSelectedOwner] = useState<string>('');
	const [selectedPriority, setSelectedPriority] = useState<string>('');
	const [selectedPipeline, setSelectedPipeline] = useState<string>('');
	const [owners, setOwners] = useState<any[]>([]);
	const [pipelines, setPipelines] = useState<any[]>([]);

	// Fetch owners
	useEffect(() => {
		if (showOwnerModal) {
			apiFetch({ path: '/qc/v1/users' })
				.then((users: any) => setOwners(users))
				.catch(() => setOwners([]));
		}
	}, [showOwnerModal]);

	// Fetch pipelines with stages
	useEffect(() => {
		if (showPipelineModal) {
			apiFetch({ path: '/qc/v1/pipelines?with_stages=true' })
				.then((pipelines: any) => setPipelines(pipelines))
				.catch(() => setPipelines([]));
		}
	}, [showPipelineModal]);

	const ModalWrapper = ({ children, show, onClose }: any) => {
		if (!show) return null;
		return (
			<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]">
				<div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
					{children}
				</div>
			</div>
		);
	};

	return (
		<>
			{/* Move to Stage Modal */}
			<ModalWrapper show={showStageModal} onClose={onCloseStage}>
				<h3 className="text-lg font-semibold mb-4">
					{__('Move to Stage', 'quillcrm')}
				</h3>
				<div className="mb-6">
					<label className="block text-sm font-medium mb-2">
						{__('Select Stage', 'quillcrm')}
					</label>
					<Select value={selectedStage} onValueChange={setSelectedStage}>
						<SelectTrigger className="w-full">
							<SelectValue placeholder={__('Select a stage', 'quillcrm')} />
						</SelectTrigger>
						<SelectContent>
							{pipeline.stages
								.sort((a, b) => a.sort_order - b.sort_order)
								.map((stage) => (
									<SelectItem key={stage.id} value={String(stage.id)}>
										{stage.name}
									</SelectItem>
								))}
						</SelectContent>
					</Select>
				</div>
				<div className="flex justify-end gap-3">
					<Button
						variant="outline"
						onClick={onCloseStage}
						disabled={isPerforming}
					>
						{__('Cancel', 'quillcrm')}
					</Button>
					<Button
						onClick={() =>
							selectedStage && onUpdate('stage_id', parseInt(selectedStage))
						}
						disabled={isPerforming || !selectedStage}
					>
						{isPerforming ? __('Updating...', 'quillcrm') : __('Update', 'quillcrm')}
					</Button>
				</div>
			</ModalWrapper>

			{/* Change Owner Modal */}
			<ModalWrapper show={showOwnerModal} onClose={onCloseOwner}>
				<h3 className="text-lg font-semibold mb-4">
					{__('Change Owner', 'quillcrm')}
				</h3>
				<div className="mb-6">
					<label className="block text-sm font-medium mb-2">
						{__('Select Owner', 'quillcrm')}
					</label>
					<Select value={selectedOwner} onValueChange={setSelectedOwner}>
						<SelectTrigger className="w-full">
							<SelectValue placeholder={__('Select an owner', 'quillcrm')} />
						</SelectTrigger>
						<SelectContent>
							{owners.map((owner) => (
								<SelectItem key={owner.id} value={String(owner.id)}>
									{owner.display_name || owner.name}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
				<div className="flex justify-end gap-3">
					<Button
						variant="outline"
						onClick={onCloseOwner}
						disabled={isPerforming}
					>
						{__('Cancel', 'quillcrm')}
					</Button>
					<Button
						onClick={() =>
							selectedOwner && onUpdate('owner_id', parseInt(selectedOwner))
						}
						disabled={isPerforming || !selectedOwner}
					>
						{isPerforming ? __('Updating...', 'quillcrm') : __('Update', 'quillcrm')}
					</Button>
				</div>
			</ModalWrapper>

			{/* Change Priority Modal */}
			<ModalWrapper show={showPriorityModal} onClose={onClosePriority}>
				<h3 className="text-lg font-semibold mb-4">
					{__('Change Priority', 'quillcrm')}
				</h3>
				<div className="mb-6">
					<label className="block text-sm font-medium mb-2">
						{__('Select Priority', 'quillcrm')}
					</label>
					<Select value={selectedPriority} onValueChange={setSelectedPriority}>
						<SelectTrigger className="w-full">
							<SelectValue placeholder={__('Select priority', 'quillcrm')} />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="low">{__('Low', 'quillcrm')}</SelectItem>
							<SelectItem value="medium">{__('Medium', 'quillcrm')}</SelectItem>
							<SelectItem value="high">{__('High', 'quillcrm')}</SelectItem>
						</SelectContent>
					</Select>
				</div>
				<div className="flex justify-end gap-3">
					<Button
						variant="outline"
						onClick={onClosePriority}
						disabled={isPerforming}
					>
						{__('Cancel', 'quillcrm')}
					</Button>
					<Button
						onClick={() => selectedPriority && onUpdate('priority', selectedPriority)}
						disabled={isPerforming || !selectedPriority}
					>
						{isPerforming ? __('Updating...', 'quillcrm') : __('Update', 'quillcrm')}
					</Button>
				</div>
			</ModalWrapper>

			{/* Move to Pipeline Modal */}
			<ModalWrapper show={showPipelineModal} onClose={onClosePipeline}>
				<h3 className="text-lg font-semibold mb-4">
					{__('Move to Pipeline', 'quillcrm')}
				</h3>
				<div className="mb-6">
					<label className="block text-sm font-medium mb-2">
						{__('Select Pipeline', 'quillcrm')}
					</label>
					<Select value={selectedPipeline} onValueChange={setSelectedPipeline}>
						<SelectTrigger className="w-full">
							<SelectValue placeholder={__('Select a pipeline', 'quillcrm')} />
						</SelectTrigger>
						<SelectContent>
							{pipelines.map((pipe) => (
								<SelectItem key={pipe.id} value={String(pipe.id)}>
									{pipe.name}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
					<p className="text-sm text-gray-500 mt-2">
						{__('Deals will be moved to the first stage of the selected pipeline', 'quillcrm')}
					</p>
				</div>
				<div className="flex justify-end gap-3">
					<Button
						variant="outline"
						onClick={onClosePipeline}
						disabled={isPerforming}
					>
						{__('Cancel', 'quillcrm')}
					</Button>
					<Button
						onClick={() => {
							if (selectedPipeline) {
								const targetPipeline = pipelines.find(p => p.id === parseInt(selectedPipeline));

								if (targetPipeline && targetPipeline.stages && targetPipeline.stages.length > 0) {
									// Sort stages by sort_order and get the first one
									const sortedStages = [...targetPipeline.stages].sort((a: any, b: any) => a.sort_order - b.sort_order);
									const firstStage = sortedStages[0];

									// Send both pipeline_id and stage_id
									onUpdate('pipeline_id', parseInt(selectedPipeline), firstStage.id);
								} else {
									// Fallback: send just pipeline_id (backend should handle this)
									onUpdate('pipeline_id', parseInt(selectedPipeline));
								}
							}
						}}
						disabled={isPerforming || !selectedPipeline}
					>
						{isPerforming ? __('Updating...', 'quillcrm') : __('Update', 'quillcrm')}
					</Button>
				</div>
			</ModalWrapper>
		</>
	);
};
