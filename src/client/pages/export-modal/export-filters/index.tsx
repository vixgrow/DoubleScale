/**
 * wordpress dependencies
 */
import { __ } from '@wordpress/i18n';
/**
 * internal dependencies
 */
import { Filters, LoadingSpinner } from '@doublescale/components';
import { useExportContext } from '../contexts';

const ExportFilters: React.FC = () => {
	const { filters, setFilters, totalContact, isFiltering } =
		useExportContext();

	return (
		<div className="doublescale-contacts-list__filters flex flex-col gap-3">
			<div className="flex items-center justify-between">
				<div className="font-bold text-[#09090B] text-3xl">
					{__('Select Exporting Filters', 'doublescale')}
				</div>
				<div className="doublescale-contacts-total flex gap-[10px] text-[#09090B] text-xl font-medium">
					{__('Total Contacts based on filters', 'doublescale')}:{' '}
					{!isFiltering && <div>{totalContact}</div>}
					{isFiltering && <LoadingSpinner size={24} />}
				</div>
			</div>
			<Filters
				filters={filters}
				onChange={(newFilters) => {
					setFilters(newFilters);
				}}
			/>
		</div>
	);
};

export default ExportFilters;
