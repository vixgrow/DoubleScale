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
	const [isProActive, setIsProActive] = useState<boolean>(true);

	const fetchLinkTriggers = async (keyword = '', ids: number[] = []) => {
		try {
			const response = (await apiFetch({
				path: addQueryArgs('/qc/v1/link-triggers', {
					keyword: keyword,
					ids: ids,
				}),
			})) as LinkTriggersResponse;

			setSavedLinkTriggers([...savedLinkTriggers, ...response.data]);

			return response.data.map((trigger: LinkTrigger) => ({
				label: trigger.name,
				value: trigger.id,
			}));
		} catch (error: any) {
			// Check if it's a 404 error (endpoint doesn't exist - Pro not active)
			if (error?.code === 'rest_no_route' || error?.data?.status === 404) {
				setIsProActive(false);
			}
			console.error('Link Triggers requires QuillCRM Pro:', error);
			return [];
		}
	};

	useEffect(() => {
		if (value?.length) {
			fetchLinkTriggers('', value);
		}
	}, []);

	// Show Pro notice if Pro is not active
	if (!isProActive) {
		return (
			<div className="qcrm-field">
				<div className="qcrm-field-input">
					<div style={{ 
						padding: '12px', 
						backgroundColor: '#fff3cd', 
						border: '1px solid #ffc107',
						borderRadius: '4px',
						color: '#856404'
					}}>
						<strong>{__('Pro Feature:', 'quillcrm')}</strong>{' '}
						{__('Link Triggers require QuillCRM Pro to be installed and activated.', 'quillcrm')}
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="qcrm-field">
			<div className="qcrm-field-input">
				<Flex vertical={true} gap={10}>
					<Flex justify="space-between" gap={10}>
						<Flex vertical={true} gap={10} style={{ flex: 1 }}>
							<AsyncSelect
								className="react-select-container"
								classNamePrefix="react-select"
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
									const selectedOption = val as {
										value: number;
										label: string;
									};
									const newLinkTriggers = [
										...value,
										selectedOption.value,
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
