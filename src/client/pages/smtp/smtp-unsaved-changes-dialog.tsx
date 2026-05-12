/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import WarnningIcon from '../../../components/icons/warnning';

type SmtpUnsavedChangesDialogProps = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onConfirm: () => void;
	title?: string;
	description?: string;
	confirmText?: string;
	cancelText?: string;
};

const SmtpUnsavedChangesDialog: React.FC<SmtpUnsavedChangesDialogProps> = ({
	open,
	onOpenChange,
	onConfirm,
	title,
	description,
	confirmText,
	cancelText,
}) => {
	return (
		<AlertDialog open={open} onOpenChange={onOpenChange}>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle className='flex flex-col items-center gap-2 text-center text-[#CB5301]'>
						<WarnningIcon />
						{title || __('Oops!', 'doublescale')}</AlertDialogTitle>
					<AlertDialogDescription className='text-center text-muted-foreground leading-7'>
						{description || __('You’re about to discard your changes. Do you want to continue?', 'doublescale')}
					</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter className='mt-4 flex gap-6'>
					<AlertDialogCancel className='!text-brandPrimary !border-brandPrimary !bg-background !shadow-none'>{cancelText || __('Cancel', 'doublescale')}</AlertDialogCancel>
					<AlertDialogAction onClick={onConfirm} className='bg-brandPrimary text-white hover:bg-brandPrimary/90'>
						{confirmText || __('Confirm', 'doublescale')}
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
};

export default SmtpUnsavedChangesDialog;
