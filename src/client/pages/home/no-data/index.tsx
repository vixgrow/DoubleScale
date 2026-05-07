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
		<div className="flex flex-col justify-center items-center gap-5 text-[#09090B] font-semibold text-2xl py-5">
			<NoDataIcon />
			{__('No Data Available', 'doublescale')}
		</div>
	);
};
