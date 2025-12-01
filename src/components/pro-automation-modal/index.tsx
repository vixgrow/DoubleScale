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
import { Dialog, DialogContent } from '@/components/ui/dialog';
import './style.scss';
import config from '../../config';
import { RocketIcon } from '../icons';
//@ts-ignore
import proImage from '../../../assets/images/pro_img.png';

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
	const upgradeUrl = config.getUrlQuillCRMPro();
	return (
		<Dialog open={visible} onOpenChange={(open) => !open && onClose()}>
			<DialogContent className="z-[150300] qcrm-pro-modal max-w-2xl flex flex-col items-center justify-center">
				<img src={proImage} alt="Pro Feature" />
				<div className="qcrm-pro-feature-notice__title text-center">{__('This is a PRO Feature', 'quillcrm')}</div>
				<div className="qcrm-pro-modal__content text-center">
					<p className="text-[#777] text-center">
						{__(
							"We're sorry, this feature is not available on your plan. Please upgrade to the PRO plan to unlock all these awesome features.",
							'quillcrm'
						)}
					</p>

					{/* <div className="qcrm-pro-modal__feature-info mb-6">
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
					</div> */}

					<div className="qcrm-pro-modal__action mt-4 flex gap-4 items-center">
						<Button variant="outline" className='flex-1 border-[#458DC7] text-[#458DC7]'>
						{__('Try a Free demo', 'quillcrm')}
						</Button>
						<Button
							onClick={() => {
								window.open(upgradeUrl, '_blank');
							}}
							className="flex-1 bg-[#1E3A8A] hover:bg-[#1E3A8A]/90 text-white"
						>
							<RocketIcon />
							{__('Upgrade to PRO Now', 'quillcrm')}
						</Button>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
};

export default ProAutomationModal;
