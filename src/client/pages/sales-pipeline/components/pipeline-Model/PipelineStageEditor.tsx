

import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import TrashIcon from '@quillcrm/components/icons/trash';
import {  DragDropIcon, PlusIcon } from '@quillcrm/components';
import { Button } from '@/components/ui/button';
import { __ } from '@wordpress/i18n';
import { COLORS, CustomColorPicker } from '@quillcrm/components/custom-colorPicker';
import { useStageOperations } from '../../hooks/use-stage-operations';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@quillcrm/components/ui/select';
import { useState } from 'react';

export const PipelineStageEditor = ({
	stages,
	setStages,
	onReset,
	onAddStage,
}) => {
	const { updateStage, reorderStages } = useStageOperations();
	const [customInputIndex, setCustomInputIndex] = useState(null);

	const updateStageHandler = async (index, key, value) => {
		setStages((prev) => {
			const updated = [...prev];
			updated[index] = { ...updated[index], [key]: value };
			return updated;
		});

		const stage = stages[index];
		try {
			await updateStage(stage.pipeline_id, stage.id, { [key]: value });
		} catch (error) {
			console.error('Failed to update stage:', error);
		}
	};

	const removeStage = (index) =>
		setStages((prev) => prev.filter((_, i) => i !== index));

	const handleDragEnd = async (result) => {
		if (!result.destination) return;

		const reordered = Array.from(stages);
		const [moved] = reordered.splice(result.source.index, 1);
		reordered.splice(result.destination.index, 0, moved);
		setStages(reordered);

		try {
			const stageIds = (reordered as any[]).map((s) => s.id);
			await reorderStages(stages[0]?.pipeline_id, stageIds);
		} catch (error) {
			console.error('Failed to reorder stages:', error);
		}
	};

	const uniqueProbabilities = [...new Set(
		stages
			.map(s => s.win_probability)
			.filter(p => typeof p === 'number')
	)].sort((a, b) => (a as number) - (b as number));
	const probabilityOptions = Array.from({ length: 11 }, (_, i) => i * 10);

	return (
		<>
			<DragDropContext onDragEnd={handleDragEnd}>
				<Droppable droppableId="stages-droppable">
					{(provided) => (
						<div
							className="stages-list w-full mt-4 "
							ref={provided.innerRef}
							{...provided.droppableProps}
						>
							{stages.map((stage, index) => (
								<Draggable
									key={index.toString()}
									draggableId={index.toString()}
									index={index}
									isDragDisabled={index === 0}
								>
									{(provided, snapshot) => (
										<div
											ref={provided.innerRef}
											{...provided.draggableProps}
											{...(index !== 0
												? provided.dragHandleProps
												: {})}
											className={`grid md:grid-cols-[28px_minmax(200px,1fr)_minmax(120px,1fr)_minmax(120px,1fr)_28px] gap-2 pr-2 items-center mb-4 w-full rounded-[6px] ${
												snapshot.isDragging
													? 'bg-[#f5f5ff] shadow-md'
													: 'bg-white'
											}`}
										>
											<div>
												{index !== 0 && (
													<div
														className="mr-2 p-0 cursor-grab hover:bg-transparent "
														{...provided.dragHandleProps}
													>
														<DragDropIcon />
													</div>
												)}
											</div>

											<div className="flex flex-col">
												{index === 0 && (
													<label className="block mb-2 text-[16px] leading-6 font-normal text-[#09090B]">
														{__(
															'Stage Name',
															'quillcrm'
														)}
													</label>
												)}
												<div className="relative w-full flex justify-center">
													<input
														type="text"
														value={stage.name}
														onChange={(e) => updateStageHandler(index, 'name', e.target.value)}
														maxLength={255}
														placeholder="Enter stage name"
														className="input-stage"
													/>
													{index === 0 && (
														<span className="absolute right-4 p-1 gap-2 rounded-[8px] bg-[#F0F0F0] border border-[#DEE1E6] top-1/2 -translate-y-1/2 text-[#777] text-[14px] font-normal">
															{__(
															'Default',
															'quillcrm'
														)}
														</span>
													)}
												</div>
											</div>

											<div className="flex flex-col">
												{index === 0 && (
													<label className="block mb-2 text-[16px] leading-6 font-normal text-[#09090B]">
														
														{__(
															'Color',
															'quillcrm'
														)}
													</label>
												)}
												<div className="flex items-center justify-center relative ">
													<CustomColorPicker
														colors={COLORS}
														selected={stage.color}
														onSelect={(color) => updateStageHandler(index, 'color', color)}
													/>
												</div>
											</div>

											<div className="flex flex-col w-full">
												{index === 0 && (
													<label className="block mb-2 text-[16px] leading-6 font-normal text-[#09090B]">
														{__(
															'Probability',
															'quillcrm'
														)} (%)
													</label>
												)}
												<div className="relative w-full">
													{customInputIndex === index ? (
														// Custom Input Mode
														<div className="relative w-full">
															<input
																type="number"
																value={stage.win_probability}
																onChange={(e) => {
																	const val = Number(e.target.value);
																	if (val >= 0 && val <= 100) {
																		updateStageHandler(index, 'win_probability', val);
																	}
																}}
																onBlur={() => setCustomInputIndex(null)}
																onKeyDown={(e) => {
																	if (e.key === 'Enter') {
																		setCustomInputIndex(null);
																	}
																}}
																autoFocus
																min={0}
																max={100}
																placeholder="0–100"
																className="w-full input-stage"
															/>
															<span className="absolute top-0 right-0 w-12 h-full flex items-center justify-center border border-[#DEE1E6] bg-[#F0F0F0] text-[#777] text-sm font-normal p-1 rounded-tr-lg rounded-br-lg pointer-events-none">
																(%)
															</span>
														</div>
													) : (
														// Select Mode
														
														<div className="relative w-full">
															<Select
																value={stage.win_probability?.toString() || ""}
																onValueChange={(value) => {
																	if (value === "custom") {
																		setCustomInputIndex(index);
																	} else {
																		updateStageHandler(index, 'win_probability', Number(value));
																	}
																}}
															>
																<SelectTrigger className="w-full h-12 border border-[#DEE1E6] rounded-lg pr-12 text-[#09090B] hover:border-[#DEE1E6] focus:border-[#DEE1E6] focus:outline-none focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 active:border-[#DEE1E6]">
																	<SelectValue placeholder="0–100" />
																</SelectTrigger>
																<SelectContent>
																	{uniqueProbabilities.map((prob) => {
																		const numProb = typeof prob === 'number' ? prob : Number(prob);
																		let label = `${numProb}`;
                                                                        if (stage.name === "Closed Won" && numProb === 100 ) label = `${numProb}(Won)`;
                                                                        if (stage.name === "Closed Lost" && numProb === 0) label = `${numProb}(Lost)`;
																		return (
																			<SelectItem key={numProb.toString()} value={numProb.toString()} className='text-[#09090B]'>
																				{`${label}`}
																			</SelectItem>
																		);
																	})}
																	<SelectItem 
																		value="custom" 
																		className="text-[#1E3A8A] font-medium border-t border-[#DEE1E6] mt-1"
																	>
																		
																		+ {__(
															'Custom Value',
															'quillcrm'
														)}
																	</SelectItem>
																</SelectContent>
															</Select>
									
															<span className="absolute top-0 right-0 w-12 h-full flex items-center justify-center border border-[#DEE1E6] bg-[#F0F0F0] text-[#777] text-sm font-normal p-1 rounded-tr-lg rounded-br-lg pointer-events-none">
																(%)
															</span>
														</div>
													)}
												</div>
											</div>

											<div className="flex items-center justify-center w-full ">
												{index !== 0 && (
													<button
														className="ml-4 w-6 hover:bg-transparent "
														onClick={() =>
															removeStage(index)
														}
													>
														<TrashIcon />
													</button>
												)}
											</div>
										</div>
									)}
								</Draggable>
							))}
							{provided.placeholder}
						</div>
					)}
				</Droppable>
			</DragDropContext>

			<div className="flex items-center gap-4 pb-5 mt-2">
				<button
					onClick={onAddStage}
					className="border-none mr-2 flex add-stage-button p-0 text-[16px] bg-[#fff] shadow-none text-[#1E3A8A] font-normal font-[inter] leading-[150%] tracking-[-0.32px]"
				>
					<span className='pr-1'><PlusIcon color='#1E3A8A' /></span>
					{__('Add Stage', 'quillcrm')}
				</button>

				<div className="w-[2px] h-6 bg-[#DEE1E6]" />

				<Button
					variant="ghost"
					onClick={onReset}
					className="text-[#E13B3B] hover:bg-transparent hover:text-[#E13B3B] p-0 text-[16px] font-normal font-[inter] leading-[150%] tracking-[-0.32px]"
				>
					{__('Reset to Defaults', 'quillcrm')}
				</Button>
			</div>
		</>
	);
};