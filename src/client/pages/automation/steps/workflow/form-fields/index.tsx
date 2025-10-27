/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useState, useEffect } from '@wordpress/element';
import { useDispatch } from '@wordpress/data';

/**
 * External dependencies
 */
import { map, mapValues } from 'lodash';

/**
 * Internal dependencies
 */
import './style.scss';
import ConfigAPI from '@quillcrm/config';
import type { Form } from '@quillcrm/config';
import AjaxSelect from './ajax-select';
import type { MappedFields } from '@quillcrm/client';
import { Card, CardContent } from '@quillcrm/components/ui/card';
import { Spinner } from '@quillcrm/components/ui/spinner';
import MappingDialog from './mapping-dialog';

interface FormFieldsProps {
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
					<>
						{isFetching ? (
							<Card>
								<CardContent className="pt-6">
									<div className="flex justify-center items-center py-8">
										<Spinner className="size-8" />
									</div>
								</CardContent>
							</Card>
						) : (
							formFields && (
								<MappingDialog
									values={mapped_fields}
									onChange={(value: MappedFields) => {
										onChange({
											...values,
											mapped_fields: value,
										});
									}}
									onChangeAll={onChange}
									allValues={values}
									fields={mapValues(
										formFields,
										(name) => ({ label: name })
									)}
								/>
							)
						)}
					</>
				)}
			</div>
		</div>
	);
};

export default FormFields;
