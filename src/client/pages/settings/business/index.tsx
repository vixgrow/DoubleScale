/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import type { Settings } from '@doublescale/client';
import { Field } from '@doublescale/components';
import ConfigAPI from '@doublescale/config';
import { BusinessLogoUpload } from '@/components/settings/business-logo-upload';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';

interface BusinessSettingsProps {
	settings: Settings;
	onChange: (settings: Settings) => void;
}

const WEEK_START_OPTIONS = [
	{ value: '0', label: __('Sunday', 'doublescale') },
	{ value: '1', label: __('Monday', 'doublescale') },
	{ value: '2', label: __('Tuesday', 'doublescale') },
	{ value: '3', label: __('Wednesday', 'doublescale') },
	{ value: '4', label: __('Thursday', 'doublescale') },
	{ value: '5', label: __('Friday', 'doublescale') },
	{ value: '6', label: __('Saturday', 'doublescale') },
];

const BusinessSettings: React.FC<BusinessSettingsProps> = ({
	settings,
	onChange,
}) => {
	const { business_name, business_address, business_logo } = settings.business;
	const weekStartsOn = settings.calendar?.week_starts_on ?? 1;

	const handleFieldChange = (key: string, value: string) => {
		const nextBusiness = {
			...settings.business,
			[key]: value,
		};
		onChange({
			...settings,
			business: nextBusiness,
		});
		if (typeof window !== 'undefined' && window.doublescaleConfig) {
			window.doublescaleConfig.business = nextBusiness;
		}
	};

	const handleWeekStartsOnChange = (value: string) => {
		const day = Number(value);
		const nextCalendar = {
			...(settings.calendar ?? { week_starts_on: 1 }),
			week_starts_on: day,
		};
		onChange({
			...settings,
			calendar: nextCalendar,
		});
		ConfigAPI.setCalendarWeekStartsOn(day);
	};

	return (
		<div className="business-settings doublescale-fields">
			<div className="text-[#09090B] font-semibold text-2xl">
				{__('Business', 'doublescale')}
			</div>
			<Field
				label={__('Business Name', 'doublescale')}
				value={business_name || ConfigAPI.getBlogName()}
				onChange={(value) => handleFieldChange('business_name', value)}
				type="text"
			/>
			<Field
				label={__('Business Address', 'doublescale')}
				value={business_address}
				onChange={(value) =>
					handleFieldChange('business_address', value)
				}
				type="textarea"
			/>
			<div className="space-y-2">
				<div className="text-sm font-medium text-foreground">
					{__('Business Logo', 'doublescale')}
				</div>
				<BusinessLogoUpload
					value={business_logo || ''}
					onChange={(url) => handleFieldChange('business_logo', url)}
				/>
			</div>

			<div className="mt-8 space-y-2 border-t border-border pt-6">
				<div className="text-[#09090B] text-lg font-semibold">
					{__('Calendar', 'doublescale')}
				</div>
				<div className="space-y-1.5">
					<label className="text-sm font-medium text-foreground">
						{__('Week starts on', 'doublescale')}
					</label>
					<p className="text-sm text-muted-foreground">
						{__(
							'Choose the first day of the week for CRM calendars on the dashboard and client portal.',
							'doublescale'
						)}
					</p>
					<Select
						value={String(weekStartsOn)}
						onValueChange={handleWeekStartsOnChange}
					>
						<SelectTrigger className="h-11 max-w-sm rounded-lg">
							<SelectValue
								placeholder={__(
									'Select a day',
									'doublescale'
								)}
							/>
						</SelectTrigger>
						<SelectContent>
							{WEEK_START_OPTIONS.map((opt) => (
								<SelectItem key={opt.value} value={opt.value}>
									{opt.label}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
			</div>
		</div>
	);
};

export default BusinessSettings;
