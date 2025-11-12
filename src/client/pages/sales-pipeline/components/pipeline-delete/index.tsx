
import {
	Dialog,
	DialogContent,
	DialogHeader,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
	Select,
	SelectTrigger,
	SelectContent,
	SelectItem,
	SelectValue,
} from '@/components/ui/select';
import { useState } from 'react';
import TrashIcon from '@quillcrm/components/icons/trash';
import {
	Alert,
	AlertDescription,
} from '@quillcrm/components/ui/alert';
import { useDispatch } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { usePipelineOperations } from '../../hooks/use-pipeline-operations';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import AlertDeleteIcon from '@quillcrm/components/icons/alert-delete';

export const DeletePipelineDialog = ({
  visible,
	onClose,
	pipeline,
	pipelines,
	onConfirm,
}) => {
	const [loading, setLoading] = useState(false);
	const [action, setAction] = useState<'move' | 'archive' | 'delete'>('move');
	const [targetPipeline, setTargetPipeline] = useState<string | undefined>();
	const { deletePipeline } = usePipelineOperations();
  const dispatch = useDispatch('quillcrm/core');
	const createNotice = dispatch?.createNotice;

	const handleConfirm = async () => {
		if (!pipeline?.id) return;

		setLoading(true);
		try {
			if (action === 'delete') {
				await deletePipeline(pipeline.id);
				createNotice?.({
					type: 'success',
					message: __(
						`Pipeline "${pipeline.name}" deleted successfully!`,
						'quillcrm'
					),
				});
				onClose();
				// Call onConfirm after closing to trigger refresh and update pipeline selection
				if (onConfirm) {
					await onConfirm();
				}
			} else {

				createNotice?.({
					type: 'info',
					message: __(
						`"${action}" option selected — no real action executed.`,
						'quillcrm'
					),
				});
				onClose();
			}
		} catch (error) {
			createNotice?.({
				type: 'error',
				message: __(`Failed to delete pipeline`, 'quillcrm'),
			});
		} finally {
			setLoading(false);
		}
	};
  

	return (
		<Dialog
			open={visible}
			onOpenChange={(open) => {
				if (!open) onClose();
			}}
		>
			<DialogContent className="w-full max-w-xl max-h-[80vh] flex flex-col justify-center items-center gap-3 overflow-y-auto my-4 sm:mx-auto z-[10000] p-8 rounded-[16px] ">
				{/* Header */}
				<DialogHeader className="flex flex-col items-center justify-center w-full gap-4 text-center">
					<div className="flex justify-center items-center w-[88px] h-[88px] bg-[#FCDADA] rounded-[26px]">
						<TrashIcon width={40} height={40} />
					</div>

					<Alert
						variant="default"
						className="bg-[#F8F8F8] text-sm border text-[#E13B3B] border-[#DEE1E6] l rounded-[8px] w-full py-4 flex gap-3  items-center"
					>
            <AlertDescription className="text-sm">
              <AlertDeleteIcon/>
						</AlertDescription>
						<AlertDescription className="text-sm">
            {__('Before deleting this pipeline, please choose one of the following options:', 'quillcrm')}
						</AlertDescription>
					</Alert>
				</DialogHeader>

				{/* Options */}
				<RadioGroup
					value={action}
					onValueChange={(val) => setAction(val as 'move' | 'archive' | 'delete')}
					className="flex flex-col gap-6 w-full"
				>
          <div className=' flex justify-center items-center'>
            <p className=' text-[#09090B] font-semibold text-lg'> {__(`What would you like to do with the ${pipeline?.stats?.deal_count} deals in this pipeline?`, 'quillcrm')}</p>
          </div>
					{/* Move Option (static) */}
					<div className="flex flex-col gap-2">
						<div className="flex items-center space-x-3">
							<RadioGroupItem value="move" id="move" />
							<label htmlFor="move" className="font-medium text-[#09090B]">
                {__(`Move deals to another pipeline`, 'quillcrm')}
							</label>
						</div>

						{/* Select always visible (static) */}
						<div className="">
							<Select value={targetPipeline} onValueChange={setTargetPipeline}>
								<SelectTrigger className="w-full !shadow-none py-[5px] px-4 h-10 gap-20 !text-[#09090B] text-sm border !border-[#DEE1E6] rounded-[8px]">
									<SelectValue placeholder="Select pipeline" />
								</SelectTrigger >
								<SelectContent>
									{pipelines
										.filter((p) => p.id !== pipeline?.id)
										.map((p) => (
											<SelectItem key={p.id} value={String(p.id)}>
												{p.name}

											</SelectItem>
										))}
								</SelectContent>
							</Select>
						</div>
					</div>

					{/* Archive Option (static) */}
					<div className="flex items-center space-x-3">
						<RadioGroupItem value="archive" id="archive" />
						<label htmlFor="archive" className="font-medium text-[#09090B]">
              {__(`Archive The Whole Pipeline`, 'quillcrm')}
						</label>
					</div>

					{/* Delete Option */}
					<div className="flex items-center space-x-3">
						<RadioGroupItem value="delete" id="delete" />
						<label htmlFor="delete" className="font-medium text-[#09090B]">
              {__(`Delete pipeline permanently`, 'quillcrm')}
						</label>
					</div>
				</RadioGroup>

				{/* Footer */}
				<div className="flex flex-col sm:flex-row gap-3 mt-6 w-full">
  <Button 
    variant="outline" 
    onClick={onClose} 
    className="w-full !p-[10px] h-12 text-[#374151] text-base rounded-[8px] border !border-[#374151]"
  >
    {__('Cancel', 'quillcrm')}
  </Button>
  <Button 
    onClick={handleConfirm} 
    disabled={loading} 
    className="w-full !p-[10px] h-12 text-[#FFF] hover:!bg-[#E13B3B] bg-[#E13B3B] text-base rounded-[8px] border !border-[#E13B3B]"
  >
    {__(`Yes,Delete`, 'quillcrm')}
  </Button>
</div>
			</DialogContent>
		</Dialog>
	);
};
