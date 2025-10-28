// /**
//  * WordPress dependencies
//  */
import { __ } from '@wordpress/i18n';
// import { useState, useEffect } from '@wordpress/element';
// import { useDispatch } from '@wordpress/data';

import { PipelineModal } from "../pipeline-Model";

// /**
//  * External dependencies
//  */
// import { ColorPicker } from 'antd';
// import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
// import { z } from 'zod';

// /**
//  * Internal dependencies
//  */
// import { usePipelineOperations } from '../../hooks/use-pipeline-operations';
// import {
// 	Form,
// 	FormControl,
// 	FormField,
// 	FormItem,
// 	FormLabel,
// 	FormMessage,
// } from '@/components/ui/form';
// import { useForm } from 'react-hook-form';
// import { Input } from '@/components/ui/input';
// import TrashIcon from '@quillcrm/components/icons/trash';
// import './style.scss';
// import {
// 	Dialog,
// 	DialogContent,
// 	DialogHeader,
// 	DialogTitle,
// } from '@quillcrm/components/ui/dialog';
// import {
// 	AlertIcon,
// 	CustomDialogHeader,
// 	DragDropIcon,
// 	NoticeBanner,
// 	PlusIcon,
// } from '@quillcrm/components';
import DuplicatePipelineDialog from '@quillcrm/components/icons/duplicate-pipeline-modal';
// import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
// import { PipelineStageHeaderBox } from '@quillcrm/components/pipeline-stage-headerBox/pipeline-stage-headerBox';
// import { zodResolver } from '@hookform/resolvers/zod';
// import { Button } from '@/components/ui/button';
// import { StageColorBody } from '@quillcrm/components/stagebody-color/stagebodyColor';

// // const { Title, Text } = Typography;
// export interface DuplicatePipelineModalProps {
// 	visible: boolean;
// 	onClose: () => void;
// 	onSuccess: () => void;
// 	pipeline: any | null;
// }

// const formSchema = z.object({
// 	name: z
// 		.string()
// 		.min(2, {
// 			message: 'Username must be at least 2 characters.',
// 		})
// 		.max(255, {
// 			message: "'Pipeline name must not exceed 255 characters",
// 		}),
// });
// type FormValues = z.infer<typeof formSchema>;

// export const DuplicatePipelineModal: React.FC<DuplicatePipelineModalProps> = ({
// 	visible,
// 	onClose,
// 	onSuccess,
// 	pipeline,
// }) => {
// 	// const [form] = Form.useForm();
// 	const [loading, setLoading] = useState(false);
// 	const [customStages, setCustomStages] = useState(pipeline?.stages || []);
// 	const [originalPipeline, setOriginalPipeline] = useState<any | null>(null);

// 	const { duplicatePipeline } = usePipelineOperations();
// 	const dispatch = useDispatch('quillcrm/core');
// 	const createNotice = dispatch?.createNotice;

// 	const form = useForm<FormValues>({
// 		resolver: zodResolver(formSchema),
// 		defaultValues: { name: '' },
// 	});

// 	// Initialize form when pipeline changes
// 	useEffect(() => {
// 		if (pipeline && visible) {
// 			form.setValue('name', `Copy of ${pipeline.name}`);
// 			setCustomStages(pipeline?.stages || []);


//             //  save data at first time
// 			setOriginalPipeline({
// 				name: `Copy of ${pipeline.name}`,
// 				stages: pipeline?.stages || [],
// 			}); 
// 		}

// 	}, [pipeline, visible, form]);

// 	const handleSubmit = async (values: { name: string }) => {
// 		if (!pipeline) return;

// 		setLoading(true);
// 		try {
// 			await duplicatePipeline(pipeline.id, values.name.trim());

// 			if (createNotice) {
// 				createNotice({
// 					type: 'success',
// 					message: __(
// 						`Pipeline "${values.name}" created successfully!`,
// 						'quillcrm'
// 					),
// 				});
// 			}

// 			onSuccess();
// 			onClose();
// 			form.reset();
// 		} catch (error) {
// 			if (createNotice) {
// 				createNotice({
// 					type: 'error',
// 					message:
// 						error instanceof Error
// 							? error.message
// 							: __('Failed to duplicate pipeline', 'quillcrm'),
// 				});
// 			}
// 		} finally {
// 			setLoading(false);
// 		}
// 	};

