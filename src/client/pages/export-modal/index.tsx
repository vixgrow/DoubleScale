/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { ProFeatureNotice } from '@quillcrm/components';

export interface Props {
	open: boolean;
	onClose: () => void;
}

const ExportModal: React.FC<Props> = ({ open, onClose }) => {
	return (
		<Dialog
			open={open}
			onOpenChange={(value) => {
				if (!value) {
					onClose();
				}
			}}
		>
			<DialogContent className="z-[150000] max-w-3xl p-0">
				<ProFeatureNotice
					featureName={__('Contact Export', 'quillcrm')}
					description={__(
						'Export your contacts to CSV with advanced filtering, custom field selection, and automated scheduling. Upgrade to QuillCRM Pro to unlock this powerful feature.',
						'quillcrm'
					)}
				/>
			</DialogContent>
		</Dialog>
	);
};

export default ExportModal;
