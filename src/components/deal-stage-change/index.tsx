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
import Select from 'react-select';
import { isObject, isArray, isNumber, isString } from 'lodash';

/**
 * Internal dependencies
 */
import './style.scss';

interface Props {
	endpoint: string;
	value: string;
	onChange: (value: string) => void;
	parent?: string;
	allValues?: { [key: string]: any };
	defaultValue?: string;
}

const DealStageChange = ({
	endpoint,
	value,
	onChange,
	parent: _parent,
	allValues,
	defaultValue,
}: Props) => {
	const [loading, setLoading] = useState(false);
	const [options, setOptions] = useState<any[]>([]);
	const defaultValueForStages = 'any-stage';
	const anyPipelineValue = 'any-pipeline';
	const endpointForStages = 'pipeline-stages';
	const endpointForPipelines = 'pipelines';
	const labelForAnyPipeline = __('Any Pipeline', 'quillcrm');
	const labelForAnyStage = __('Any Stage', 'quillcrm');
	const placeholderForSelect = __('Select option', 'quillcrm');

	const buildApiPath = () => {
		if (endpoint === endpointForPipelines) {
			return `/qc/v1/pipelines`;
		}

		if (endpoint === endpointForStages) {
			if (isNumber(allValues?.pipeline)) {
				return `/qc/v1/pipelines/${allValues?.pipeline}/stages`;
			}
			return '';
		}
		return '';
	};

	const fetchOptions = useCallback(async () => {
		setLoading(true);
		try {
			const apiPath = buildApiPath();
			let response: any[] = [];

			if (apiPath && isString(apiPath)) {
				response = await apiFetch({
					path: apiPath,
				});
			}

			if (isArray(response)) {
				response = response.map((item: any) => ({
					label: item.name,
					value: item.id,
				}));
			}

			// Add default option if provided
			let finalOptions = defaultValue
				? [
						{
							label:
								defaultValue === anyPipelineValue
									? labelForAnyPipeline
									: defaultValue === defaultValueForStages
										? labelForAnyStage
										: defaultValue,
							value: defaultValue,
						},
						...response,
					]
				: response;

			// Ensure 'Any Stage' option exists when pipeline is 'any-pipeline'
			if (
				endpoint === endpointForStages &&
				String(allValues?.pipeline) === anyPipelineValue &&
				!finalOptions.some(
					(opt: any) => String(opt.value) === defaultValueForStages
				)
			) {
				finalOptions = [
					{
						label: labelForAnyStage,
						value: defaultValueForStages,
					},
					...finalOptions,
				];
			}

			setOptions(finalOptions);
			return finalOptions;
		} catch (error) {
			console.error('Error fetching options:', error);
			return [];
		} finally {
			setLoading(false);
		}
	}, [buildApiPath, endpoint, allValues]);

	useEffect(() => {
		if (
			endpoint === endpointForStages &&
			String(allValues?.pipeline) === anyPipelineValue &&
			value !== defaultValueForStages
		) {
			onChange(defaultValueForStages);
		}
	}, [endpoint, allValues?.pipeline, value, onChange]);

	useEffect(() => {
		fetchOptions();
	}, []);

	useEffect(() => {
		if (endpoint === endpointForStages) {
			fetchOptions();
		}
	}, [endpoint, allValues]);

	return (
		<Flex vertical={true} gap={10}>
			<Flex justify="space-between" gap={10}>
				<Flex vertical={true} gap={10} style={{ flex: 1 }}>
					<Select
						key={`${endpoint}-${options.length}`}
						className="react-select-container"
						classNamePrefix="react-select"
						isLoading={loading}
						options={options}
						value={useMemo(() => {
							return options.find(
								(option) =>
									String(option.value) === String(value)
							);
						}, [options, value])}
						onChange={useCallback(
							(val: any) => {
								if (isObject(val) && val && 'value' in val) {
									onChange(val.value as string);
								} else {
									onChange('');
								}
							},
							[onChange]
						)}
						placeholder={placeholderForSelect}
					/>
				</Flex>
			</Flex>
		</Flex>
	);
};

export default DealStageChange;
