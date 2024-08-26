/**
 * WordPress dependencies
 */
import { useState, useEffect } from '@wordpress/element';
import apiFetch from '@wordpress/api-fetch';
import { addQueryArgs } from '@wordpress/url';
import { __ } from '@wordpress/i18n';

/**
 * External dependencies
 */
import { map } from 'lodash';
import Select from 'react-select';

/**
 * Internal dependencies
 */
import './style.scss';

interface SelectFieldProps {
	integration: string;
	slug: string;
	onChange: (value: any) => void;
	value: any;
}

const SelectField: React.FC<SelectFieldProps> = ({
	integration,
	slug,
	onChange,
	value,
}) => {
	const [options, setOptions] = useState([]);
	const [isLoading, setIsLoading] = useState(false);

	const fetchOptions = async () => {
		setIsLoading(true);

		try {
			const response = (await apiFetch({
				path: addQueryArgs(
					`/qc/v1/integrations/${integration}/${slug}`
				),
				method: 'GET',
			})) as any;

			setOptions(
				map(response, (option) => ({
					label: option.name,
					value: option.id,
				}))
			);
		} catch (error) {
			console.log(error);
		} finally {
			setIsLoading(false);
		}
	};

	useEffect(() => {
		fetchOptions();
	}, []);

	return (
		<div className="qcrm-integration-select-field">
			<Select
				isLoading={isLoading}
				options={options}
				onChange={(value: any) => {
					onChange(value.value);
				}}
				value={options.find((option: any) => option.value === value)}
			/>
		</div>
	);
};

export default SelectField;
