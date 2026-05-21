/**
 * wordpress dependencies
 */
import { __ } from '@wordpress/i18n';

const EcommerceTemplates = () => {
	return (
		<div className="flex flex-col items-center justify-center h-32">
			<p className="text-gray-400 text-sm text-center">
				{__('Coming soon', 'doublescale')}
			</p>
		</div>
	);
};

export default EcommerceTemplates;