// 	const updateStage = (index: number, key: string, value: any) => {
// 		setCustomStages((prev) => {
// 			const updated = [...prev];
// 			updated[index] = { ...updated[index], [key]: value };
// 			return updated;
// 		});
// 	};

// 	const removeStage = (index: number) => {
// 		setCustomStages((prev) => prev.filter((_, i) => i !== index));
// 	};

// 	const handleDragEnd = (result: any) => {
// 		if (!result.destination) return;
// 		const reordered = Array.from(customStages);
// 		const [moved] = reordered.splice(result.source.index, 1);
// 		reordered.splice(result.destination.index, 0, moved);
// 		setCustomStages(reordered);
// 	};

// 	const resetToDuplicate = () => {
// 		if (!originalPipeline) return;
	
// 		form.setValue('name', originalPipeline.name);
// 		setCustomStages(originalPipeline.stages);
// 	};

// 	const addStage = () => {
// 		setCustomStages((prev) => [
// 			...prev,
// 			{
// 				name: `Stage ${prev.length + 1}`,
// 				color: '#1E3A8A',
// 				win_probability: 0,
// 			},
// 		]);
// 	};


// 	const handleCancel = () => {
// 		form.reset();
// 		onClose();
// 	};

// 	// if (!pipeline) return null;
// 	return (
// 		<Dialog
// 			open={visible}
// 			onOpenChange={(open) => {
// 				if (!open) {
// 					handleCancel();
// 				}
// 			}}
// 		>
// 			<DialogContent className="w-full max-w-7xl max-h-[80vh] overflow-y-auto my-4 sm:mx-auto z-[10000] p-6 rounded-[16px] pipline-content">
// 				<DialogHeader>
// 					<DialogTitle>
// 						<CustomDialogHeader
// 							title={__('Duplicate Pipeline', 'quillcrm')}
// 							subtitle=""
// 							icon={<DuplicatePipelineDialog />}
// 						/>
// 					</DialogTitle>
// 				</DialogHeader>
// 				{/* Alert */}
// 				<Alert
// 					variant="default"
// 					className="bg-[#F8F8F8] !text-xl border text-[#E13B3B] border-[#DEE1E6] font-medium rounded-[8px] w-[50%] p-4 gap-[10px] flex justify-center items-center mx-auto"
// 				>
// 					<div>
// 						<AlertIcon color="#E13B3B" />
// 					</div>
// 					<div className=" flex items-center gap-1">
// 						<AlertTitle className=" font-medium mt-0.5">
// 							Note:
// 						</AlertTitle>
// 						<AlertDescription className=" text-xl">
// 							Deals will not be copied to the new pipeline.
// 						</AlertDescription>
// 					</div>
// 				</Alert>
// 				{/* content */}

// 				<div className=" grid grid-cols-1 md:grid-cols-2 gap-6">
// 					<div className="new-pipeline flex p-5 flex-col w-full">
// 						<Form {...form}>
// 							<form onSubmit={form.handleSubmit(handleSubmit)}>
// 								<FormField
// 									control={form.control}
// 									name="name"
// 									render={({ field }) => (
// 										<FormItem className="mb-6">
// 											<FormLabel className="text-[#09090B] text-base font-medium">
// 												{__(
// 													'New Pipeline Name',
// 													'quillcrm'
// 												)}{' '}
// 												<span className="text-[#E13B3B]">
// 													*
// 												</span>
// 											</FormLabel>
// 											<FormControl>
// 												<Input
// 													{...field}
// 													value={
// 														field.value ||
// 														`Copy of ${pipeline?.name || ''}`
// 													}
// 													onChange={(e) =>
// 														form.setValue(
// 															'name',
// 															e.target.value
// 														)
// 													}
// 													placeholder={__(
// 														'Enter pipeline name',
// 														'quillcrm'
// 													)}
// 													className="mt-2 h-11 border border-[#DEE1E6] rounded-md"
// 												/>
// 											</FormControl>
// 											<FormMessage />
// 										</FormItem>
// 									)}
// 								/>
// 							</form>
// 							{/* Stage Configuration */}
// 							<DragDropContext onDragEnd={handleDragEnd}>
// 								<Droppable droppableId="stages-droppable">
// 									{(provided) => (
// 										<div
// 											className="stages-list w-full mt-4 "
// 											ref={provided.innerRef}
// 											{...provided.droppableProps}
// 										>
// 											{customStages.map(
// 												(stage, index) => (
// 													<Draggable
// 														key={index.toString()}
// 														draggableId={index.toString()}
// 														index={index}
// 														isDragDisabled={
// 															index === 0
// 														}
// 													>
// 														{(
// 															provided,
// 															snapshot
// 														) => (
// 															<div
// 																ref={
// 																	provided.innerRef
// 																}
// 																{...provided.draggableProps}
// 																{...(index !== 0
// 																	? provided.dragHandleProps
// 																	: {})}
// 																className={`grid md:grid-cols-[28px_minmax(200px,1fr)_minmax(120px,1fr)_minmax(120px,1fr)_28px] gap-2 pr-2 items-center mb-4 w-full rounded-[6px] ${snapshot.isDragging ? 'bg-[#f5f5ff] shadow-md' : 'bg-white'}`}
// 															>
// 																{/* Drag icon */}
// 																<div>
// 																	{index !==
// 																		0 && (
// 																		<div
// 																			className="mr-2 p-0 cursor-grab hover:bg-transparent "
// 																			{...provided.dragHandleProps}
// 																		>
// 																			<DragDropIcon />
// 																		</div>
// 																	)}
// 																</div>

