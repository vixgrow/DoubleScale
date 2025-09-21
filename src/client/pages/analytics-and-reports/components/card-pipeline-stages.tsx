import { useState, useEffect } from 'react';
import {
	Card,
	CardHeader,
	CardTitle,
	CardContent,
} from '../../../../components/ui/card';
import {
	Select,
	SelectTrigger,
	SelectValue,
	SelectContent,
	SelectItem,
} from '../../../../components/ui/select';
import { __ } from '@wordpress/i18n';
import apiFetch from '@wordpress/api-fetch';

interface PipelineStage {
	id: number;
	name: string;
	count: number;
	value: string;
	color: string;
}

interface PipelineStagesResponse {
	pipeline_stages: {
		pipeline_id: number;
		name: string;
		stages: PipelineStage[];
	};
	pipelines: {
		[key: number]: string;
	};
}

const CardPipelineStages: React.FC<{ ownerId: number | null }> = ({
	ownerId,
}) => {
	const [pipelines, setPipelines] = useState<
		PipelineStagesResponse['pipelines']
	>([]);
	const [selectedPipelineId, setSelectedPipelineId] = useState<number | null>(
		null
	);
	const [pipelineLoading, setPipelineLoading] = useState(false);
	const [pipelineStages, setPipelineStages] = useState<PipelineStage[]>([]);

	const fetchSalesRepPipelineStages = async () => {
		setPipelineLoading(true);
		try {
			let queryParams = selectedPipelineId
				? `?pipeline_id=${selectedPipelineId}&owner_id=${ownerId}`
				: `?owner_id=${ownerId}`;
			const response = (await apiFetch({
				path: `/qc/v1/reports/sales-rep/pipeline-stages${queryParams} `,
			})) as PipelineStagesResponse;

			if (response.pipeline_stages) {
				setPipelineStages(response.pipeline_stages.stages || []);

				// Set selected pipeline if not already set
				if (
					!selectedPipelineId &&
					response.pipeline_stages.pipeline_id
				) {
					setSelectedPipelineId(response.pipeline_stages.pipeline_id);
				}
			}

			if (response.pipelines) {
				setPipelines(response.pipelines);
			}
		} catch (error) {
			console.error('Error fetching pipeline stages:', error);
		} finally {
			setPipelineLoading(false);
		}
	};

	useEffect(() => {
		fetchSalesRepPipelineStages();
	}, []);

	useEffect(() => {
		fetchSalesRepPipelineStages();
	}, [selectedPipelineId]);

	const handlePipelineChange = (value: string) => {
		setSelectedPipelineId(Number(value));
	};

	return (
		<Card>
			<CardHeader>
				<div className="flex justify-between items-center mb-4">
					<CardTitle>{__('Pipeline by Stage', 'quillcrm')}</CardTitle>
					<span className="text-sm text-gray-500">
						{pipelineStages.reduce(
							(total, stage) => total + stage.count,
							0
						)}{' '}
						{__('active deals', 'quillcrm')}
					</span>
				</div>
				{Object.keys(pipelines).length > 0 && (
					<div className="flex items-center gap-2">
						<label className="text-sm font-medium text-gray-700">
							{__('Pipeline:', 'quillcrm')}
						</label>
						<Select
							value={selectedPipelineId?.toString() || ''}
							onValueChange={handlePipelineChange}
						>
							<SelectTrigger className="w-48">
								<SelectValue
									placeholder={__(
										'Select pipeline',
										'quillcrm'
									)}
								/>
							</SelectTrigger>
							<SelectContent>
								{Object.entries(pipelines).map(([id, name]) => (
									<SelectItem key={id} value={id}>
										{name}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
				)}
			</CardHeader>
			<CardContent>
				{pipelineLoading ? (
					<div className="flex justify-center py-8">
						<div className="text-sm text-gray-500">
							{__('Loading pipeline stages...', 'quillcrm')}
						</div>
					</div>
				) : pipelineStages.length > 0 ? (
					<div className="flex justify-between items-center relative py-8">
						{pipelineStages.map((stage, index) => {
							// Calculate progress percentage (assuming max 20 deals per stage for visualization)
							const maxDeals = Math.max(
								...pipelineStages.map((s) => s.count),
								10
							);
							const progressPercentage =
								(stage.count / maxDeals) * 100;
							const circumference = 2 * Math.PI * 35; // radius of 35
							const strokeDashoffset =
								circumference -
								(progressPercentage / 100) * circumference;

							return (
								<div
									key={stage.id}
									className="text-center flex-1 relative"
								>
									{/* Connecting line */}
									{index < pipelineStages.length - 1 && (
										<div
											className="absolute top-[45px] left-[50%] w-full h-0.5 bg-gray-200 z-0"
											style={{
												width: 'calc(100% - 60px)',
												left: '50%',
												transform: 'translateX(30px)',
											}}
										/>
									)}

									{/* Circular progress indicator */}
									<div className="relative w-[90px] h-[90px] mx-auto mb-3">
										<svg
											className="w-[90px] h-[90px] transform -rotate-90"
											viewBox="0 0 80 80"
										>
											{/* Background circle */}
											<circle
												cx="40"
												cy="40"
												r="35"
												stroke="#e5e7eb"
												strokeWidth="6"
												fill="none"
											/>
											{/* Progress circle */}
											<circle
												cx="40"
												cy="40"
												r="35"
												stroke={stage.color}
												strokeWidth="6"
												fill="none"
												strokeDasharray={circumference}
												strokeDashoffset={
													strokeDashoffset
												}
												strokeLinecap="round"
												className="transition-all duration-500 ease-in-out"
											/>
										</svg>
										<div className="absolute inset-0 flex items-center justify-center">
											<div className="text-center">
												<div className="text-xl font-bold text-gray-900">
													{stage.count}
												</div>
											</div>
										</div>
									</div>

									{/* Stage name */}
									<div className="text-sm font-medium text-gray-700 mb-1">
										{stage.name}
									</div>

									{/* Stage value */}
									<div className="text-lg font-bold text-gray-900">
										{stage.value}
									</div>
								</div>
							);
						})}
					</div>
				) : (
					<div className="flex justify-center py-8">
						<div className="text-sm text-gray-500">
							{__('No pipeline stages found', 'quillcrm')}
						</div>
					</div>
				)}
			</CardContent>
		</Card>
	);
};

export default CardPipelineStages;
