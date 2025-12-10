/**
 * wordpress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Button } from '../../components/ui/button';
import { PremiumIcon } from '../../components';
import config from '../../config';

/**
 * Component to display locked library placeholder for Pro features
 */
const LockedLibrary = () => {
	return (
		<div
			className="flex flex-col items-center justify-center gap-4 text-center px-4 py-8 md:py-12"
			style={{ minHeight: 'calc(100vh - 400px)' }}
		>
			<div className="flex flex-col items-center justify-center gap-4 max-w-md mx-auto w-full">
				<div className="p-2 bg-[#FAEADF] rounded-full">
					<PremiumIcon width={30} height={30} />
				</div>
				<div>
					<h3 className="text-base text-[#333333] font-medium">
						{__(
							'Unlock advanced features with Pro upgrade',
							'quillcrm'
						)}
					</h3>
				</div>
				<Button
					size="lg"
					className="w-full max-w-xs"
					onClick={() => {
						window.open(config.getUrlQuillCRMPro(), '_blank');
					}}
				>
					{__('Upgrade Pro Now', 'quillcrm')}
				</Button>
			</div>
		</div>
	);
};

export default LockedLibrary;
