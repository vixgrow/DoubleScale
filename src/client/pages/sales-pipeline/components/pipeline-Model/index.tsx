/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useState, useEffect } from '@wordpress/element';
import { useDispatch } from '@wordpress/data';
import ConfigAPI from '@quillcrm/config';

/**
 * External dependencies
 */
import { z } from 'zod';
import { useForm } from 'react-hook-form';

/**
 * Internal dependencies
 */
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from '@quillcrm/components/ui/dialog';
import { CustomDialogHeader, AlertIcon } from '@quillcrm/components';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { usePipelineOperations } from '../../hooks/use-pipeline-operations';
import { PipelineStageEditor } from './PipelineStageEditor';
import { PipelinePreviewBoard } from './PipelinePreviewBoard';
import './style.scss';

const formSchema = z.object({
	name: z
		.string()
		.min(2, {
			message: 'Pipeline name must be at least 2 characters.',
		})
		.max(255, {
			message: 'Pipeline name must not exceed 255 characters.',
		}),
});

export interface PipelineModalProps {
	visible: boolean;
	onClose: () => void;
	// onSuccess: () => void;
	onSuccess: (pipeline?: any) => void;
	pipeline?: any | null;
	mode: 'create' | 'duplicate' | 'edit';
	title?: string;
	subtitle?: string;
	icon?: React.ReactNode;
}

