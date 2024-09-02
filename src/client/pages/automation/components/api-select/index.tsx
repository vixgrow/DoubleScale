/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useState, useEffect } from '@wordpress/element';
import apiFetch from '@wordpress/api-fetch';
import { addQueryArgs } from '@wordpress/url';

/**
 * External dependencies
 */
import { Tag as AntTag, Flex } from 'antd';
import AsyncSelect from 'react-select/async';
import { map } from 'lodash';

/**
 * Internal dependencies
 */
import './style.scss';

interface Props {
	endpoint: string;
	value: string[];
	onChange: (value: string[]) => void;
}

const ApiSelectField = ({ endpoint, value, onChange }: Props) => {
	const [savedOptions, setSavedOptions] = useState<any>([]);

	const fetchOptions = async (keyword = '', ids: any = []) => {
		try {
			const response = (await apiFetch({
				path: addQueryArgs(endpoint, {
					keyword: keyword,
					ids: ids,
				}),
			})) as any;

			setSavedOptions([...savedOptions, ...response.data]);

			return response.data.map((option: any) => ({
				label: option.name,
				value: option.id,
			}));
		} catch (error) {
			console.error(error);
			return [];
		}
	};

	useEffect(() => {
		if (value?.length) {
			fetchOptions('', value);
		}
	}, []);

	return (
		<Flex vertical={true} gap={10}>
			<Flex justify="space-between" gap={10}>
				<Flex vertical={true} gap={10} style={{ flex: 1 }}>
					<AsyncSelect
						loadOptions={(inputValue, callback) => {
							fetchOptions(inputValue).then((data) => {
								callback(data);
							});
						}}
						onChange={(val: any) => {
							const newValue = [...value, val.value];
							onChange(newValue);
						}}
						placeholder={__('Select option', 'quillcrm')}
					/>
					{value && (
						<Flex gap={10}>
							{map(value, (option_id) => (
								<AntTag
									key={option_id.id}
									closable
									onClose={() => {
										onChange(
											value.filter(
												(id) => id !== option_id
											)
										);
									}}
								>
									{
										savedOptions.find(
											(option) => option.id === option_id
										)?.name
									}
								</AntTag>
							))}
						</Flex>
					)}
				</Flex>
			</Flex>
		</Flex>
	);
};

export default ApiSelectField;
