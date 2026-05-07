/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import './style.scss';
import { PaginatedSelect } from '@doublescale/components';

interface Props {
	value: number[];
	onChange: (value: number[]) => void;
}

const ListField = ({ value, onChange }: Props) => {
	return (
		<div className="doublescale-field">
			<div className="doublescale-field-input">
				<PaginatedSelect
					value={value}
					onChange={onChange}
					endpoint="/qc/v1/lists"
					placeholder={__('Select list', 'doublescale')}
					noOptionsMessage={__('No lists available', 'doublescale')}
					className="doublescale-list-field"
				/>
			</div>
		</div>
	);
};

export default ListField;