export const PipelineModal: React.FC<PipelineModalProps> = ({
	visible,
	onClose,
	onSuccess,
	pipeline,
	mode,
	title,
	subtitle,
	icon,
}) => {
	const [loading, setLoading] = useState(false);
	const [customStages, setCustomStages] = useState(pipeline?.stages || []);
	const [originalPipeline, setOriginalPipeline] = useState<any | null>(null);

	const { createPipeline, updatePipeline, duplicatePipeline } =
		usePipelineOperations();
	const dispatch = useDispatch('quillcrm/core');
	const createNotice = dispatch?.createNotice;

	const DEFAULT_STAGES = ConfigAPI.getDefaultStages();

	const form = useForm({
		defaultValues: { name: '' },
	});

	useEffect(() => {
		if (visible) {
			if (mode === 'duplicate' && pipeline) {
				form.setValue('name', `Copy of ${pipeline.name}`);
				setCustomStages(pipeline?.stages || []);
				setOriginalPipeline({
					name: `Copy of ${pipeline.name}`,
					stages: pipeline?.stages || [],
				});
			} else if (mode === 'create') {
				form.setValue('name', '');
				setCustomStages([...DEFAULT_STAGES]);
			} else if (mode === 'edit' && pipeline) {
				console.log(' EFFECT TRIGGERED (edit)', { mode, pipeline });
				form.setValue('name', pipeline.name);
				// form.setValue('description', pipeline?.description || '');
				setCustomStages(pipeline?.stages || []);
				setOriginalPipeline({
					name: pipeline.name,
					description: pipeline?.description || '',
					stages: pipeline?.stages || [],
				});
			}
		}
	}, [pipeline, visible, form, mode]);

	const handleSubmit = async (values: { name: string }) => {
		const result = formSchema.safeParse(values);

		if (!result.success) {
			const errors = result.error.flatten().fieldErrors;

			if (errors.name) {
				form.setError('name', {
					type: 'manual',
					message: errors.name[0],
				});
			}
			return;
		}

		setLoading(true);
		try {
			let newPipeline;
			let updatedPipeline;

			if (mode === 'duplicate' && pipeline) {
				updatedPipeline = await duplicatePipeline(
					pipeline.id,
					values.name.trim()
				);
				createNotice?.({
					type: 'success',
					message: __(
						`Pipeline "${values.name}" duplicated successfully!`,
						'quillcrm'
					),
				});
			} else if (mode === 'create') {
				// await createPipeline({
				//     name: values.name,
				//     description: '',
				//     stages: customStages || [],
				// })
				newPipeline = await createPipeline({
					name: values.name,
					description: '',
					stages: customStages || [],
				});
				createNotice?.({
					type: 'success',
					message: __(
						`Pipeline "${values.name}" created successfully!`,
						'quillcrm'
					),
				});
				updatedPipeline = await createPipeline({
					name: values.name,
					description: '',
					stages: customStages || [],
				});
				createNotice?.({
					type: 'success',
					message: __(
						`Pipeline "${values.name}" created successfully!`,
						'quillcrm'
					),
				});
			} else if (mode === 'edit' && pipeline) {
				updatedPipeline = await updatePipeline(pipeline.id, {
					name: values.name.trim(),
					description: pipeline?.description || '',
					sort_order: pipeline?.sort_order || 0,
					stages: customStages || [],
				});

				createNotice?.({
					type: 'success',
					message: __(
						`Pipeline "${values.name}" updated successfully!`,
						'quillcrm'
					),
				});
			}

			// onSuccess();
			onSuccess(newPipeline);

			onClose();
			// Pass the updated pipeline to the parent for proper refresh
			await onSuccess(updatedPipeline);
			form.reset();
		} catch (error) {
			createNotice?.({
				type: 'error',
				message:
					error instanceof Error
						? error.message
						: __('Failed to process pipeline', 'quillcrm'),
			});
		} finally {
			setLoading(false);
		}
	};

	const resetToDuplicate = () => {
		if (!originalPipeline) return;
		form.setValue('name', originalPipeline.name);
		setCustomStages(originalPipeline.stages);
	};

	const handleCancel = () => {
		form.reset();
		onClose();
	};

	const addStage = () => {
		setCustomStages((prev) => [
			...prev,
			{
				name: `Stage ${prev.length + 1}`,
				color: '#1E3A8A',
				win_probability: 0,
			},
		]);
	};

	return (
		<Dialog
			open={visible}
			onOpenChange={(open) => {
				if (!open) handleCancel();
			}}
		>
			<DialogContent className="w-full max-w-7xl max-h-[80vh] overflow-y-auto my-4 sm:mx-auto z-[100000] p-6 rounded-[16px] pipline-content">
				<DialogHeader>
					<DialogTitle>
						<CustomDialogHeader
							title={title || ''}
							subtitle={subtitle || ''}
							icon={icon || ''}
						/>
					</DialogTitle>
				</DialogHeader>

				{mode === 'duplicate' && (
					<Alert
						variant="default"
						className="bg-[#F8F8F8] !text-xl border text-[#E13B3B] border-[#DEE1E6] font-medium rounded-[8px] w-[50%] p-4 gap-[10px] flex justify-center items-center mx-auto"
					>
						<div>
							<AlertIcon color="#E13B3B" />
						</div>
						<div className=" flex items-center gap-1">
							<AlertTitle className=" font-medium mt-0.5">
								Note:
							</AlertTitle>
							<AlertDescription className=" text-xl">
								Deals will not be copied to the new pipeline.
							</AlertDescription>
						</div>
					</Alert>
				)}

				<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
					<div className="new-pipeline flex p-5 flex-col w-full">
						<Form {...form}>
							<form onSubmit={form.handleSubmit(handleSubmit)}>
								<FormField
									control={form.control}
									name="name"
									render={({ field }) => (
										<FormItem className="mb-6">
											<FormLabel className="text-[#09090B] text-base font-medium">
												{__(
													'Pipeline Name',
													'quillcrm'
												)}{' '}
												<span className="text-[#E13B3B]">
													*
												</span>
											</FormLabel>
											<FormControl>
												<Input
													{...field}
													placeholder={__(
														'Enter pipeline name',
														'quillcrm'
													)}
													className="mt-2 h-11 border border-[#DEE1E6] rounded-md"
												/>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
							</form>

							<PipelineStageEditor
								stages={customStages}
								setStages={setCustomStages}
								onReset={() =>
									setCustomStages([...DEFAULT_STAGES])
								}
								onAddStage={addStage}
							/>
						</Form>
					</div>

					<div className="new-pipeline flex flex-col p-5 ">
						<PipelinePreviewBoard stages={customStages} />
					</div>
				</div>

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
						{loading
							? __('Loading...', 'quillcrm')
							: mode === 'duplicate'
								? __('Duplicate Pipeline', 'quillcrm')
								: mode === 'edit'
									? __('Save Changes', 'quillcrm')
									: __('Create Pipeline', 'quillcrm')}
					</Button>
				</div>
			</DialogContent>
		</Dialog>
	);
};
