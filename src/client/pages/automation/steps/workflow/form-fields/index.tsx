/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useState, useEffect } from '@wordpress/element';
import { useDispatch, useSelect } from '@wordpress/data';

/**
 * External dependencies
 */
import { map, keys, mapValues } from 'lodash';

/**
 * Internal dependencies
 */
import './style.scss';
import ConfigAPI from '@quillcrm/config';
import type { Form } from '@quillcrm/config';
import AjaxSelect from './ajax-select';
import type { MappedFields } from '@quillcrm/client';
import { ListField, TagField, ContactMappedFields } from '@quillcrm/components';
import { Card, CardContent } from '@quillcrm/components/ui/card';
import { Label } from '@quillcrm/components/ui/label';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@quillcrm/components/ui/select';
import { Switch } from '@quillcrm/components/ui/switch';
import { Spinner } from '@quillcrm/components/ui/spinner';

interface FormFieldsProps {
	values: { [key: string]: any };
	onChange: (value: any) => void;
	values: { [key: string]: any };
	onChange: (value: any) => void;
}

const FormFields: React.FC<FormFieldsProps> = ({ values, onChange }) => {
	const [formFields, setFormFields] = useState<
		Form['fields_settings']['fields'] | null
	>(null);
	const [isFetching, setIsFetching] = useState(true);
	const {
		form_type,
		form_id,
		mapped_fields = {},
		lists = [],
		tags = [],
		update_existing_contact = false,
		update_blank_fields = false,
		mark_as_subscribed = false,
	} = values;
	const forms = ConfigAPI.getForms();
	const fieldsSettings = form_type ? forms[form_type]?.fields_settings : null;
	const { getAjaxUrl, getNonce } = ConfigAPI;
	const formOptions = form_type ? forms[form_type]?.options : {};
	const { createNotice } = useDispatch('quillcrm/core');

	const checkConditions = (conditions) => {
		if (!conditions) {
			return true;
		}

		const { relation = 'and', rules = [] } = conditions;

		for (let i = 0; i < rules.length; i++) {
			const rule = rules[i];

			if (
				!checkCondition(rule.field, rule.operator, rule.value) &&
				relation === 'and'
			) {
				return false;
			}
		}

		return true;
	};

	const checkCondition = (field, operator, value) => {
		if (!values) {
			return false;
		}

		switch (operator) {
			case '==':
				return values[field] === value;
			case '!=':
				return values[field] !== value;
			case 'contains':
				return values[field].includes(value);
			case 'not_contains':
				return !values[field].includes(value);
			case 'empty':
				return !values[field];
			case 'not_empty':
				return !!values[field];
			default:
				return false;
		}
	};

	const getFormFields = async () => {
		if (!fieldsSettings || !form_id) {
			setIsFetching(false);
			return;
		}

		try {
			const body = new FormData();
			body.append('action', fieldsSettings.action);
			body.append('nonce', getNonce());
			map(fieldsSettings.fields, (key) => {
				body.append(key, values[key] || '');
			});

			const response = await fetch(getAjaxUrl(), {
				method: 'POST',
				body,
			});

			const data = await response.json();

			if (!data.success) {
				throw new Error(data.data);
			}

			setFormFields(data.data as Form['fields_settings']['fields']);
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
	}, [form_id]);

	return (
		<div className="flex flex-col gap-5">
			<div className="qcrm-fields">
				<div className="qcrm-field mb-2 w-full">
					<div className="qcrm-field-label">
						<Label>{__('Select Form Type', 'quillcrm')}</Label>
					</div>
					<div className="qcrm-field-input">
						<Select
							value={form_type}
							onValueChange={(value) => {
								onChange({
									...values,
									form_type: value,
									form_id: null,
									mapped_fields: {},
								});
							}}
						>
							<SelectTrigger className="w-full">
								<SelectValue
									placeholder={__(
										'Select form type',
										'quillcrm'
									)}
								/>
							</SelectTrigger>
							<SelectContent>
								{map(keys(forms), (key) => (
									<SelectItem
										key={key}
										value={key}
										disabled={!forms[key].is_enabled}
									>
										{forms[key].label}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
				</div>
				{form_type &&
					map(formOptions, (options, key) => {
						const {
							type,
							label,
							ajax_action = '',
							conditions,
							parent = '',
						} = options;

						if (!checkConditions(conditions)) {
							return null;
						}

						if (parent && !values[parent]) {
							return null;
						}

						switch (type) {
							case 'ajax_select':
								return (
									<AjaxSelect
										label={label}
										ajax_action={ajax_action}
										key={key}
										parent={parent}
										slug={key}
										values={values}
										onChange={(value) => {
											onChange({
												...values,
												[key]: value,
											});
										}}
									/>
								);
							default:
								return null;
						}
					})}
				{form_type && form_id && (
					<Card>
						<CardContent className="pt-6">
							{isFetching ? (
								<div className="flex justify-center items-center py-8">
									<Spinner className="size-8" />
								</div>
							) : (
								<div className="qcrm-fields">
									<div className="qcrm-field">
										<div className="qcrm-field-label">
											<Label>
												{__('Map fields', 'quillcrm')}
											</Label>
										</div>
										{formFields && (
											<ContactMappedFields
												values={mapped_fields}
												onChange={(
													value: MappedFields
												) => {
													onChange({
														...values,
														mapped_fields: value,
													});
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
											<Label>
												{__('Contact', 'quillcrm')}
											</Label>
										</div>
										<div className="qcrm-field-input">
											<div className="flex flex-col gap-2.5">
												<div className="flex flex-col gap-2.5">
													<div className="flex flex-col gap-2.5 flex-1">
														<Label>
															{__(
																'Lists',
																'quillcrm'
															)}
														</Label>
														<ListField
															value={lists}
															onChange={(
																value
															) => {
																onChange({
																	...values,
																	lists: value,
																});
															}}
														/>
													</div>
													<div className="flex flex-col gap-2.5 flex-1">
														<Label>
															{__(
																'Tags',
																'quillcrm'
															)}
														</Label>
														<TagField
															value={tags}
															onChange={(
																value
															) => {
																onChange({
																	...values,
																	tags: value,
																});
															}}
														/>
													</div>
												</div>
												<div className="flex gap-2.5 justify-between items-center">
													<Label>
														{__(
															'Update existing contact',
															'quillcrm'
														)}
													</Label>
													<Switch
														checked={
															update_existing_contact
														}
														onCheckedChange={(
															value
														) => {
															onChange({
																...values,
																update_existing_contact:
																	value,
															});
														}}
													/>
												</div>
												<div className="flex gap-2.5 justify-between items-center">
													<Label>
														{__(
															'Update blank fields',
															'quillcrm'
														)}
													</Label>
													<Switch
														checked={
															update_blank_fields
														}
														onCheckedChange={(
															value
														) => {
															onChange({
																...values,
																update_blank_fields:
																	value,
															});
														}}
													/>
												</div>
												<div className="flex gap-2.5 justify-between items-center">
													<Label>
														{__(
															'Mark as Subscribed',
															'quillcrm'
														)}
													</Label>
													<Switch
														checked={
															mark_as_subscribed
														}
														onCheckedChange={(
															value
														) => {
															onChange({
																...values,
																mark_as_subscribed:
																	value,
															});
														}}
													/>
												</div>
											</div>
										</div>
									</div>
								</div>
							)}
						</CardContent>
					</Card>
				)}
			</div>
		</div>
	);
};

export default FormFields;
