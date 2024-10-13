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
import { isObject, map } from 'lodash';

/**
 * Internal dependencies
 */
import './style.scss';
import type { List, ListsResponse } from '@quillcrm/client';

interface Props {
	value: number[];
	onChange: (value: number[]) => void;
}

const ListField = ({ value, onChange }: Props) => {
	const [savedLists, setSavedLists] = useState<List[]>([]);

	const fetchLists = async (keyword = '', ids: number[] = []) => {
		try {
			const response = (await apiFetch({
				path: addQueryArgs('/qc/v1/lists', {
					keyword: keyword,
					ids: ids,
				}),
			})) as ListsResponse;

			setSavedLists([...savedLists, ...response.data]);
			const lists = response.data;
			return lists.map((list: List) => ({
				label: list.name,
				value: list.id,
			}));
		} catch (error) {
			console.error(error);
			return [];
		}
	};

	useEffect(() => {
		if (value?.length) {
			fetchLists('', value);
		}
	}, []);

	return (
		<div className="qcrm-field">
			<div className="qcrm-field-input">
				<Flex vertical={true} gap={10}>
					<Flex justify="space-between" gap={10}>
						<Flex vertical={true} gap={10} style={{ flex: 1 }}>
							<AsyncSelect
								loadOptions={(inputValue, callback) => {
									fetchLists(inputValue).then((data) => {
										callback(data);
									});
								}}
								defaultOptions
								value={''}
								onChange={(val) => {
									if (!isObject(val)) {
										return;
									}

									if (value.includes(val.value)) {
										return;
									}

									const newLists = [...value, val.value];
									onChange(newLists);
								}}
								placeholder={__('Select list', 'quillcrm')}
								styles={{
									control: (styles) => ({
										...styles,
										minWidth: 200,
									}),
								}}
							/>
							{value && (
								<Flex gap={10}>
									{map(value, (list_id) => (
										<AntTag
											key={list_id}
											closable
											onClose={() => {
												const newLists = value.filter(
													(list) => list !== list_id
												);

												onChange(newLists);
											}}
										>
											{
												savedLists.find(
													(list) =>
														list.id === list_id
												)?.name
											}
										</AntTag>
									))}
								</Flex>
							)}
						</Flex>
					</Flex>
				</Flex>
			</div>
		</div>
	);
};

export default ListField;
