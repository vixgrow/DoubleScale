import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { ColorPicker } from 'antd';
import TrashIcon from '@quillcrm/components/icons/trash';
import { PlusIcon, DragDropIcon } from '@quillcrm/components';
import { Button } from '@/components/ui/button';
import { __ } from '@wordpress/i18n';

export const PipelineStageEditor = ({
	stages,
	setStages,
	onReset,
	onAddStage,
}) => {
	const updateStage = (index, key, value) => {
		setStages((prev) => {
			const updated = [...prev];
			updated[index] = { ...updated[index], [key]: value };
			return updated;
		});
	};

	const removeStage = (index) =>
		setStages((prev) => prev.filter((_, i) => i !== index));

	const handleDragEnd = (result) => {
		if (!result.destination) return;
		const reordered = Array.from(stages);
		const [moved] = reordered.splice(result.source.index, 1);
		reordered.splice(result.destination.index, 0, moved);
		setStages(reordered);
	};

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
														onChange={(e) =>
															updateStage(
																index,
																'name',
																e.target.value
															)
														}
														maxLength={255}
														placeholder="Enter stage name"
														className="input-stage"
													/>
													{index === 0 && (
														<span className="absolute right-4 p-1 gap-2 rounded-[8px] bg-[#F0F0F0] border border-[#DEE1E6] top-1/2 -translate-y-1/2 text-[#777] text-[14px] font-normal">
															Default
														</span>
													)}
												</div>
											</div>

											<div className="flex flex-col">
												{index === 0 && (
													<label className="block mb-2 text-[16px] leading-6 font-normal text-[#09090B]">
														Color
													</label>
												)}
												<div className="flex items-center justify-center relative z-50">
													{/* <ColorPicker
														value={stage.color}
														onChange={(color) =>
															updateStage(
																index,
																'color',
																color.toHexString()
															)
														}
														size="small"
														showText
														format="hex"
														className="w-full input-stage z-50 "
														
													/> */}
													<input value={stage.color} className="w-full input-stage z-50 "/>
												</div>
											</div>

											<div className="flex flex-col w-full">
												{index === 0 && (
													<label className="block mb-2 text-[16px] leading-6 font-normal text-[#09090B]">
														Probability (%)
													</label>
												)}
												<div className="relative w-full">
													<input
														type="number"
														value={
															stage.win_probability
														}
														onChange={(e) =>
															updateStage(
																index,
																'win_probability',
																Number(
																	e.target
																		.value
																) || 0
															)
														}
														min={0}
														max={100}
														placeholder="0–100"
														className="w-full input-stage"
													/>
													<span className="absolute top-0 right-0 w-12 h-full flex items-center justify-center border border-[#DEE1E6] bg-[#F0F0F0] text-[#777] text-sm font-normal p-1 rounded-tr-lg rounded-br-lg pointer-events-none">
														(%)
													</span>
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
					<PlusIcon />
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
