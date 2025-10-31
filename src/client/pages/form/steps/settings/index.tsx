/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useEffect, useState } from '@wordpress/element';
import { useDispatch } from '@wordpress/data';

/**
 * External dependencies
 */
import { map, mapValues } from 'lodash';

/**
 * Internal dependencies
 */
import './style.scss';
import { useFormContext } from '../../state/context';
import ConfigAPI from '@quillcrm/config';
import type { Form } from '@quillcrm/config';
import type { MappedFields } from '@quillcrm/client';
import { ListField, TagField, ContactMappedFields } from '@quillcrm/components';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import SettingsShimmer from './settings-shimmer';

const Settings: React.FC = () => {
	const { form, updateSettings, formFields, setFormFields } = useFormContext();
	const { getForms } = ConfigAPI;
	const forms = getForms();
	const fieldsSettings = form
		? forms[form?.form_type]?.fields_settings
		: null;
	const [isFetching, setIsFetching] = useState(true);
	const { getAjaxUrl, getNonce } = ConfigAPI;
	const { createNotice } = useDispatch('quillcrm/core');

	const getFormFields = async () => {
		if (!form || !fieldsSettings) {
			setIsFetching(false);
			return;
		}

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

			if (!data.success) {
				throw new Error(data.data);
			}

			const fields = data.data as Form['fields_settings']['fields'];
			setFormFields(fields);
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
	const mappedFields = settings ? settings.mapped_fields : {};

	return (
		<div>
			{form && isFetching ? (
				<SettingsShimmer />
			) : form && !isFetching ? (
				<div className="qcrm-fields">
					<div className="qcrm-field">
						{formFields && (
							<ContactMappedFields
								values={mappedFields}
								onChange={(value: MappedFields) => {
									updateSettings('mapped_fields', value);
								}}
								fields={mapValues(formFields, (name) => ({
									label: name,
								}))}
							/>
						)}
					</div>

					<div className="qcrm-field">
						<div className="text-[#09090B] font-bold text-2xl my-5">
							{__('Contact', 'quillcrm')}
						</div>
						<div className="qcrm-field-input">
							<div className="flex flex-col gap-5">
								<div className="flex justify-between gap-[10px]">
									<div className="flex flex-col gap-[10px] flex-1">
										<div className="flex text-[#09090B] font-normal text-base">
											{__('Lists', 'quillcrm')}
										</div>
										<ListField
											value={settings?.lists || []}
											onChange={(value) => {
												updateSettings('lists', value);
											}}
										/>
									</div>
									<div className="flex flex-col flex-1 gap-[10px]">
										<div className="flex text-[#09090B] font-normal text-base">
											{__('Tags', 'quillcrm')}
										</div>
										<TagField
											value={settings?.tags || []}
											onChange={(value) => {
												updateSettings('tags', value);
											}}
										/>
									</div>
								</div>

								<Card className='shadow-none pt-6'>
									<CardContent className="space-y-2">
										<div className="flex items-center justify-between">
											<Label className="text-base text-[#09090B]">
												{__(
													'Update existing contact',
													'quillcrm'
												)}
											</Label>
											<Switch
												checked={
													settings?.update_existing_contact ||
													false
												}
												onCheckedChange={(value) =>
													updateSettings(
														'update_existing_contact',
														value
													)
												}
											/>
										</div>

										<div className="flex items-center justify-between">
											<Label className="text-base text-[#09090B]">
												{__(
													'Update blank fields',
													'quillcrm'
												)}
											</Label>
											<Switch
												checked={
													settings?.update_blank_fields ||
													false
												}
												onCheckedChange={(value) =>
													updateSettings(
														'update_blank_fields',
														value
													)
												}
											/>
										</div>

										<div className="flex items-center justify-between">
											<Label className="text-base text-[#09090B]">
												{__(
													'Mark as Subscribed',
													'quillcrm'
												)}
											</Label>
											<Switch
												checked={
													settings?.mark_as_subscribed ||
													false
												}
												onCheckedChange={(value) =>
													updateSettings(
														'mark_as_subscribed',
														value
													)
												}
											/>
										</div>
									</CardContent>
								</Card>
							</div>
						</div>
					</div>
				</div>
			) : null}
		</div>
	);
};

export default Settings;
