import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';
import { useEffect, useState } from 'react';
import { usePipelineOperations } from '../../hooks/use-pipeline-operations';
import TrashIcon from '@quillcrm/components/icons/trash';
import { Alert, AlertDescription, AlertTitle } from '@quillcrm/components/ui/alert';
import { AlertIcon } from '@quillcrm/components';

export const DeletePipelineDialog = ({ open, onClose, pipeline, pipelines, onConfirm }) => {
  const [action, setAction] = useState<'move' | 'archive' | null>(null);
  const [targetPipeline, setTargetPipeline] = useState<string | null>(null);


  const { deletePipeline } = usePipelineOperations();

//   const handleConfirm = async () => {
// //     if (action === 'move' && targetPipeline) {
// //     //   await moveDealsToPipeline(pipeline.id, targetPipeline);
// //     } else if (action === 'archive') {
// //     //   await archiveDeals(pipeline.id);
// //     }
// //     await deletePipeline(pipeline.id);
// //     onConfirm?.();
// //     onClose();
// //   };
const handleCancel = () => {
  
  onClose();

      
};


  return (
    <Dialog open={open} onOpenChange={(open) => {
      if (!open) handleCancel();
    }}>
      <DialogContent className="w-full min-w-max max-h-[80vh] flex flex-col justify-center items-center gap-5 overflow-y-auto my-4 sm:mx-auto z-[10000] p-8 rounded-[16px] pipline-content ">
      <DialogHeader className="flex flex-col items-center justify-center w-full gap-4 text-center">
  {/* Icon */}
  <div className="flex justify-center items-center w-[88px] h-[88px] bg-[#FCDADA] rounded-[26px]">
    <TrashIcon width={40} height={40} />
  </div>

  {/* Alert */}
  <Alert
    variant="default"
    className="bg-[#F8F8F8] text-base border text-[#E13B3B] border-[#DEE1E6] font-normal rounded-[8px] w-full p-4 gap-[10px] flex justify-center items-center"
  >
    <div>
      <AlertIcon color="#E13B3B" />
    </div>
    <div className="flex items-center gap-1">
      <AlertTitle className="font-medium mt-0.5">Note:</AlertTitle>
      <AlertDescription className="text-base">
        Before deleting this pipeline, please specify the following:
      </AlertDescription>
    </div>
  </Alert>
</DialogHeader>

        {pipeline?.dealsCount > 0 ? (
          <div className="space-y-4">
            <p>This pipeline has {pipeline?.dealsCount} deals. What do you want to do with them?</p>

            <div className="flex flex-col gap-3">
              <Button variant={action === 'move' ? 'default' : 'outline'} onClick={() => setAction('move')}>
                Move Deals
              </Button>
              {action === 'move' && (
                <Select onValueChange={setTargetPipeline}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select target pipeline" />
                  </SelectTrigger>
                  <SelectContent>
                    {pipelines
                      .filter(p => p.id !== pipeline.id)
                      .map(p => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              )}

              <Button variant={action === 'archive' ? 'default' : 'outline'} onClick={() => setAction('archive')}>
                Archive Deals
              </Button>
            </div>
          </div>
        ) : (
          <p>Are you sure you want to delete this empty pipeline?</p>
        )}

        <div className="flex justify-end gap-3 mt-6">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          {/* <Button disabled={action === 'move' && !targetPipeline} onClick={handleConfirm}>
            {pipeline.dealsCount > 0 ? 'Confirm' : 'Delete'}
          </Button> */}
        </div>
      </DialogContent>
    </Dialog>
  );
};
