/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import './style.scss';
import PaginatedSelect from '@quillcrm/components/paginated-select';

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
			placeholder={__('Select tag', 'quillcrm')}
			noOptionsMessage={__('No tags available', 'quillcrm')}
			className="qcrm-tag-field"
		/>
	);
};

export default TagField;
