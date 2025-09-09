/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useState, useEffect, useCallback, useMemo } from '@wordpress/element';
import apiFetch from '@wordpress/api-fetch';

/**
 * External dependencies
 */
import { Flex } from 'antd';
import AsyncSelect from 'react-select/async';
import { isObject, isArray, isNumber, isString } from 'lodash';

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
	parent?: string;
	allValues?: { [key: string]: any };
	defaultValue?: string;
}

const DealStageChange = ({
	endpoint,
	value,
	onChange,
	multiple = false,
	parent: _parent,
	allValues,
	defaultValue,
}: Props) => {
	const [loading, setLoading] = useState(false);
	const [options, setOptions] = useState<ReactSelectOptions>([]);

	const buildApiPath = useCallback(() => {
		// Check if it's an automation field option endpoint
		if (endpoint === 'pipelines') {
			return `/qc/v1/pipelines`;
		}

		if (endpoint === 'pipeline-stages') {
			if (isNumber(allValues?.pipeline)) {
				return `/qc/v1/pipelines/${allValues?.pipeline}/stages`;
			}
			return '';
		}
		return '';
	}, [endpoint, allValues?.pipeline]);

	const fetchOptions = useCallback(async () => {
		setLoading(true);
		try {
			const apiPath = buildApiPath();
			let response: ReactSelectOptions = [];

			if (apiPath && isString(apiPath)) {
				response = (await apiFetch({
					path: apiPath,
				})) as ReactSelectOptions;
			}

			// Transform response if needed
			if (isArray(response)) {
				response = response.map((item: any) => ({
					label: item.name,
					value: item.id,
				}));
			}

			// Add default option if provided
			const finalOptions = defaultValue
				? [
						{
							label:
								defaultValue === 'any-pipeline'
									? __('Any Pipeline', 'quillcrm')
									: defaultValue === 'any-stage'
										? __('Any Stage', 'quillcrm')
										: defaultValue,
							value: defaultValue,
						},
						...response,
					]
				: response;

			setOptions(finalOptions);
			return finalOptions;
		} catch (error) {
			console.error('Error fetching options:', error);
			return [];
		} finally {
			setLoading(false);
		}
	}, [buildApiPath, endpoint, defaultValue]);

	useEffect(() => {
		if (endpoint === 'pipeline-stages') {
			fetchOptions();
		}
	}, [endpoint, fetchOptions]);

	return (
		<Flex vertical={true} gap={10}>
			<Flex justify="space-between" gap={10}>
				<Flex vertical={true} gap={10} style={{ flex: 1 }}>
					<AsyncSelect
						key={`${endpoint}-${options.length}`}
						className="react-select-container"
						classNamePrefix="react-select"
						isLoading={loading}
						defaultOptions
						cacheOptions
						defaultValue={useMemo(() => {
							if (!multiple) {
								return options.find(
									(option) => option.value == value
								);
							}
							return isArray(value) && value.length > 0
								? value
										.map((val) =>
											options.find(
												(option) => option.value == val
											)
										)
										.filter(Boolean)
								: undefined;
						}, [options, value, multiple])}
						isMulti={multiple}
						value={useMemo(() => {
							if (!multiple) {
								return options.find(
									(option) => option.value == value
								);
							}
							return isArray(value) && value.length > 0
								? value
										.map((val) =>
											options.find(
												(option) => option.value == val
											)
										)
										.filter(Boolean)
								: [];
						}, [options, value, multiple])}
						loadOptions={fetchOptions}
						onChange={useCallback(
							(val: any) => {
								if (multiple) {
									if (isArray(val)) {
										onChange(val.map((v: any) => v.value));
									} else {
										onChange([]);
									}
								} else {
									if (
										isObject(val) &&
										val &&
										'value' in val
									) {
										onChange(val.value as string);
									} else {
										onChange('');
									}
								}
							},
							[multiple, onChange]
						)}
						placeholder={__('Select option', 'quillcrm')}
					/>
				</Flex>
			</Flex>
		</Flex>
	);
};

export default DealStageChange;
