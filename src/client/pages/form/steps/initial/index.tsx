/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * External dependencies
 */
import { Button, Input, Card, Typography, Select } from 'antd';
import { map, keys } from 'lodash';

/**
 * Internal dependencies
 */
import './style.scss';
import { useFormContext } from '../../state/context';
import { useNavigate, getToLink } from '@quillcrm/navigation';
import ConfigAPI from '@quillcrm/config';
import AjaxSelect from '../ajax-select';

const Initial: React.FC = () => {
	const { form, updateForm, isLoading, saveForm, isSaving } =
		useFormContext();
	const navigate = useNavigate();
	const { getForms } = ConfigAPI;
	const forms = getForms();
	const formOptions = form ? forms[form?.form_type]?.options : {};

	const save = async () => {
		if (!form) {
			return;
		}

		try {
			await saveForm();
			navigate(getToLink(`forms/${form.id}/settings`));
		} catch (error) {
			console.error(error);
		}
	};

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
		if (!form) {
			return false;
		}

		switch (operator) {
			case '==':
				return form[field] === value;
			case '!=':
				return form[field] !== value;
			case 'contains':
				return form[field].includes(value);
			case 'not_contains':
				return !form[field].includes(value);
			case 'empty':
				return !form[field];
			case 'not_empty':
				return !!form[field];
			default:
				return false;
		}
	};

	return (
		<Card loading={isLoading}>
			{form && (
				<>
					<div className="qcrm-fields">
						<div className="qcrm-field">
							<div className="qcrm-field-label">
								<Typography.Text>
									{__('Name', 'quillcrm')}
								</Typography.Text>
							</div>
							<div className="qcrm-field-input">
								<Input
									value={form.name}
									onChange={(e) => {
										updateForm({
											name: e.target.value,
										});
									}}
								/>
							</div>
						</div>
						<div
							className="qcrm-field"
							style={{
								flexDirection: 'row',
								alignItems: 'center',
								marginBottom: 20,
							}}
						>
							<div className="qcrm-field-label">
								<Typography.Text>
									{__('Select Form Type', 'quillcrm')}
								</Typography.Text>
							</div>
							<div className="qcrm-field-input">
								<Select
									style={{ width: 200 }}
									value={form.form_type}
									onChange={(value) => {
										updateForm({
											form_type: value,
										});
									}}
									options={map(keys(forms), (key) => ({
										value: key,
										label: forms[key].label,
									}))}
								/>
							</div>
						</div>
						{form.form_type &&
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

								if (parent && !form[parent]) {
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
											/>
										);
									default:
										return null;
								}
							})}
					</div>
					<div className="qcrm-actions">
						<Button
							type="primary"
							loading={isSaving}
							onClick={save}
						>
							{__('Next', 'quillcrm')}
						</Button>
					</div>
				</>
			)}
		</Card>
	);
};

export default Initial;
