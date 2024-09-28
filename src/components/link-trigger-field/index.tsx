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
import type { LinkTrigger, LinkTriggersResponse } from '@quillcrm/client';

interface Props {
	value: number[];
	onChange: (value: number[]) => void;
}

const LinkTriggerField = ({ value, onChange }: Props) => {
	const [savedLinkTriggers, setSavedLinkTriggers] = useState<LinkTrigger[]>(
		[]
	);

	const fetchLinkTriggers = async (keyword = '', ids: number[] = []) => {
		try {
			const response = (await apiFetch({
				path: addQueryArgs('/qc/v1/lists', {
					keyword: keyword,
					ids: ids,
				}),
			})) as LinkTriggersResponse;

			setSavedLinkTriggers([...savedLinkTriggers, ...response.data]);

			return response.data.map((list: LinkTrigger) => ({
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
			fetchLinkTriggers('', value);
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
									fetchLinkTriggers(inputValue).then(
										(data) => {
											callback(data);
										}
									);
								}}
								onChange={(val) => {
									if (!isObject(val)) {
										return;
									}
									const newLinkTriggers = [
										...value,
										val.value,
									];
									onChange(newLinkTriggers);
								}}
								placeholder={__('Select list', 'quillcrm')}
							/>
							{value && (
								<Flex gap={10}>
									{map(value, (list_id) => (
										<AntTag
											key={list_id}
											closable
											onClose={() => {
												const newLinkTriggers =
													value.filter(
														(list) =>
															list !== list_id
													);

												onChange(newLinkTriggers);
											}}
										>
											{
												savedLinkTriggers.find(
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

export default LinkTriggerField;
