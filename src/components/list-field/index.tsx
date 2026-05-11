/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import './style.scss';
import PaginatedSelect from '@doublescale/components/paginated-select';

interface Props {
	value: number[];
	onChange: (value: number[]) => void;
}

const ListField = ({ value, onChange }: Props) => {
	return (
		<PaginatedSelect
			value={value}
			onChange={onChange}
			endpoint="/doublescale/v1/lists"
			placeholder={__('Select list', 'doublescale')}
			noOptionsMessage={__('No lists available', 'doublescale')}
			className="doublescale-list-field"
		/>
	);
};

export default ListField;
