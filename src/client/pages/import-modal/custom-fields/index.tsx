/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { Switch } from '@/components/ui/switch';
import { Field } from '@doublescale/components';
import config from '@doublescale/config';
import { isProActive } from '@doublescale/hooks/use-is-pro-active';
import { ProFeatureNotice } from '@doublescale/components/pro-feature-notice';
import { useCustomFields } from '../../../hooks/use-customFields';

import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';

interface CustomField {
	key: string;
	label: string;
	type: string;
	raw_type?: string;
	group?: string;
	options?: Array<{ label: string; value: string }>;
}

interface CustomFieldsMapping {
	customFields: CustomField[];
	mapping: {
		field: string;
		assignedField: number[];
		auto: boolean;
		type?: string;
		group?: string;
		label?: string;
		options?: Array<{ label: string; value: string }>;
	}[];
	onChange: (
		value: {
			field: string;
			assignedField: number[];
			auto: boolean;
			type?: string;
			group?: string;
			label?: string;
			options?: Array<{ label: string; value: string }>;
		}[]
	) => void;
}

const CustomFieldsMapping: React.FC<CustomFieldsMapping> = ({
	customFields,
	mapping,
	onChange,
}) => {
	// Get useCustomFields hook from Pro plugin via filter
	const useCustomFieldsHook = useCustomFields('contact');

	// Use the hook if available, otherwise provide empty defaults
	const customFieldsData = useCustomFieldsHook;

	if (!isProActive()) {
		return (
			<ProFeatureNotice
				featureName={__('Custom Fields Import Mapping', 'doublescale')}
				description={__(
					'Map source custom fields to DoubleScale fields when DoubleScale Pro is active. Activate Pro to unlock this step.',
					'doublescale'
				)}
			/>
		);
	}

	// Filter DoubleScale custom fields by type to match the source field type
	const getFilteredCustomFields = (sourceFieldType: string) => {
		return customFieldsData.groups.filter(
			(cf: any) => cf.type === sourceFieldType
		);
	};

	const getOrAddFieldToMapped = (field: string) => {
		const index = mapping.findIndex((item) => item.field === field);
		if (index > -1) {
			return { ...mapping[index], index };
		}
		return { field, assignedField: [], auto: false, index: -1 };
	};

	return (
        <>
            <div
                style={{ marginBottom: 16 }}
                className='flex justify-between items-center'>
				<span>
					{__(
						'Map custom fields from source to DoubleScale custom fields',
						'doublescale'
					)}
				</span>
			</div>
            <Table>
				<TableHeader>
					<TableRow>
						<TableHead>{__('Source Custom Field', 'doublescale')}</TableHead>
						<TableHead>{__('Assign to (DoubleScale)', 'doublescale')}</TableHead>
						<TableHead>{__('Auto Create', 'doublescale')}</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{customFieldsData.loading ? (
						<TableRow>
							<TableCell colSpan={3}>
								<Skeleton className='h-6 w-full' />
							</TableCell>
						</TableRow>
					) : (
						customFields.map((record) => {
							const fieldKey = record.key;
							const filteredFields = getFilteredCustomFields(record.type);
							const options = filteredFields.map((cf: any) => ({
								label: cf.name,
								value: cf.id,
							}));
							const isAuto = getOrAddFieldToMapped(fieldKey).auto;
							return (
								<TableRow key={fieldKey}>
									<TableCell>
										<div>{record.label}</div>
										<span className='text-xs'>Type: {record.type}</span>
									</TableCell>
									<TableCell>
										{isAuto ? (
											<span>
												{__('Custom field will be created automatically', 'doublescale')}
											</span>
										) : (
											<Field
												type='multiselect'
												options={options}
												value={getOrAddFieldToMapped(fieldKey).assignedField}
												onChange={(value) => {
													const { field, index } = getOrAddFieldToMapped(fieldKey);
													if (index > -1) {
														mapping[index].assignedField = value;
														onChange([...mapping]);
													} else {
														onChange([
															...mapping,
															{
																field,
																assignedField: value,
																auto: false,
																type: record.type,
																group: record.group,
																label: record.label,
																options: record.options,
															},
														]);
													}
												}}
											/>
										)}
									</TableCell>
									<TableCell>
										<Switch
											checked={
												mapping.find((item) => item.field === fieldKey)?.auto
											}
											onCheckedChange={(value) => {
												const { field, index } = getOrAddFieldToMapped(fieldKey);
												if (index > -1) {
													mapping[index].auto = value;
													onChange([...mapping]);
												} else {
													onChange([
														...mapping,
														{
															field,
															assignedField: [],
															auto: value,
															type: record.type,
															group: record.group,
															label: record.label,
															options: record.options,
														},
													]);
												}
											}}
										/>
									</TableCell>
								</TableRow>
							);
						})
					)}
				</TableBody>
			</Table>
        </>
    );
};

export default CustomFieldsMapping;
