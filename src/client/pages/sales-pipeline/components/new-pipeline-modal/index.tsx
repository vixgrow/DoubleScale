/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useState } from '@wordpress/element';
import { useDispatch } from '@wordpress/data';

/**
 * External dependencies
 */
import { ColorPicker } from 'antd';
import { Plus } from 'lucide-react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { z } from 'zod';
import tinycolor from 'tinycolor2';

/**
 * Internal dependencies
 */
import { usePipelineOperations } from '../../hooks/use-pipeline-operations';
import { Input } from '@/components/ui/input';
import ConfigAPI from '@quillcrm/config';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import './style.scss';
import {
	Dialog,
	DialogContent,
	DialogHeader,
} from '@quillcrm/components/ui/dialog';
import { CustomDialogHeader, DragDropIcon } from '@quillcrm/components';
import CreatePipelineIcon from '@quillcrm/components/icons/create-pipeline';
import { DialogTitle } from '@radix-ui/react-dialog';
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import TrashIcon from '@quillcrm/components/icons/trash';
import { ColorPickerControl } from '@/builder/blocks/basic/shared';

interface Stage {
	name: string;
	color: string;
	win_probability: number;
}

interface NewPipelineModalProps {
	visible: boolean;
	onClose: () => void;
	onSuccess: () => void;
}

// Get default stages from config
const DEFAULT_STAGES: Stage[] = ConfigAPI.getDefaultStages();

// validation
const formSchema = z.object({
	name: z
		.string()
		.min(2, {
			message: 'Username must be at least 2 characters.',
		})
		.max(255, {
			message: "'Pipeline name must not exceed 255 characters",
		}),
});
type FormValues = z.infer<typeof formSchema>;

