/**
 * External dependencies
 */
import { map } from 'lodash';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import './style.scss';
import Field from '../field';

type FieldType = {
	label: string;
	type: string;
	options?: {
		[key: string]: string;
	};
	multiple?: boolean;
	fields?: {
		[key: string]: FieldType;
	};
	endpoint?: string;
	settings?: {
		ajax_action?: string;
		button_text?: string;
		templateData?: Record<string, any>;
	};
	'default-value'?: string;
	tooltip?: string;
	helperText?: string;
};

type FieldsType = {
	[key: string]: FieldType;
};

interface FieldsProps {
	fields: FieldsType;
	values: { [key: string]: any };
	onChange: (value: any) => void;
	stepId?: number;
	requiredFields?: string[];
	className?: string;
}

const Fields: React.FC<FieldsProps> = ({
	fields,
	values,
	onChange,
	stepId,
	requiredFields,
	className,
}) => {
	const handleChange = (key: string, value: any) => {
		const newValues = {
			...values,
			[key]: value,
		};

		onChange(newValues);
	};

	/**
	 * Convert options object to react-select format array
	 * For most field types: { key: label } → [{ label, value: key }]
	 * For whatsapp_template: returns raw options object (component handles its own format)
	 */
	const optionsArray = (field: FieldType) => {
		// WhatsApp template field expects raw options object, not react-select format
		if (field.type === 'whatsapp_template') {
			return field.options || {};
		}

		const options = map(field.options, (label, value) => {
			return { label, value };
		});

		return options;
	};

	const processHelperText = (
		helperText: string | undefined
	): string | undefined => {
		if (!helperText || !stepId) {
			return helperText;
		}

		// Replace STEP_ID placeholder with actual step ID
		return helperText.replace(/STEP_ID/g, stepId.toString());
	};

	// Check if any field is a tab type
	const hasTabs = Object.values(fields).some(
		(field) => field.type === 'group'
	);

	if (hasTabs) {
		// Get tab fields
		const tabFields = Object.entries(fields).filter(
			([, field]) => field.type === 'group'
		);

		// Get first tab key as default
		const defaultTab = tabFields[0]?.[0] || '';

		return (
			<div className="doublescale-fields" style={{ marginBottom: '20px' }}>
				<Tabs defaultValue={defaultTab}>
					<div className="border px-5 py-3 rounded-lg">
						<TabsList className="bg-transparent text-foreground gap-3">
							{tabFields.map(([key, field]) => (
								<TabsTrigger
									key={key}
									value={key}
									className="px-3 py-2 gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
								>
									{__(field.label, 'doublescale')}
								</TabsTrigger>
							))}
						</TabsList>
					</div>

					{tabFields.map(([key, field]) => (
						<TabsContent key={key} value={key}>
							<div
								className="doublescale-tab-content"
								style={{ padding: '20px 0' }}
							>
								{field.fields &&
									map(
										field.fields,
										(tabField, tabFieldKey) => {
											return (
												<Field
													key={tabFieldKey}
													label={tabField.label}
													type={tabField.type}
													options={optionsArray(
														tabField
													)}
													value={
														values?.[tabFieldKey]
													}
													onChange={(value) =>
														handleChange(
															tabFieldKey,
															value
														)
													}
													fields={tabField.fields}
													endpoint={tabField.endpoint}
													multiple={tabField.multiple}
													settings={tabField.settings}
													allValues={values}
													tooltip={tabField.tooltip}
													defaultValue={
														tabField[
															'default-value'
														]
													}
													helperText={processHelperText(
														tabField.helperText
													)}
												/>
											);
										}
									)}
							</div>
						</TabsContent>
					))}
				</Tabs>
			</div>
		);
	}

	// Fallback to regular field rendering if no tabs
	return (
		<div
			className={className ? `doublescale-fields ${className}` : 'doublescale-fields'}
			style={{ marginBottom: className ? undefined : '20px' }}
		>
			{map(fields, (field, key) => {
				return (
					<Field
						key={key}
						label={field.label}
						type={field.type}
						options={optionsArray(field)}
						value={values?.[key]}
						onChange={(value) => handleChange(key, value)}
						fields={field.fields}
						endpoint={field.endpoint}
						multiple={field.multiple}
						settings={field.settings}
						allValues={values}
						tooltip={field.tooltip}
						defaultValue={field['default-value']}
						helperText={processHelperText(field.helperText)}
						required={requiredFields?.includes(key)}
					/>
				);
			})}
		</div>
	);
};

export default Fields;
