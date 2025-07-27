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
import AsyncSelect from 'react-select/async';

/**
 * Internal dependencies
 */
import './style.scss';
import type { List, ListsResponse } from '@quillcrm/client';
import { Tag } from '@quillcrm/components';

interface SelectOption {
	label: string;
	value: number;
}

interface Props {
	value: number[];
	onChange: (value: number[]) => void;
}

const ListField = ({ value, onChange }: Props) => {
	const [savedLists, setSavedLists] = useState<List[]>([]);

	const fetchLists = async (
		keyword = '',
		ids: number[] = []
	): Promise<SelectOption[]> => {
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
				<div className="flex flex-col gap-[10px]">
					<div className="flex justify-between gap-[10px]">
						<div className="flex flex-col gap-[10px] flex-1">
							<AsyncSelect<SelectOption, false>
								loadOptions={(inputValue, callback) => {
									fetchLists(inputValue).then((data) => {
										if (!data) {
											return;
										}

										callback(data);
									});
								}}
								defaultOptions
								value={null}
								onChange={(val: SelectOption | null) => {
									if (!val) {
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
								<div className="flex gap-[10px]">
									{value.map((list_id) => {
										const list = savedLists.find(
											(item) => item.id === list_id
										);
										if (!list) return null;

										return (
											<Tag
												key={list_id}
												label={list.name}
												onClose={() => {
													const newLists =
														value.filter(
															(id) =>
																id !== list_id
														);
													onChange(newLists);
												}}
											/>
										);
									})}
								</div>
							)}
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};

export default ListField;
