/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useState, useEffect } from '@wordpress/element';
import apiFetch from '@wordpress/api-fetch';
import { addQueryArgs } from '@wordpress/url';
import { useDispatch } from '@wordpress/data';

/**
 * External dependencies
 */
import {
	Card,
	List as AntList,
	Typography,
	Flex,
	Popover,
	Button,
	Tag as AntTag,
} from 'antd';
import { MoreOutlined } from '@ant-design/icons';
import { map, isEmpty } from 'lodash';

/**
 * Internal dependencies
 */
import './style.scss';
import { useFormContext } from '../../state/context';
import ConfigAPI from '@quillcrm/config';
import { Tag, List } from '@quillcrm/client';
import { useNavigate, getToLink } from '@quillcrm/navigation';

const FieldsCard: React.FC = () => {
	const { form, isLoading } = useFormContext();
	const { getForms } = ConfigAPI;
	const forms = getForms();
	const fieldsSettings = form
		? forms[form?.form_type]?.fields_settings
		: null;
	const { getAjaxUrl, getNonce, getContactFieldsGroups } = ConfigAPI;
	const contactFieldsGroups = getContactFieldsGroups();
	const [formFields, setFormFields] = useState(null);
	const [isFetching, setIsFetching] = useState(false);
	const [savedTags, setSavedTags] = useState<Tag[]>([]);
	const [savedLists, setSavedLists] = useState<List[]>([]);
	const navigate = useNavigate();
	const { createNotice } = useDispatch('quillcrm/core');

	const getFormFields = async () => {
		if (!form || !fieldsSettings) {
			return;
		}

		setIsFetching(true);

		try {
			const body = new FormData();
			body.append('action', fieldsSettings.action);
			body.append('nonce', getNonce());
			map(fieldsSettings.fields, (key) => {
				body.append(key, form[key] || '');
			});
			const response = await fetch(getAjaxUrl(), {
				method: 'POST',
				body,
			});

			const data = await response.json();

			setFormFields(data.data);
		} catch (error) {
			createNotice({
				type: 'error',
				message: __('Failed to fetch form fields', 'quillcrm'),
			});
		} finally {
			setIsFetching(false);
		}
	};

	const fetchLists = async (keyword = '', ids = []) => {
		try {
			const response = (await apiFetch({
				path: addQueryArgs('/qc/v1/lists', {
					keyword: keyword,
					ids: ids,
				}),
			})) as any;

			setSavedLists([...savedLists, ...response.data]);

			return response.data.map((list: List) => ({
				label: list.name,
				value: list.id,
			}));
		} catch (error) {
			createNotice({
				type: 'error',
				message: __('Failed to fetch lists', 'quillcrm'),
			});
			return [];
		}
	};

	const fetchTags = async (keyword = '', ids = []) => {
		try {
			const response = (await apiFetch({
				path: addQueryArgs('/qc/v1/tags', {
					keyword: keyword,
					ids: ids,
				}),
			})) as any;

			setSavedTags([...savedTags, ...response.data]);

			return response.data.map((tag: Tag) => ({
				label: tag.name,
				value: tag.id,
			}));
		} catch (error) {
			createNotice({
				type: 'error',
				message: __('Failed to fetch tags', 'quillcrm'),
			});
			return [];
		}
	};

	useEffect(() => {
		getFormFields();

		if (form?.data?.lists) {
			fetchLists('', form.data.lists);
		}

		if (form?.data?.tags) {
			fetchTags('', form.data.tags);
		}
	}, [form?.form_id]);

	const getValueLabel = (value) => {
		for (const groupKey in contactFieldsGroups) {
			const group = contactFieldsGroups[groupKey];
			if (group.fields[value]) {
				return group.fields[value].label;
			}
		}

		return '';
	};

	return (
		<Card
			loading={isLoading}
			title={
				<Flex justify="space-between">
					<Typography.Text strong>
						{__('Fields', 'quillcrm')}
					</Typography.Text>
					<Popover
						content={
							<Button
								type="link"
								onClick={() => {
									navigate(
										getToLink(`forms/${form?.id}/settings`)
									);
								}}
							>
								{__('Edit', 'quillcrm')}
							</Button>
						}
						trigger="click"
					>
						<MoreOutlined />
					</Popover>
				</Flex>
			}
			style={{ marginTop: 20 }}
		>
			{formFields && (
				<AntList
					header={
						<Typography.Text strong>
							{__('Mapped Fields', 'quillcrm')}
						</Typography.Text>
					}
					size="small"
					className="qcrm-overview-fields-list"
					loading={isFetching}
				>
					<AntList.Item>
						<Flex>
							<Typography.Text strong>
								{__('Form Fields', 'quillcrm')}
							</Typography.Text>
							<Typography.Text strong>
								{__('Contact Fields', 'quillcrm')}
							</Typography.Text>
						</Flex>
					</AntList.Item>
					{map(form?.data.mapped_fields, (value, key) => (
						<AntList.Item>
							<Flex>
								<Typography.Text>
									{formFields[key]}
								</Typography.Text>
								<Typography.Text>
									{getValueLabel(value)}
								</Typography.Text>
							</Flex>
						</AntList.Item>
					))}
				</AntList>
			)}
			<AntList
				header={
					<Typography.Text strong>
						{__('Contact', 'quillcrm')}
					</Typography.Text>
				}
				size="small"
				className="qcrm-overview-fields-list"
				loading={isFetching}
			>
				<AntList.Item>
					<Flex>
						<Typography.Text strong>
							{__('Lists', 'quillcrm')}
						</Typography.Text>
						<Typography.Text>
							{isEmpty(savedLists)
								? __('No lists', 'quillcrm')
								: // @ts-ignore
									savedLists.map((list) => (
										<AntTag>{list.name}</AntTag>
									))}
						</Typography.Text>
					</Flex>
				</AntList.Item>
				<AntList.Item>
					<Flex>
						<Typography.Text strong>
							{__('Tags', 'quillcrm')}
						</Typography.Text>
						<Typography.Text>
							{isEmpty(savedTags)
								? __('No tags', 'quillcrm')
								: // @ts-ignore
									savedTags.map((tag) => (
										<AntTag>{tag.name}</AntTag>
									))}
						</Typography.Text>
					</Flex>
				</AntList.Item>
				<AntList.Item>
					<Flex>
						<Typography.Text strong>
							{__('Update existing contact', 'quillcrm')}
						</Typography.Text>
						<Typography.Text>
							{form?.data.update_existing_contact
								? __('Yes', 'quillcrm')
								: __('No', 'quillcrm')}
						</Typography.Text>
					</Flex>
				</AntList.Item>
				<AntList.Item>
					<Flex>
						<Typography.Text strong>
							{__('Update blank fields', 'quillcrm')}
						</Typography.Text>
						<Typography.Text>
							{form?.data.update_blank_fields
								? __('Yes', 'quillcrm')
								: __('No', 'quillcrm')}
						</Typography.Text>
					</Flex>
				</AntList.Item>
				<AntList.Item>
					<Flex>
						<Typography.Text strong>
							{__('Mark as subscribed', 'quillcrm')}
						</Typography.Text>
						<Typography.Text>
							{form?.data.mark_as_subscribed
								? __('Yes', 'quillcrm')
								: __('No', 'quillcrm')}
						</Typography.Text>
					</Flex>
				</AntList.Item>
			</AntList>
		</Card>
	);
};

export default FieldsCard;
