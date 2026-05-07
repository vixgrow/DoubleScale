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

const TagField = ({ value, onChange }: Props) => {
	return (
		<PaginatedSelect
			value={value}
			onChange={onChange}
			endpoint="/qc/v1/tags"
			placeholder={__('Select tag', 'doublescale')}
			noOptionsMessage={__('No tags available', 'doublescale')}
			className="qcrm-tag-field"
		/>
	);
};

export default TagField;
