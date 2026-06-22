/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useState, useCallback } from '@wordpress/element';

/**
 * Internal dependencies
 */
import './style.scss';
import { FieldsGroup } from '@/types/booking';
import CommonInput from './common-input';
import { BiPlus } from 'react-icons/bi';
import { TrashIcon } from '@/components/booking';
import CommonNumberInput from './common-number-input';
import CommonDatepicker from './common-datepicker';
import { Editor as EmailEditor } from '@/components/booking';
import { debounce } from 'lodash';

import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';

interface QuestionInputsProps {
	fieldKey: string;
	allFields: FieldsGroup;
	onUpdate: (updatedField: any, editingFieldKey: string) => void;
	type: string;
}

const QuestionInputs: React.FC<QuestionInputsProps> = ({
	allFields,
	fieldKey,
	type,
	onUpdate,
}) => {
	const [values, setValues] = useState(() => ({
		...allFields[fieldKey],
		settings: { ...allFields[fieldKey].settings },
	}));

	const debouncedUpdate = useCallback(
		debounce((newValues: any) => {
			const updatedSettings = {
				...allFields[fieldKey].settings,
				...(newValues.settings || {}),
			};

			if (updatedSettings.min !== undefined && updatedSettings.max !== undefined) {
				const minValue = Number(updatedSettings.min);
				const maxValue = Number(updatedSettings.max);
				if (minValue >= maxValue) {
					console.error('Min must be less than max');
					return;
				}
				updatedSettings.min = minValue;
				updatedSettings.max = maxValue;
			}

			onUpdate(
				{ ...allFields[fieldKey], ...newValues, settings: updatedSettings },
				fieldKey
			);
		}, 300),
		[fieldKey, allFields, onUpdate]
	);

	const updateField = (key: string, value: any) => {
		const next = { ...values, [key]: value };
		setValues(next);
		debouncedUpdate(next);
	};

	const updateSetting = (key: string, value: any) => {
		const next = {
			...values,
			settings: { ...values.settings, [key]: value },
		};
		setValues(next);
		debouncedUpdate(next);
	};

	const options = values.settings?.options || [];

	const addOption = () => {
		const next = [...options, ''];
		updateSetting('options', next);
	};

	const removeOption = (idx: number) => {
		const next = options.filter((_: any, i: number) => i !== idx);
		updateSetting('options', next);
	};

	const updateOption = (idx: number, val: string) => {
		const next = [...options];
		next[idx] = val;
		updateSetting('options', next);
	};

	return (
		<div className="space-y-4">
			<div className="flex flex-col gap-4 md:flex-row">
				<div className="flex-1">
					<CommonInput
						required={true}
						label={__('Label', 'doublescale')}
						placeholder={__('Enter field label', 'doublescale')}
						value={values.label || ''}
						onChange={(e: any) => updateField('label', e?.target?.value ?? e)}
					/>
				</div>
				{type === 'hidden' ? (
					<div className="flex-1">
						<CommonInput
							label={__('Default Value', 'doublescale')}
							placeholder={__('Enter default value', 'doublescale')}
							value={values.defaultValue || ''}
							onChange={(e: any) => updateField('defaultValue', e?.target?.value ?? e)}
						/>
					</div>
				) : (
					<div className="flex-1">
						<CommonInput
							label={__('Helper Text', 'doublescale')}
							placeholder={__('Enter help text', 'doublescale')}
							value={values.helpText || ''}
							onChange={(e: any) => updateField('helpText', e?.target?.value ?? e)}
						/>
					</div>
				)}
			</div>

			{(type === 'text' || type === 'email' || type === 'textarea') && (
				<CommonInput
					label={__('Placeholder', 'doublescale')}
					placeholder={__('Enter placeholder', 'doublescale')}
					value={values.placeholder || ''}
					onChange={(e: any) => updateField('placeholder', e?.target?.value ?? e)}
				/>
			)}

			{(type === 'select' || type === 'multiple_select' || type === 'radio' || type === 'checkbox_group') &&
				fieldKey !== 'location-select' && (
					<>
						<div className={options.length === 1 ? 'grid grid-cols-1 gap-y-2' : 'grid grid-cols-1 md:grid-cols-2 gap-y-2 gap-x-4'}>
							{options.map((opt: string, idx: number) => (
								<div key={idx} className="flex gap-2 items-center mb-1">
									<div className="flex-1">
										<CommonInput
											placeholder={__('Enter option', 'doublescale')}
											value={opt}
											onChange={(e: any) => updateOption(idx, e?.target?.value ?? e)}
										/>
									</div>
									{options.length > 1 && (
										<div className="text-[#EF4444] cursor-pointer" onClick={() => removeOption(idx)}>
											<TrashIcon width={24} height={24} />
										</div>
									)}
								</div>
							))}
						</div>
						<div
							className="w-fit cursor-pointer text-primary font-semibold flex items-center gap-2"
							onClick={addOption}
						>
							<BiPlus />
							{__('Add New Option', 'doublescale')}
						</div>
					</>
				)}

			{type === 'hidden' && (
				<CommonInput
					label={__('Name', 'doublescale')}
					placeholder={__('The value must be unique', 'doublescale')}
					value={values.name || ''}
					onChange={(e: any) => updateField('name', e?.target?.value ?? e)}
				/>
			)}

			{type === 'number' && (
				<div className="flex flex-col gap-4 md:flex-row">
					<div className="flex-1 space-y-1">
						<label className="text-sm font-medium">
							{__('Min Value', 'doublescale')}
							<span className="text-[#EF4444]">*</span>
						</label>
						<Input
							type="number"
							className="w-full"
							placeholder={__('Enter minimum value', 'doublescale')}
							value={values.settings?.min ?? ''}
							onChange={(e) => updateSetting('min', e.target.value)}
							required
						/>
					</div>
					<div className="flex-1 space-y-1">
						<label className="text-sm font-medium">
							{__('Max Value', 'doublescale')}
							<span className="text-[#EF4444]">*</span>
						</label>
						<Input
							type="number"
							className="w-full"
							placeholder={__('Enter maximum value', 'doublescale')}
							value={values.settings?.max ?? ''}
							onChange={(e) => updateSetting('max', e.target.value)}
							required
						/>
					</div>
				</div>
			)}

			{(type === 'date' || type === 'datetime') && (
				<>
					<div className="flex flex-col gap-4 md:flex-row">
						<div className="flex-1">
							<CommonInput
								label={__('Placeholder', 'doublescale')}
								placeholder={__('Enter placeholder', 'doublescale')}
								value={values.placeholder || ''}
								onChange={(e: any) => updateField('placeholder', e?.target?.value ?? e)}
							/>
						</div>
						<div className="flex-1">
							<CommonInput
								label={__('Format', 'doublescale')}
								placeholder={__('Enter format', 'doublescale')}
								value={values.settings?.format || ''}
								onChange={(e: any) => updateSetting('format', e?.target?.value ?? e)}
							/>
						</div>
					</div>
					<div className="flex flex-col gap-4 md:flex-row">
						<div className="flex-1">
							<CommonDatepicker
								label={__('Min Date', 'doublescale')}
								placeholder={__('Select minimum date', 'doublescale')}
								value={values.settings?.min}
								onChange={(val: any) => updateSetting('min', val)}
							/>
						</div>
						<div className="flex-1">
							<CommonDatepicker
								label={__('Max Date', 'doublescale')}
								placeholder={__('Select maximum date', 'doublescale')}
								value={values.settings?.max}
								onChange={(val: any) => updateSetting('max', val)}
							/>
						</div>
					</div>
				</>
			)}

			{type === 'file' && (
				<>
					<div className="flex flex-col gap-4 md:flex-row">
						<div className="flex-1">
							<CommonNumberInput
								label={__('Max File Size (MB)', 'doublescale')}
								placeholder={__('Enter maximum file size', 'doublescale')}
								value={values.settings?.maxFileSize}
								onChange={(val: any) => updateSetting('maxFileSize', val)}
							/>
						</div>
						<div className="flex-1">
							<CommonNumberInput
								label={__('Max File Count', 'doublescale')}
								placeholder={__('Enter maximum file count', 'doublescale')}
								value={values.settings?.maxFileCount}
								onChange={(val: any) => updateSetting('maxFileCount', val)}
							/>
						</div>
					</div>
					<div className="space-y-1">
						<label className="text-sm font-medium">{__('Allowed File Types', 'doublescale')}</label>
						<div className="flex flex-wrap gap-4">
							{['pdf', 'doc', 'zip', 'image'].map((ft) => (
								<div key={ft} className="flex items-center gap-1">
									<Checkbox
										className="custom-checkbox"
										checked={(values.settings?.allowedFiles || []).includes(ft)}
										onCheckedChange={(checked) => {
											const current = values.settings?.allowedFiles || [];
											const next = checked
												? [...current, ft]
												: current.filter((f: string) => f !== ft);
											updateSetting('allowedFiles', next);
										}}
									/>
									<span>{__(ft, 'doublescale')}</span>
								</div>
							))}
						</div>
					</div>
				</>
			)}

			{type === 'terms' && (
				<div className="space-y-1">
					<label className="text-sm font-medium">{__('Terms and Conditions', 'doublescale')}</label>
					<EmailEditor
						message={values.settings?.termsText ?? ''}
						onChange={(html: string) => updateSetting('termsText', html)}
						type="email"
					/>
				</div>
			)}

			{(allFields[fieldKey].group === 'system' &&
				(fieldKey === 'name' || fieldKey === 'email')) ||
			allFields[fieldKey].group === 'system' ||
			type === 'hidden' ? null : (
				<div className="flex items-center gap-2">
					<Checkbox
						className="custom-checkbox"
						checked={values.required || false}
						onCheckedChange={(checked) => updateField('required', Boolean(checked))}
					/>
					<span>{__('Required Question', 'doublescale')}</span>
				</div>
			)}
		</div>
	);
};

export default QuestionInputs;
