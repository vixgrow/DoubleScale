/**
 * wordpress dependencies
 */
import { __ } from '@wordpress/i18n';
/**
 * internal dependencies
 */
import { NoDataIcon } from '@doublescale/components';

export const EmptyState: React.FC = () => {
	return (
		<div className="flex flex-col items-center justify-center gap-5 py-5 text-2xl font-semibold text-primaryText">
			<NoDataIcon />
			{__('No Data Available', 'doublescale')}
		</div>
	);
};
