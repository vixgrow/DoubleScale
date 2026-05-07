/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * External dependencies
 */
import { map } from 'lodash';

/**
 * Internal dependencies
 */
import './style.scss';
import { useFormContext } from '../../state/context';
import ConfigAPI from '@doublescale/config';
import AjaxSelect from '../ajax-select';
import { Field } from '@doublescale/components';
import FormTypeSelector from '../form-types-cards';
import InitialShimmer from './initial-shimmer';

const Initial: React.FC = () => {
	const { form, updateForm, isLoading } = useFormContext();
	const { getForms } = ConfigAPI;
	const forms = getForms();
	const formOptions = form ? forms[form?.form_type]?.options : {};

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

	const handleFormTypeSelect = (value: string) => {
		updateForm({
			form_type: value,
			form_id: '', // Clear form_id when type changes
			post_id: undefined, // Clear post_id when type changes
		});
	};

	return (
		<div>
			{isLoading ? (
				<InitialShimmer />
			) : form ? (
				<div className="doublescale-fields">
					<div className="text-[#09090B] font-bold text-2xl">
						{__('Basic Information', 'doublescale')}
					</div>
					<div className="flex gap-5 items-start">
						<Field
							label={__('Form Name', 'doublescale')}
							value={form.name}
							onChange={(value) => {
								updateForm({
									name: value,
								});
							}}
							type="text"
							placeholder={__('Enter Form Name', 'doublescale')}
							required={true}
						/>
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
												key={`${form.form_type}-${key}`}
												parent={parent}
												slug={key}
											/>
										);
									default:
										return null;
								}
							})}
					</div>

					<div className="mt-5">
						<FormTypeSelector
							forms={forms}
							selectedType={form.form_type}
							onSelect={handleFormTypeSelect}
						/>
					</div>
				</div>
			) : null}
		</div>
	);
};

export default Initial;
