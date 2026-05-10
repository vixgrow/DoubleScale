import AlertDeleteIcon from "@doublescale/components/icons/alert-delete";
import TrashIcon from "@doublescale/components/icons/trash";
import { Alert, AlertDescription } from "@doublescale/components/ui/alert";
import { Button } from "@doublescale/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogOverlay } from "@doublescale/components/ui/dialog";
import { __ } from "@wordpress/i18n";
import { useState } from "react";

export const DeleteEmail = ({
    visible,
    onClose,
    email,
    onConfirm,
}) => {
    const [loading, setLoading] = useState(false);

    const handleConfirm = async () => {
        if (!email?.id) return;

        setLoading(true);
        try {
            await onConfirm();
        } catch (error) {
            // Error handled in parent
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
            <DialogOverlay className="z-[1800000]" />
            <DialogContent className="w-full max-w-xl max-h-[80vh] flex flex-col justify-center items-center gap-3 overflow-y-auto my-4 sm:mx-auto z-[1800000] p-8 rounded-[16px]">
                {/* Header */}
                <DialogHeader className="flex flex-col items-center justify-center w-full gap-4 text-center">
                    <div className="flex justify-center items-center w-[88px] h-[88px] bg-[#FCDADA] rounded-[26px]">
                        <TrashIcon width={40} height={40} />
                    </div>

                    <Alert
                        variant="default"
                        className="bg-[#F8F8F8] text-sm border text-[#E13B3B] border-[#DEE1E6] rounded-[8px] w-full py-4 flex gap-3 items-center"
                    >
                        <AlertDescription className="text-sm">
                            <AlertDeleteIcon />
                        </AlertDescription>
                        <AlertDescription className="text-sm">
                            {__('This email will be permanently removed from the sequence.', 'doublescale')}
                        </AlertDescription>
                    </Alert>
                </DialogHeader>

                <div className='flex flex-col justify-center items-center'>
                    <p className='text-lg font-medium leading-[28px] text-[#09090B]'>
                        {__('Are you sure you want to delete this email?', 'doublescale')}
                    </p>
                </div>

                {/* Footer */}
                <div className="flex flex-col sm:flex-row gap-3 mt-6 w-full">
                    <Button
                        variant="outline"
                        onClick={onClose}
                        disabled={loading}
                        className="w-full !p-[10px] h-12 text-[#374151] text-base rounded-[8px] border !border-[#374151]"
                    >
                        {__('Cancel', 'doublescale')}
                    </Button>
                    <Button
                        onClick={handleConfirm}
                        disabled={loading}
                        className="w-full !p-[10px] h-12 text-[#FFF] hover:!bg-[#E13B3B] bg-[#E13B3B] text-base rounded-[8px] border !border-[#E13B3B]"
                    >
                        {loading ? __('Deleting...', 'doublescale') : __('Yes, Delete', 'doublescale')}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
};