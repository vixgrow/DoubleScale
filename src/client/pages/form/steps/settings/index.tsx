/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useEffect, useState } from '@wordpress/element';
import apiFetch from '@wordpress/api-fetch';
import { addQueryArgs } from '@wordpress/url';
import { useDispatch } from '@wordpress/data';

/**
 * External dependencies
 */
import {
	Button,
	Card,
	Typography,
	Flex,
	Input,
	Tag as AntTag,
	Switch,
} from 'antd';
import { map } from 'lodash';
import { ThreeDots as Loader } from 'react-loader-spinner';
import Select from 'react-select';
import AsyncSelect from 'react-select/async';

/**
 * Internal dependencies
 */
import './style.scss';
import { useFormContext } from '../../state/context';
import ConfigAPI from '@quillcrm/config';
import { useNavigate, getToLink } from '@quillcrm/navigation';
import { Tag, List } from '../../../types';

const Settings: React.FC = () => {
	const { form, isLoading, saveForm, isSaving, updateSettings } =
		useFormContext();
	const { getForms } = ConfigAPI;
	const forms = getForms();
	const fieldsSettings = form
		? forms[form?.form_type]?.fields_settings
		: null;
	const [formFields, setFormFields] = useState(null);
	const [isFetching, setIsFetching] = useState(false);
	const [savedTags, setSavedTags] = useState<Tag[]>([]);
	const [savedLists, setSavedLists] = useState<List[]>([]);
	const { getAjaxUrl, getNonce, getContactFieldsGroups } = ConfigAPI;
	const contactFieldsGroups = getContactFieldsGroups();
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

	const settings = form?.data || null;
	const mappedFields = settings ? settings?.mapped_fields : {};

	const save = async (status) => {
		if (!form) {
			return;
		}

		try {
			await saveForm({
				status: status,
			});
			if (status === 'active') {
				navigate(getToLink(`forms/${form.id}/overview`));
			} else {
				navigate(getToLink(`forms`));
			}
		} catch (error) {
			createNotice({
				type: 'error',
				message: __('Failed to save form', 'quillcrm'),
			});
		}
	};

	const getValueLabel = (value) => {
		for (const groupKey in contactFieldsGroups) {
			const group = contactFieldsGroups[groupKey];

			if (group.fields[value]) {
				return {
					label: group.fields[value].label,
					value: value,
				};
			}
		}

		return '';
	};

	return (
		<Card loading={isLoading}>
			{form && (
				<>
					{isFetching && (
						<Loader color="#00BFFF" height={40} width={40} />
					)}
					{!isFetching && (
						<>
							<div className="qcrm-fields">
								<div className="qcrm-field">
									<div className="qcrm-field-label">
										<Typography.Text>
											{__('Map fields', 'quillcrm')}
										</Typography.Text>
									</div>

									<Flex
										className="qcrm-field-input"
										vertical={true}
										gap={10}
									>
										{formFields &&
											map(formFields, (data, key) => {
												return (
													<div key={key}>
														<Flex
															justify="space-between"
															gap={10}
														>
															<Input
																readOnly
																value={data}
																style={{
																	flex: 1,
																}}
															/>
															<Select
																value={getValueLabel(
																	mappedFields[
																		key
																	]
																)}
																onChange={(
																	value: any
																) => {
																	updateSettings(
																		'mapped_fields',
																		{
																			...mappedFields,
																			[key]: value.value,
																		}
																	);
																}}
																styles={{
																	container: (
																		styles
																	) => ({
																		...styles,
																		flex: 1,
																	}),
																}}
																options={map(
																	contactFieldsGroups,
																	(
																		group,
																		groupKey
																	) => ({
																		label: group.label,
																		value: groupKey,
																		options:
																			map(
																				group.fields,
																				(
																					field,
																					fieldKey
																				) => ({
																					label: field.label,
																					value: fieldKey,
																				})
																			),
																	})
																)}
																placeholder={__(
																	'Select field',
																	'quillcrm'
																)}
															/>
														</Flex>
													</div>
												);
											})}
									</Flex>
								</div>
								<div className="qcrm-field">
									<div className="qcrm-field-label">
										<Typography.Text>
											{__('Contact', 'quillcrm')}
										</Typography.Text>
									</div>
									<div className="qcrm-field-input">
										<Flex vertical={true} gap={10}>
											<Flex
												justify="space-between"
												gap={10}
											>
												<Flex
													vertical={true}
													gap={10}
													style={{ flex: 1 }}
												>
													<Typography.Text>
														{__(
															'Lists',
															'quillcrm'
														)}
													</Typography.Text>
													<AsyncSelect
														loadOptions={(
															inputValue,
															callback
														) => {
															fetchLists(
																inputValue
															).then((data) => {
																callback(data);
															});
														}}
														onChange={(
															value: any
														) => {
															const newLists =
																settings?.lists
																	? [
																			...settings.lists,
																			value.value,
																		]
																	: [
																			value.value,
																		];
															updateSettings(
																'lists',
																newLists
															);
														}}
														placeholder={__(
															'Select list',
															'quillcrm'
														)}
													/>
													{settings?.lists && (
														<Flex gap={10}>
															{map(
																settings.lists,
																(list_id) => (
																	<AntTag
																		key={
																			list_id.id
																		}
																		closable
																		onClose={() => {
																			updateSettings(
																				'lists',
																				settings.lists.filter(
																					(
																						list
																					) =>
																						list !==
																						list_id
																				)
																			);
																		}}
																	>
																		{
																			savedLists.find(
																				(
																					list
																				) =>
																					list.id ===
																					list_id
																			)
																				?.name
																		}
																	</AntTag>
																)
															)}
														</Flex>
													)}
												</Flex>
												<Flex
													vertical={true}
													gap={10}
													style={{ flex: 1 }}
												>
													<Typography.Text>
														{__('Tags', 'quillcrm')}
													</Typography.Text>
													<AsyncSelect
														loadOptions={(
															inputValue,
															callback
														) => {
															fetchTags(
																inputValue
															).then((data) => {
																callback(data);
															});
														}}
														onChange={(
															value: any
														) => {
															const newTags =
																settings?.tags
																	? [
																			...settings.tags,
																			value.value,
																		]
																	: [
																			value.value,
																		];
															updateSettings(
																'tags',
																newTags
															);
														}}
														placeholder={__(
															'Select tag',
															'quillcrm'
														)}
													/>
													{settings?.tags && (
														<Flex gap={10}>
															{map(
																settings.tags,
																(tag_id) => (
																	<AntTag
																		key={
																			tag_id.id
																		}
																		closable
																		onClose={() => {
																			updateSettings(
																				'tags',
																				settings.tags.filter(
																					(
																						tag
																					) =>
																						tag !==
																						tag_id
																				)
																			);
																		}}
																	>
																		{
																			savedTags.find(
																				(
																					tag
																				) =>
																					tag.id ===
																					tag_id
																			)
																				?.name
																		}
																	</AntTag>
																)
															)}
														</Flex>
													)}
												</Flex>
											</Flex>
											<Flex
												gap={10}
												justify="space-between"
											>
												<Typography.Text>
													{__(
														'Update existing contact',
														'quillcrm'
													)}
												</Typography.Text>
												<Switch
													checked={
														settings?.update_existing_contact
													}
													onChange={(value) => {
														updateSettings(
															'update_existing_contact',
															value
														);
													}}
												/>
											</Flex>
											<Flex
												gap={10}
												justify="space-between"
											>
												<Typography.Text>
													{__(
														'Update blank fields',
														'quillcrm'
													)}
												</Typography.Text>
												<Switch
													checked={
														settings?.update_blank_fields
													}
													onChange={(value) => {
														updateSettings(
															'update_blank_fields',
															value
														);
													}}
												/>
											</Flex>
											<Flex
												gap={10}
												justify="space-between"
											>
												<Typography.Text>
													{__(
														'Mark as Subscribed',
														'quillcrm'
													)}
												</Typography.Text>
												<Switch
													checked={
														settings?.mark_as_subscribed
													}
													onChange={(value) => {
														updateSettings(
															'mark_as_subscribed',
															value
														);
													}}
												/>
											</Flex>
										</Flex>
									</div>
								</div>
							</div>
							<div className="qcrm-actions">
								<Button
									loading={isSaving}
									onClick={() => save('inactive')}
								>
									{__('Save as draft', 'quillcrm')}
								</Button>
								<Button
									type="primary"
									loading={isSaving}
									onClick={() => save('active')}
								>
									{__('Activate', 'quillcrm')}
								</Button>
							</div>
						</>
					)}
				</>
			)}
		</Card>
	);
};

export default Settings;
