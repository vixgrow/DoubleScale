/**
 * WordPress dependencies
 */
import { useState, useEffect } from '@wordpress/element';
import apiFetch from '@wordpress/api-fetch';
import { addQueryArgs } from '@wordpress/url';
import { __ } from '@wordpress/i18n';
import { useDispatch } from '@wordpress/data';

/**
 * External dependencies
 */
import { isObject, map } from 'lodash';
import Select from 'react-select';

/**
 * Internal dependencies
 */
import './style.scss';
import type {
	IntegrationSelectOptions,
	ReactSelectOptions,
} from '@quillcrm/client';

interface SelectFieldProps {
	integration: string;
	slug: string;
	onChange: (value: string) => void;
	value: string;
}

const SelectField: React.FC<SelectFieldProps> = ({
	integration,
	slug,
	onChange,
	value,
}) => {
	const [options, setOptions] = useState<ReactSelectOptions>([]);
	const [isLoading, setIsLoading] = useState<boolean>(false);
	const { createNotice } = useDispatch('quillcrm/core');

	const fetchOptions = async () => {
		setIsLoading(true);

		try {
			const response = (await apiFetch({
				path: addQueryArgs(
					`/qc/v1/integrations/${integration}/${slug}`
				),
				method: 'GET',
			})) as IntegrationSelectOptions;

			setOptions(
				map(response, (option) => ({
					label: option.name,
					value: option.id,
				}))
			);
		} catch (error) {
			createNotice({
				type: 'error',
				message: __('Failed to fetch options', 'quillcrm'),
			});
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
				className="react-select-container"
				classNamePrefix="react-select"
				isLoading={isLoading}
				options={options}
				onChange={(value) => {
					if (!isObject(value)) {
						return;
					}
					onChange(value.value);
				}}
				value={options.find((option) => option.value === value)}
				styles={{
					menu: (base: any) => ({
						...base,
						color: 'black',
					}),
				}}
			/>
		</div>
	);
};

export default SelectField;
