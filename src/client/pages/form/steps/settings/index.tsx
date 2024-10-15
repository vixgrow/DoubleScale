/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useEffect, useState } from '@wordpress/element';
import { useDispatch } from '@wordpress/data';

/**
 * External dependencies
 */
import { Button, Card, Typography, Flex, Switch } from 'antd';
import { map, mapValues } from 'lodash';

/**
 * Internal dependencies
 */
import './style.scss';
import { useFormContext } from '../../state/context';
import ConfigAPI from '@quillcrm/config';
import type { Form } from '@quillcrm/config';
import type { MappedFields } from '@quillcrm/client';
import { useNavigate, getToLink } from '@quillcrm/navigation';
import { ListField, TagField, ContactMappedFields } from '@quillcrm/components';

const Settings: React.FC = () => {
	const { form, saveForm, updateSettings } = useFormContext();
	const { getForms } = ConfigAPI;
	const forms = getForms();
	const fieldsSettings = form
		? forms[form?.form_type]?.fields_settings
		: null;
	const [formFields, setFormFields] = useState<
		Form['fields_settings']['fields'] | null
	>(null);
	const [isFetching, setIsFetching] = useState(true);
	const { getAjaxUrl, getNonce } = ConfigAPI;
	const navigate = useNavigate();
	const { createNotice } = useDispatch('quillcrm/core');
	const [isSaving, setIsSaving] = useState(false);
	const [isActivating, setIsActivating] = useState(false);

	const getFormFields = async () => {
		if (!form || !fieldsSettings) {
			return;
		}
		console.log(form);

		try {
			const body = new FormData();
			body.append('action', fieldsSettings.action);
			body.append('nonce', getNonce());
			map(fieldsSettings.fields, (key) => {
				body.append(key, form[key] || '');
			});
			console.log(fieldsSettings, 'fieldsSettings');

			const response = await fetch(getAjaxUrl(), {
				method: 'POST',
				body,
			});

			const data = await response.json();
			console.log(data);

			if (!data.success) {
				throw new Error(data.data);
			}

			setFormFields(
				data.data as Form['fields_settings']['fields']
			);
		} catch (error) {
			createNotice({
				type: 'error',
				message: __('Failed to fetch form fields', 'quillcrm'),
			});
		} finally {
			setIsFetching(false);
		}
	};

	useEffect(() => {
		getFormFields();
	}, [form?.form_id]);

	const settings = form?.data || null;
	const mappedFields = settings ? settings?.mapped_fields : {};

	const save = async (status) => {
		if (!form) {
			return;
		}

		if (status === 'active') {
			setIsActivating(true);
		} else {
			setIsSaving(true);
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
		} finally {
			if (status === 'active') {
				setIsActivating(false);
			} else {
				setIsSaving(false);
			}
		}
	};

	return (
		<Card loading={isFetching}>
			{form && (
				<>
					{!isFetching && (
						<>
							<div className="qcrm-fields">
								<div className="qcrm-field">
									<div className="qcrm-field-label">
										<Typography.Text>
											{__('Map fields', 'quillcrm')}
										</Typography.Text>
									</div>
									{formFields && (
										<ContactMappedFields
											values={mappedFields}
											onChange={(value: MappedFields) => {
												updateSettings(
													'mapped_fields',
													value
												);
											}}
											fields={mapValues(
												formFields,
												(name) => ({ label: name })
											)}
										/>
									)}
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
													<ListField
														value={
															settings?.lists ||
															[]
														}
														onChange={(value) => {
															updateSettings(
																'lists',
																value
															);
														}}
													/>
												</Flex>
												<Flex
													vertical={true}
													gap={10}
													style={{ flex: 1 }}
												>
													<Typography.Text>
														{__('Tags', 'quillcrm')}
													</Typography.Text>
													<TagField
														value={
															settings?.tags || []
														}
														onChange={(value) => {
															updateSettings(
																'tags',
																value
															);
														}}
													/>
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
									loading={isActivating}
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