export const NewPipelineModal: React.FC<NewPipelineModalProps> = ({
	visible,
	onClose,
	onSuccess,
}) => {
	const [loading, setLoading] = useState(false);
	const [useCustomStages, setUseCustomStages] = useState(true);
	const [customStages, setCustomStages] = useState<Stage[]>([
		...DEFAULT_STAGES,
	]);
	const { createPipeline } = usePipelineOperations();
	const dispatch = useDispatch('quillcrm/core');
	const createNotice = dispatch?.createNotice;

	const handleSubmit = async (values: any) => {
		setLoading(true);
		try {
			const pipelineData = {
				name: values.name,
				description: values.description || '',
				stages: useCustomStages ? customStages : [], // Empty array will use backend defaults
			};

			await createPipeline(pipelineData);

			if (createNotice) {
				createNotice({
					type: 'success',
					message: __(
						`Pipeline "${values.name}" created successfully!`,
						'quillcrm'
					),
				});
			}

			setUseCustomStages(false);
			setCustomStages([...DEFAULT_STAGES]);
			onSuccess();
			onClose();
		} catch (error) {
			if (createNotice) {
				createNotice({
					type: 'error',
					message:
						error instanceof Error
							? error.message
							: __('Failed to create pipeline', 'quillcrm'),
				});
			}
		} finally {
			setLoading(false);
		}
	};
	const form = useForm<FormValues>({
		resolver: zodResolver(formSchema),
		defaultValues: { name: '' },
	});

	const handleCancel = () => {
		// form.resetFields();
		setUseCustomStages(false);
		setCustomStages([...DEFAULT_STAGES]);
		onClose();
	};

	const addStage = () => {
		const newStage: Stage = {
			name: '',
			color: '#6d78d8',
			win_probability: 0,
		};
		setCustomStages([...customStages, newStage]);
	};

	const removeStage = (index: number) => {
		if (customStages.length > 1) {
			const newStages = customStages.filter((_, i) => i !== index);
			setCustomStages(newStages);
		}
	};

	const updateStage = (index: number, field: keyof Stage, value: any) => {
		const newStages = [...customStages];
		newStages[index] = {
			...newStages[index],
			[field]: value,
		};
		setCustomStages(newStages);
	};

	const resetToDefaults = () => {
		setCustomStages([...DEFAULT_STAGES]);
	};
	const handleDragEnd = (result) => {
		if (!result.destination) return;
		if (result.source.index === 0 || result.destination.index === 0) return;
		const reordered = Array.from(customStages);
		const [removed] = reordered.splice(result.source.index, 1);
		reordered.splice(result.destination.index, 0, removed);
		setCustomStages(reordered);
	};

	return (
		<Dialog
			open={visible}
			onOpenChange={(open) => {
				if (!open) {
					handleCancel();
				}
			}}
		>
			<DialogContent className="w-full max-w-7xl max-h-[80vh] overflow-y-auto my-4 sm:mx-auto z-[10000] p-6 rounded-[16px] pipline-content">
				<DialogHeader>
					<DialogTitle>
						<CustomDialogHeader
							title={__('Create New Pipeline', 'quillcrm')}
							subtitle={__(
								'Add basic information below to create new pipeline',
								'quillcrm'
							)}
							icon={<CreatePipelineIcon />}
						/>
					</DialogTitle>
				</DialogHeader>

				<div className=" grid grid-cols-1 md:grid-cols-2 gap-6 ">
					<div className="new-pipeline flex p-5 flex-col w-full ">
						<Form {...form}>
							{/* Basic Information */}
							<form onSubmit={form.handleSubmit(handleSubmit)}>
								<FormField
									control={form.control}
									name="name"
									render={({ field }) => (
										<FormItem className="mb-6">
											<FormLabel className=" text-[#09090B] text-base font-normal landing-[150%] ">
												{__(
													'Pipeline Name',
													'quillcrm'
												)}{' '}
												<span className=" text-[#E13B3B]">
													*
												</span>
											</FormLabel>
											<FormControl>
												<Input
													placeholder={__(
														'e.g., Sales Pipeline, Lead Nurturing',
														'quillcrm'
													)}
													{...field}
													className="py-[5px] h-12 px-4 flex items-center rounded-[8px] gap-20 border border-[#DEE1E6] bg-[#FFF]"
												/>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								></FormField>
							</form>
							{/* Stage Configuration */}
							<DragDropContext onDragEnd={handleDragEnd}>
								<Droppable droppableId="stages-droppable">
									{(provided) => (
										<div
											className="stages-list w-full mt-4 "
											ref={provided.innerRef}
											{...provided.droppableProps}
										>
											{customStages.map(
												(stage, index) => (
													<Draggable
														key={index.toString()}
														draggableId={index.toString()}
														index={index}
														isDragDisabled={
															index === 0
														}
													>
														{(
															provided,
															snapshot
														) => (
															<div
																ref={
																	provided.innerRef
																}
																{...provided.draggableProps}
																{...(index !== 0
																	? provided.dragHandleProps
																	: {})}
																className={`grid md:grid-cols-[28px_minmax(200px,1fr)_minmax(120px,1fr)_minmax(120px,1fr)_28px] gap-2 pr-2 items-center mb-4 w-full rounded-[6px] ${snapshot.isDragging ? 'bg-[#f5f5ff] shadow-md' : 'bg-white'}`}
															>
																{/* Drag icon */}
																<div>
																	{index !==
																		0 && (
																		<div
																			className="mr-2 p-0 cursor-grab hover:bg-transparent "
																			{...provided.dragHandleProps}
																		>
																			<DragDropIcon />
																		</div>
																	)}
																</div>

																{/* Stage name */}
																<div className="flex flex-col">
																	{index ===
																		0 && (
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
																			value={
																				stage.name
																			}
																			onChange={(
																				e
																			) =>
																				updateStage(
																					index,
																					'name',
																					e
																						.target
																						.value
																				)
																			}
																			maxLength={
																				255
																			}
																			placeholder="Enter stage name"
																			className="input-stage"
																		/>
																		{index ===
																			0 && (
																			<span className="absolute right-4 p-1 gap-2 rounded-[8px] bg-[#F0F0F0] border border-[#DEE1E6] top-1/2 -translate-y-1/2 text-[#777] text-[14px] font-normal">
																				Default
																			</span>
																		)}
																	</div>
																</div>

																{/* Color Picker */}
																<div className="flex flex-col">
																	{index ===
																		0 && (
																		<label className="block mb-2 text-[16px] leading-6 font-normal text-[#09090B]">
																			{__(
																				'Color',
																				'quillcrm'
																			)}
																		</label>
																	)}
																	<div className="flex items-center justify-center">
																		<ColorPicker
																			value={
																				stage.color
																			}
																			onChange={(
																				color
																			) =>
																				updateStage(
																					index,
																					'color',
																					color.toHexString()
																				)
																			}
																			size="small"
																			showText
																			format="hex"
																			className="w-full input-stage"
																		/>
																	</div>
																</div>

																{/* Probability */}
																<div className="flex flex-col w-full">
																	{index ===
																		0 && (
																		<label className="block mb-2 text-[16px] leading-6 font-normal text-[#09090B]">
																			Probability
																			(%)
																		</label>
																	)}
																	<div className="relative w-full">
																		<input
																			type="number"
																			value={
																				stage.win_probability
																			}
																			onChange={(
																				e
																			) =>
																				updateStage(
																					index,
																					'win_probability',
																					Number(
																						e
																							.target
																							.value
																					) ||
																						0
																				)
																			}
																			min={
																				0
																			}
																			max={
																				100
																			}
																			placeholder="0–100"
																			className="w-full input-stage"
																		/>
																		<span className="absolute top-0 right-0 w-12 h-full flex items-center justify-center border border-[#DEE1E6] bg-[#F0F0F0] text-[#777] text-sm font-normal p-1 rounded-tr-lg rounded-br-lg pointer-events-none">
																			(%)
																		</span>
																	</div>
																</div>

																{/* Delete */}
																<div className="flex items-center justify-center w-full ">
																	{index !==
																		0 && (
																		<button
																			className="ml-4 w-6 hover:bg-transparent "
																			onClick={() =>
																				removeStage(
																					index
																				)
																			}
																		>
																			<TrashIcon />
																		</button>
																	)}
																</div>
															</div>
														)}
													</Draggable>
												)
											)}
											{provided.placeholder}
										</div>
									)}
								</Droppable>
							</DragDropContext>
						</Form>
						<div className="flex  items-center gap-4 pb-5">
							<button
								onClick={addStage}
								className="border-none flex add-stage-button p-0 text-[16px] bg-[#fff] shadow-none text-[#1E3A8A] font-normal font-[inter] landing-[150%] tracking-[-0.32px] "
							>
								<Plus size={24} className="mr-2" />{' '}
								{__('Add Stage', 'quillcrm')}
							</button>

							<div className="w-[2px] h-6  bg-[#DEE1E6]"></div>
							<Button
								variant="ghost"
								onClick={resetToDefaults}
								className=" text-[#E13B3B] hover:bg-transparent hover:text-[#E13B3B] p-0 text-[16px] font-normal font-[inter] landing-[150%] tracking-[-0.32px]"
							>
								{__('Reset to Defaults', 'quillcrm')}
							</Button>
						</div>
					</div>

					{/* pipline table */}
					<div className="new-pipeline flex flex-col p-5 ">
						{useCustomStages && (
							<div className="pipeline-board w-full overflow-x-auto  ">
								<div
									className="grid gap-4  min-h-[400px]"
									style={{
										gridTemplateColumns: `repeat(${customStages.length}, minmax(120px, 1fr))`,
									}}
								>
									{customStages.map((stage, index) => {
										const baseColor = tinycolor(
											stage.color
										);

										// const isDark = baseColor.isDark();
										const backgroundColor = baseColor
											.lighten(30)
											.toString();
										const isFirst = index === 0;
										const isLast =
											index === customStages.length - 1;

										//   ? baseColor.lighten(20).toString()
										//   : baseColor.darken(5).toString();
										return (
											<div className=" flex flex-col  p-0 m-0 relative">
												<div
													className=" h-14 flex items-center justify-center relative  rounded-t-[8px]"
													style={{
														background:
															backgroundColor,
													}}
												>
													<div
														className="font-bold absolute text-base leading-[26px] tracking-[-.5px] font-[inter]"
														style={{
															color: stage.color,
														}}
													>
														{stage.name ||
															`Stage ${index + 1}`}
													</div>
													{isFirst && (
														<div
															className="absolute top-[1px] right-[-11px] w-0 h-0"
															style={{
																borderTop:
																	'28px solid transparent',
																borderBottom:
																	'28px solid transparent',
																borderLeft: `14px solid ${backgroundColor}`,
															}}
														></div>
													)}

													{isLast && (
														<div
															className="absolute top-0 left-[-3px] w-0 h-0"
															style={{
																borderTop:
																	'28px solid transparent',
																borderBottom:
																	'28px solid transparent',
																borderLeft: `14px solid white`,
															}}
														></div>
													)}
													{!isFirst && !isLast && (
														<>
															<div
																className="absolute top-0 left-[-3px] w-0 h-0"
																style={{
																	borderTop:
																		'28px solid transparent',
																	borderBottom:
																		'28px solid transparent',
																	borderLeft: `14px solid white`,
																}}
															></div>
															<div
																className="absolute top-[1px] right-[-11px] w-0 h-0"
																style={{
																	borderTop:
																		'28px solid transparent',
																	borderBottom:
																		'28px solid transparent',
																	borderLeft: `14px solid ${backgroundColor}`,
																}}
															></div>
														</>
													)}
												</div>

												<div
													key={index}
													className="relative flex flex-col items-center p-4 rounded-[8px] rounded-t-none shadow-sm h-full overflow-hidden "
													style={{
														background:
															backgroundColor,
													}}
												>
													{/* <div
														className={`relative mt-4 w-full p-0 z-[100] font-bold leading-[26px] tracking-[-.5px] font-[inter] text-base flex justify-start`}
														style={{
															color: `${stage.color}`,
														}}
													>
														{stage.name ||
															`Stage ${index + 1}`}
													</div> */}

													<div className="flex flex-col gap-3 w-full items-center mt-6">
														{Array.from({
															length: 10,
														}).map((_, i) => (
															<div
																key={`cell-${index}-${i}`}
																className=" w-full px-4 py-1 bg-[#FFFFFFCC] border border-[#DEE1E6] rounded-[8px] h-9 flex items-center justify-center shadow-sm hover:shadow-md transition"
															></div>
														))}
													</div>
												</div>
											</div>
										);
									})}
								</div>
							</div>
						)}
					</div>
				</div>

				{/* botton footer */}
				<div className="dialog-footer ">
					<Button
						onClick={handleCancel}
						className="cancel-button shared-button"
					>
						{__('Cancel', 'quillcrm')}
					</Button>
					<Button
						variant="default"
						onClick={form.handleSubmit(handleSubmit)}
						className="create-pipeline-button shared-button"
					>
						{loading ? loading : __('Create Pipeline', 'quillcrm')}
					</Button>
				</div>
			</DialogContent>
		</Dialog>
	);
};
