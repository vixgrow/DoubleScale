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
import type { Tag, TagsResponse } from '@quillcrm/client';

interface Props {
	value: number[];
	onChange: (value: number[]) => void;
}

const TagField = ({ value, onChange }: Props) => {
	const [savedTags, setSavedTags] = useState<Tag[]>([]);

	const fetchTags = async (keyword = '', ids: number[] = []) => {
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
		<Flex vertical={true} gap={10}>
			<Flex justify="space-between" gap={10}>
				<Flex vertical={true} gap={10} style={{ flex: 1 }}>
					<AsyncSelect
						loadOptions={(inputValue, callback) => {
							fetchTags(inputValue).then((data) => {
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
						<Flex gap={10}>
							{map(value, (tag_id) => (
								<AntTag
									key={tag_id}
									closable
									onClose={() => {
										const newTags = value.filter(
											(tag) => tag !== tag_id
										);

										onChange(newTags);
									}}
								>
									{
										savedTags.find(
											(tag) => tag.id === tag_id
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

export default TagField;
