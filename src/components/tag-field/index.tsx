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
import type { Tag, TagsResponse } from '@quillcrm/client';
import { Tag as Tags } from '@quillcrm/components';

interface SelectOption {
	label: string;
	value: number;
}

interface Props {
	value: number[];
	onChange: (value: number[]) => void;
}

const TagField = ({ value, onChange }: Props) => {
	const [savedTags, setSavedTags] = useState<Tag[]>([]);

	const fetchTags = async (
		keyword = '',
		ids: number[] = []
	): Promise<SelectOption[]> => {
		try {
			const response = (await apiFetch({
				path: addQueryArgs('/qc/v1/tags', {
					keyword: keyword,
					ids: ids,
				}),
			})) as TagsResponse;

			setSavedTags([...savedTags, ...response.data]);
			const tags = response.data;
			return tags.map((tag: Tag) => ({
				label: tag.name,
				value: tag.id,
			}));
		} catch (error) {
			console.error(error);
			return [];
		}
	};

	useEffect(() => {
		if (value?.length) {
			fetchTags('', value);
		}
	}, []);

	return (
		<div className="flex flex-col gap-[10px]">
			<div className="flex justify-between gap-[10px]">
				<div className="flex flex-1 flex-col gap-[10px]">
					<AsyncSelect<SelectOption, false>
						loadOptions={(inputValue, callback) => {
							fetchTags(inputValue).then((data) => {
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

							const newTags = [...value, val.value];
							onChange(newTags);
						}}
						placeholder={__('Select tag', 'quillcrm')}
						styles={{
							control: (styles) => ({
								...styles,
								minWidth: 200,
							}),
						}}
					/>
					{value && (
						<div className="flex gap-[10px]">
							{value.map((tag_id) => {
								const tag = savedTags.find(
									(item) => item.id === tag_id
								);
								if (!tag) return null;

								return (
									<Tags
										key={tag_id}
										label={tag.name}
										onClose={() => {
											const newTags = value.filter(
												(id) => id !== tag_id
											);
											onChange(newTags);
										}}
									/>
								);
							})}
						</div>
					)}
				</div>
			</div>
		</div>
	);
};

export default TagField;
