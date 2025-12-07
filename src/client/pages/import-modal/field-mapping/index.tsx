/**
 * wordpress dependencies
 */
import { __ } from '@wordpress/i18n';
/**
 * external dependencies
 */
import React from 'react';
/**
 * internal dependencies
 */
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import {
	ContactMappedFields,
	Field,
	ProFeatureNotice,
} from '@quillcrm/components';
import { useImportContext } from '../contexts';
import ListsMapping from '../lists-mapping';
import TagsMapping from '../tags-mapping';
import CustomFieldsMapping from '../custom-fields ';
import type { ImporterField } from '@quillcrm/config';
import {
	TooltipProvider,
	Tooltip,
	TooltipTrigger,
	TooltipContent,
} from '@/components/ui/tooltip';
import { HelpCircle } from 'lucide-react';
import { applyFilters } from '@wordpress/hooks';

interface FieldMappingProps {
	importer: any;
}

const FieldMapping: React.FC<FieldMappingProps> = ({ importer }) => {
	const { state, updateValues } = useImportContext();
	const { sourceData, values, source, fileData } = state;

	const isProActive = applyFilters('quillcrm_is_pro_active', false);

	const renderLabelWithTooltip = (label: string, tooltip: string) => {
		return (
			<span className="flex items-center gap-2">
				<span>{label}</span>
				{tooltip && (
					<TooltipProvider>
						<Tooltip>
							<TooltipTrigger asChild>
								<HelpCircle className="w-4 h-4 text-gray-400 cursor-help" />
							</TooltipTrigger>
							<TooltipContent className="z-[160000] bg-gray-100 border-none w-60 text-gray-600 text-xs">
								<p>{tooltip}</p>
							</TooltipContent>
						</Tooltip>
					</TooltipProvider>
				)}
			</span>
		);
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

	const prepareFields = (fields: string[]) => {
		return fields.reduce((acc, field) => {
			acc[field] = { label: field };
			return acc;
		}, {});
	};

	const getFieldContent = (field: ImporterField, key: string) => {
		if (!field) {
			return null;
		}

		if (field.conditions && !checkConditions(field.conditions)) {
			return null;
		}

		let fieldContent;

		switch (field.type) {
			case 'lists_mapping':
				fieldContent = (
					<ListsMapping
						lists={field.options.map((option) => option.label)}
						mapping={values[key] || []}
						onChange={(value) => updateValues(key, value)}
					/>
				);
				break;
			case 'tags_mapping':
				fieldContent = (
					<TagsMapping
						tags={field.options.map((option) => option.label)}
						mapping={values[key] || []}
						onChange={(value) => updateValues(key, value)}
					/>
				);
				break;

			case 'custom_fields_mapping':
				if (isProActive) {
					fieldContent = applyFilters(
						'quillcrm_field_mapping_custom_fields',
						field.options,
						values[key] || [],
						(value) => updateValues(key, value)
					);
				} else {
					fieldContent = (
						<ProFeatureNotice
							featureName={__(
								'Custom Fields Mapping',
								'quillcrm'
							)}
							description={__(
								'Custom fields mapping is only available in QuillCRM Pro.',
								'quillcrm'
							)}
						/>
					);
				}
				break;
			case 'select':
				fieldContent = (
					<Field
						type="select"
						value={values[key]}
						onChange={(value) => updateValues(key, value)}
						options={field.options.map((option) => ({
							label: option.label,
							value: option.key,
						}))}
					/>
				);
				break;
			case 'text':
				fieldContent = (
					<Field
						type="text"
						value={values[key]}
						onChange={(value) => updateValues(key, value)}
					/>
				);
				break;
			case 'contact_mapped_fields':
				const fields =
					source === 'csv' && fileData
						? prepareFields(fileData.header_columns)
						: field.options;
				fieldContent = (
					<ContactMappedFields
						fields={fields}
						values={values[key] || {}}
						onChange={(value) => updateValues(key, value)}
					/>
				);
				break;
			default:
				fieldContent = null;
				break;
		}

		return (
			<div key={key} className="space-y-3">
				<label className="text-base">
					{renderLabelWithTooltip(field.label, field.tooltip || '')}
				</label>
				{fieldContent}
			</div>
		);
	};

	const filteredFields = sourceData
		? Object.entries(sourceData).filter(([key, field]) => {
				if (
					source !== 'csv' &&
					source !== 'mailerlite' &&
					(field.type === 'file' ||
						field.type === 'contact_mapped_fields')
				) {
					return false;
				}

				if (
					['wpusers', 'wc_customers'].includes(source) &&
					(field.type === 'lists_mapping' ||
						field.type === 'tags_mapping')
				) {
					return false;
				}

				// HubSpot only has lists, no tags
				if (source === 'hubspot' && field.type === 'tags_mapping') {
					return false;
				}

				return true;
			})
		: [];

	if (filteredFields.length === 0) {
		return null;
	}

	return (
		<Card className="shadow-none rounded-2xl">
			<CardHeader>
				<CardTitle className="text-2xl font-normal text-[#09090B]">
					{__(`${importer.name} Data Import Tool`, 'quillcrm')}
				</CardTitle>
				<div className="text-lg text-[#71717A]">
					{source === 'csv'
						? __(
								'Select the column field you want to map it on the system to import.',
								'quillcrm'
							)
						: source === 'pipedrive'
							? __(
									'Configure how Pipedrive data will be imported into QuillCRM.',
									'quillcrm'
								)
							: __(
									'Configure how your data will be imported into QuillCRM.',
									'quillcrm'
								)}
				</div>
			</CardHeader>
			<CardContent className="space-y-6">
				{filteredFields.map(([key, field]) =>
					getFieldContent(field, key)
				)}
			</CardContent>
		</Card>
	);
};

export default FieldMapping;
