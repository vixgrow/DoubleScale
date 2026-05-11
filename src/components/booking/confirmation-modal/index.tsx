/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { TrashIcon } from '../icons';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface ConfirmationModalProps {
	title: string;
	description: string;
	showModal: boolean;
	setShowModal: (showModal: boolean) => void;
	onSave: () => void;
	isSaveBtnDisabled: boolean;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
	title,
	description,
	showModal,
	setShowModal,
	onSave,
	isSaveBtnDisabled = false,
}) => {
	return (
        <Dialog open={showModal} onOpenChange={setShowModal}><DialogContent><DialogHeader><DialogTitle>{<div className="gap-2">
                            <div className="flex flex-col justify-center items-center mb-4">
                                <div className="text-[#EF4444] bg-[#EF44441F] p-2 rounded-lg">
                                    <TrashIcon width={56} height={56} />
                                </div>
                            </div>
                            <p className="text-center text-color-primary-text text-xl font-bold">
                                {title}
                            </p>
                            <p className="text-center text-[#71717A] font-normal">
                                {description}
                            </p>
                        </div>}</DialogTitle></DialogHeader>
                {isSaveBtnDisabled ? (
                    <div className="flex justify-center mt-4">
                        <Button
                            className="border border-[#71717A] text-white w-1/2"
                            onClick={() => {
                                setShowModal(false);
                            }}
                            size='lg'
                        >
                            {__('Back', 'doublescale')}
                        </Button>
                    </div>
                ) : (
                    <div className="flex justify-between gap-2 mt-4">
                        <Button
                            className="border border-[#71717A] text-white w-1/2"
                            onClick={() => {
                                setShowModal(false);
                            }}
                            size='lg'
                        >
                            {__('Back', 'doublescale')}
                        </Button>
                        <Button
                            className="text-white bg-[#EF4444] w-1/2"
                            onClick={() => {
                                onSave();
                                setShowModal(false);
                            }}
                            size='lg'
                        >
                            {__('Yes, Delete', 'doublescale')}
                        </Button>
                    </div>
                )}
            </DialogContent></Dialog>
    );
};

export default ConfirmationModal;
