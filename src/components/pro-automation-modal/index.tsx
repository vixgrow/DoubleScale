/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * External dependencies
 */
import { Lock } from 'lucide-react';

/**
 * Internal dependencies
 */
import { Button } from '@/components/ui/button';
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog';
import './style.scss';

interface ProAutomationModalProps {
	visible: boolean;
	onClose: () => void;
	featureName: string;
}

export const ProAutomationModal: React.FC<ProAutomationModalProps> = ({
	visible,
	onClose,
	featureName,
}) => {
	return (
		<Dialog open={visible} onOpenChange={(open) => !open && onClose()}>
			<DialogContent className="z-[150300] qcrm-pro-modal sm:max-w-[500px]">
				<DialogHeader>
					<DialogTitle className="flex items-center justify-between">
						<div className="flex items-center gap-2">
							<Lock className="h-5 w-5" />
							{__('This is a PRO Feature', 'quillcrm')}
						</div>
					</DialogTitle>
				</DialogHeader>

				<div className="qcrm-pro-modal__content">
					<p className="text-gray-600 mb-6">
						{__(
							"We're sorry, this feature is not available on your plan. Please upgrade to the PRO plan to unlock all these awesome features.",
							'quillcrm'
						)}
					</p>

					<div className="qcrm-pro-modal__feature-info mb-6">
						<div className="flex items-start gap-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
							<Lock className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
							<div>
								<div className="font-semibold text-blue-900 mb-1">
									{featureName}
								</div>
								<div className="text-sm text-blue-700">
									{__('Available in PRO version', 'quillcrm')}
								</div>
							</div>
						</div>
					</div>

					<div className="qcrm-pro-modal__actions flex gap-3">
						<Button
							variant="outline"
							onClick={onClose}
							className="flex-1"
						>
							{__('Cancel', 'quillcrm')}
						</Button>
						<Button
							onClick={() => {
								window.open(
									'https://www.quillcrm.com/pro',
									'_blank'
								);
							}}
							className="flex-1 bg-green-600 hover:bg-green-700"
						>
							{__('Upgrade to PRO Now', 'quillcrm')}
						</Button>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
};

export default ProAutomationModal;