// 																{/* Stage name */}
// 																<div className="flex flex-col">
// 																	{index ===
// 																		0 && (
// 																		<label className="block mb-2 text-[16px] leading-6 font-normal text-[#09090B]">
// 																			{__(
// 																				'Stage Name',
// 																				'quillcrm'
// 																			)}
// 																		</label>
// 																	)}
// 																	<div className="relative w-full flex justify-center">
// 																		<input
// 																			type="text"
// 																			value={
// 																				stage.name
// 																			}
// 																			onChange={(
// 																				e
// 																			) =>
// 																				updateStage(
// 																					index,
// 																					'name',
// 																					e
// 																						.target
// 																						.value
// 																				)
// 																			}
// 																			maxLength={
// 																				255
// 																			}
// 																			placeholder="Enter stage name"
// 																			className="input-stage"
// 																		/>
// 																		{index ===
// 																			0 && (
// 																			<span className="absolute right-4 p-1 gap-2 rounded-[8px] bg-[#F0F0F0] border border-[#DEE1E6] top-1/2 -translate-y-1/2 text-[#777] text-[14px] font-normal">
// 																				Default
// 																			</span>
// 																		)}
// 																	</div>
// 																</div>

// 																{/* Color Picker */}
// 																<div className="flex flex-col">
// 																	{index ===
// 																		0 && (
// 																		<label className="block mb-2 text-[16px] leading-6 font-normal text-[#09090B]">
// 																			{__(
// 																				'Color',
// 																				'quillcrm'
// 																			)}
// 																		</label>
// 																	)}
// 																	<div className="flex items-center justify-center relative z-50">
// 																		<ColorPicker
// 																			value={
// 																				stage.color
// 																			}
// 																			onChange={(
// 																				color
// 																			) =>
// 																				updateStage(
// 																					index,
// 																					'color',
// 																					color.toHexString()
// 																				)
// 																			}
// 																			size="small"
// 																			showText
// 																			format="hex"
// 																			className="w-full input-stage z-50 "
// 																		/>
// 																	</div>
// 																</div>

// 																{/* Probability */}
// 																<div className="flex flex-col w-full">
// 																	{index ===
// 																		0 && (
// 																		<label className="block mb-2 text-[16px] leading-6 font-normal text-[#09090B]">
// 																			Probability
// 																			(%)
// 																		</label>
// 																	)}
// 																	<div className="relative w-full">
// 																		<input
// 																			type="number"
// 																			value={
// 																				stage.win_probability
// 																			}
// 																			onChange={(
// 																				e
// 																			) =>
// 																				updateStage(
// 																					index,
// 																					'win_probability',
// 																					Number(
// 																						e
// 																							.target
// 																							.value
// 																					) ||
// 																						0
// 																				)
// 																			}
// 																			min={
// 																				0
// 																			}
// 																			max={
// 																				100
// 																			}
// 																			placeholder="0–100"
// 																			className="w-full input-stage"
// 																		/>
// 																		<span className="absolute top-0 right-0 w-12 h-full flex items-center justify-center border border-[#DEE1E6] bg-[#F0F0F0] text-[#777] text-sm font-normal p-1 rounded-tr-lg rounded-br-lg pointer-events-none">
// 																			(%)
// 																		</span>
// 																	</div>
// 																</div>

