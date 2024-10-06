/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useState } from '@wordpress/element';
import apiFetch from '@wordpress/api-fetch';

/**
 * External dependencies
 */
import { Flex } from 'antd';
import AsyncSelect from 'react-select/async';
import { isObject, isArray } from 'lodash';

/**
 * Internal dependencies
 */
import './style.scss';
import type { ReactSelectOptions } from '@quillcrm/client';

interface Props {
	endpoint: string;
	value: string | string[];
	onChange: (value: string | string[]) => void;
	multiple: boolean;
}

const API_Select = ({ endpoint, value, onChange, multiple = false }: Props) => {
	const [loading, setLoading] = useState(false);
	const [options, setOptions] = useState<ReactSelectOptions>([]);

	const fetchOptions = async () => {
		setLoading(true);
		try {
			const response = (await apiFetch({
				path: `/qc/v1/integrations/${endpoint}`,
			})) as ReactSelectOptions;

			setOptions([...options, ...response]);

			return response;
		} catch (error) {
			console.error(error);
			return [];
		} finally {
			setLoading(false);
		}
	};

	return (
		<Flex vertical={true} gap={10}>
			<Flex justify="space-between" gap={10}>
				<Flex vertical={true} gap={10} style={{ flex: 1 }}>
					<AsyncSelect
						isLoading={loading}
						defaultOptions
						cacheOptions
						defaultValue={
							!multiple
								? options.find(
										(option) => option.value == value
									)
								: isArray(value) &&
									value.length > 0 &&
									value.map((val) =>
										options.find(
											(option) => option.value == val
										)
									)
						}
						isMulti={multiple}
						value={
							!multiple
								? options.find(
										(option) => option.value == value
									)
								: isArray(value) &&
									value.length > 0 &&
									value.map((val) =>
										options.find(
											(option) => option.value == val
										)
									)
						}
						loadOptions={fetchOptions}
						onChange={(val) => {
							if (multiple) {
								if (isArray(val)) {
									onChange(val.map((v) => v.value));
								}
							} else {
								if (isObject(val)) {
									onChange(val.value);
								}
							}
						}}
						placeholder={__('Select option', 'quillcrm')}
					/>
				</Flex>
			</Flex>
		</Flex>
	);
};

export default API_Select;
