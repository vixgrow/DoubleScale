
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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import AlertDeleteIcon from '@quillcrm/components/icons/alert-delete';
import { useDealOperations } from '../../hooks/use-deal-operations';

export const DeleteDeal = ({
  visible,
	onClose,
	pipeline,
	pipelines,
    deal,
	onConfirm,
}) => {
	const [loading, setLoading] = useState(false);
	const { deleteDeal } = useDealOperations()
  const dispatch = useDispatch('quillcrm/core');
	const createNotice = dispatch?.createNotice;

	const handleConfirm = async () => {
        if (!deal?.id) return;
      
        setLoading(true);
        try {
          await deleteDeal(deal.id);
          createNotice?.({
            type: 'success',
            message: __(
              `Deal "${deal.title}" deleted successfully!`,
              'quillcrm'
            ),
          });
          onConfirm?.();
          onClose();
        } catch (error) {
          createNotice?.({
            type: 'error',
            message: __(`Failed to delete deal`, 'quillcrm'),
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
            {__('Any notes, mails and calls linked to this deal will also be deleted.', 'quillcrm')}
						</AlertDescription>
					</Alert>

				</DialogHeader>
                <div className='flex flex-col justify-center items-center'>
  <p className='text-lg font-medium leading-[28px] text-[#09090B]'>
    {__('Are you sure you want to delete this deal?', 'quillcrm')}
  </p>
  
</div>

				

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
