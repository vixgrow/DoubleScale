/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import type { Settings } from '@doublescale/client';
import { Field } from '@doublescale/components';
import {
	RadioGroup,
	RadioGroupItem,
} from '@doublescale/components/ui/radio-group';
import { Label } from '@doublescale/components/ui/label';
import { Switch } from '@doublescale/components/ui/switch';

interface WebsiteTrackingSettingsProps {
	settings: Settings;
	onChange: (settings: Settings) => void;
}

const WebsiteTrackingSettings: React.FC<WebsiteTrackingSettingsProps> = ({
	settings,
	onChange,
}) => {
	const {
		enabled = true,
		retention_type = 'days',
		retention_days = '30',
	} = settings.website_tracking || {};

	const handleFieldChange = (key: string, value: string | boolean) => {
		onChange({
			...settings,
			website_tracking: {
				...settings.website_tracking,
				[key]: value,
			},
		});
	};

	return (
		<div className="website-tracking-settings doublescale-fields">
			<div className="text-[#09090B] font-semibold text-2xl mb-6">
				{__('Website Tracking', 'doublescale')}
			</div>

			{/* Enable Website Tracking Toggle */}
			<div className="flex items-center justify-between pb-5 border-b mb-6">
				<div className="flex-1">
					<Label className="text-[#09090B] font-medium text-base">
						{__('Enable Website Tracking', 'doublescale')}
					</Label>
					<p className="text-sm text-gray-500 mt-1">
						{__(
							'Track page visits for contacts on your website',
							'doublescale'
						)}
					</p>
				</div>
				<Switch
					checked={enabled}
					onCheckedChange={(checked) => {
						if (!checked) {
							// Set values to null when disabled
							onChange({
								...settings,
								website_tracking: {
									enabled: false,
									retention_type: settings.website_tracking?.retention_type || null,
									retention_days: settings.website_tracking?.retention_days || null,
								},
							});
						} else {
							// When enabling, set retention_type to 'never' by default
							onChange({
								...settings,
								website_tracking: {
									...settings.website_tracking,
									enabled: true,
									retention_type:
										settings.website_tracking
											?.retention_type || 'never',
								},
							});
						}
					}}
				/>
			</div>

			{/* Data Retention Settings - Only show when enabled */}
			{enabled && (
				<div className="space-y-4">
					<div>
						<Label className="text-[#09090B] font-medium text-base">
							{__('Data Retention', 'doublescale')}
						</Label>
						<p className="text-sm text-gray-500 mt-1">
							{__(
								'Configure how long page visit data should be stored',
								'doublescale'
							)}
						</p>
					</div>

					<RadioGroup
						value={retention_type || 'days'}
						onValueChange={(value) =>
							handleFieldChange('retention_type', value)
						}
					>
						<div className="space-y-4">
							{/* Specific Days Option */}
							<div className="flex items-start space-x-3">
								<RadioGroupItem
									value="days"
									id="radio-days"
									className="mt-1"
								/>
								<div className="flex-1">
									<Label
										htmlFor="radio-days"
										className="font-normal cursor-pointer"
									>
										{__(
											'Delete after specific days',
											'doublescale'
										)}
									</Label>
									{retention_type === 'days' && (
										<div className="mt-3 max-w-xs">
											<Field
												label={__(
													'Number of Days',
													'doublescale'
												)}
												value={retention_days || '30'}
												onChange={(value) =>
													handleFieldChange(
														'retention_days',
														value
													)
												}
												type="number"
												placeholder="30"
												helperText={__(
													'Page visits older than this many days will be automatically deleted',
													'doublescale'
												)}
											/>
										</div>
									)}
								</div>
							</div>

							{/* Never Delete Option */}
							<div className="flex items-center space-x-3">
								<RadioGroupItem
									value="never"
									id="radio-never"
								/>
								<Label
									htmlFor="radio-never"
									className="font-normal cursor-pointer"
								>
									{__(
										'Never delete (keep forever)',
										'doublescale'
									)}
								</Label>
							</div>
						</div>
					</RadioGroup>
				</div>
			)}
		</div>
	);
};

export default WebsiteTrackingSettings;
