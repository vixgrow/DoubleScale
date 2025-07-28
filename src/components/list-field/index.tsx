/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import './style.scss';
import { PaginatedSelect } from '@quillcrm/components';

interface Props {
	value: number[];
	onChange: (value: number[]) => void;
}

const ListField = ({ value, onChange }: Props) => {
	return (
		<div className="qcrm-field">
			<div className="qcrm-field-input">
				<PaginatedSelect
					value={value}
					onChange={onChange}
					endpoint="/qc/v1/lists"
					placeholder={__('Select list', 'quillcrm')}
					noOptionsMessage={__('No lists available', 'quillcrm')}
					className="qcrm-list-field"
				/>
			</div>
		</div>
	);
};

export default ListField;