// 																{/* Delete */}
// 																<div className="flex items-center justify-center w-full ">
// 																	{index !==
// 																		0 && (
// 																		<button
// 																			className="ml-4 w-6 hover:bg-transparent "
// 																			onClick={() =>
// 																				removeStage(
// 																					index
// 																				)
// 																			}
// 																		>
// 																			<TrashIcon />
// 																		</button>
// 																	)}
// 																</div>
// 															</div>
// 														)}
// 													</Draggable>
// 												)
// 											)}
// 											{provided.placeholder}
// 										</div>
// 									)}
// 								</Droppable>
// 							</DragDropContext>
							
// 						</Form>
// 						<div className="flex items-center gap-4 pb-5 mt-2">
// 								<button
// 									onClick={addStage}
// 									className="border-none mr-2 flex add-stage-button p-0 text-[16px] bg-[#fff] shadow-none text-[#1E3A8A] font-normal font-[inter] leading-[150%] tracking-[-0.32px]"
// 								>
// 									<PlusIcon />
// 									{__('Add Stage', 'quillcrm')}
// 								</button>

// 								<div className="w-[2px] h-6 bg-[#DEE1E6]" />

// 								<Button
// 									variant="ghost"
// 									onClick={resetToDuplicate}
// 									className="text-[#E13B3B] hover:bg-transparent hover:text-[#E13B3B] p-0 text-[16px] font-normal font-[inter] leading-[150%] tracking-[-0.32px]"
// 								>
// 									{__('Reset to Defaults', 'quillcrm')}
// 								</Button>
// 							</div>
// 					</div>
// 					{/* table */}
// 					<div className="new-pipeline flex flex-col p-5 ">
// 						{customStages && (
// 							<div className="pipeline-board w-full overflow-x-auto  ">
// 								<div
// 									className="grid gap-4  min-h-[400px]"
// 									style={{
// 										gridTemplateColumns: `repeat(${customStages.length}, minmax(120px, 1fr))`,
// 									}}
// 								>
// 									{customStages.map((stage, index) => {
// 										const {backgroundColor} = StageColorBody(
// 											stage.color,
// 											index,
// 											customStages.length
// 										)
										
// 										return (
// 											<div className=" flex flex-col  p-0 m-0 relative">
												
// 												<PipelineStageHeaderBox
// 		key={index}
// 		stage={stage}
// 		index={index}
// 		totalStages={customStages.length}
// 	>
// 		<div className="font-bold  text-base leading-[26px] tracking-[-.5px] font-[inter]" style={{
// 															color: stage.color,
// 														}}>{stage.name ||`Stage ${index + 1}`}</div>
// 	</PipelineStageHeaderBox>

// 												<div
// 													key={index}
// 													className="relative flex flex-col items-center p-4 pt-0 rounded-[8px] rounded-t-none shadow-sm h-full overflow-hidden "
// 													style={{
// 														background:
// 															backgroundColor,
// 													}}
// 												>
// 													<div className="flex flex-col gap-3 w-full items-center mt-6">
// 														{Array.from({
// 															length: 10,
// 														}).map((_, i) => (
// 															<div
// 																key={`cell-${index}-${i}`}
// 																className=" w-full px-4 py-1 bg-[#FFFFFFCC] border border-[#DEE1E6] rounded-[8px] h-9 flex items-center justify-center shadow-sm hover:shadow-md transition"
// 															></div>
// 														))}
// 													</div>
// 												</div>
// 											</div>
// 										);
// 									})}
// 								</div>
// 							</div>
// 						)}
// 					</div>
// 				</div>
// 				{/* botton footer */}
// 				<div className="dialog-footer ">
// 					<Button
// 						onClick={handleCancel}
// 						className="cancel-button shared-button"
// 					>
// 						{__('Cancel', 'quillcrm')}
// 					</Button>
// 					<Button
// 						variant="default"
// 						onClick={form.handleSubmit(handleSubmit)}
// 						className="create-pipeline-button shared-button"
// 					>
// 						{loading ? loading : __('Create Pipeline', 'quillcrm')}
// 					</Button>
// 				</div>
// 			</DialogContent>
// 		</Dialog>
// 	);
// };

export const DuplicatePipelineModal = ({ visible, onClose, onSuccess, pipeline }) => {
	return (
		<PipelineModal
			visible={visible}
			onClose={onClose}
			onSuccess={onSuccess}
			mode="duplicate"
			title={__('Duplicate Pipeline', 'quillcrm')}
			subtitle={''}
			icon={<DuplicatePipelineDialog />}
			pipeline={pipeline}
		/>
	);
};
