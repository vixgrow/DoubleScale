/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import type { Settings } from '@doublescale/client';
import { AlertIcon, Field } from '@doublescale/components';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface SMSSettingsProps {
	settings: Settings;
	onChange: (settings: Settings) => void;
}

const SMSSettings: React.FC<SMSSettingsProps> = ({ settings, onChange }) => {
	const { max_in_second } = settings.sms;

	const handleFieldChange = (key: string, value: string) => {
		const numValue = parseInt(value, 10);

		// Validate on change
		if (isNaN(numValue) || numValue < 1) {
			return;
		}

		onChange({
			...settings,
			sms: {
				...settings.sms,
				[key]: numValue,
			},
		});
	};


	return (
		<div className="sms-settings doublescale-fields">
			<div className="text-[#09090B] font-semibold text-2xl">
				{__('SMS', 'doublescale')}
			</div>

			{/* Info Banner */}
			<Alert className="border-secondary bg-secondary/10 text-secondary flex items-center gap-2">
			<div className='text-secondary'>
				<AlertIcon width={16} height={16} />
				</div>
				<AlertDescription className="text-base text-secondary">
					{__(
						'Configure SMS sending rate limits to control message throughput and ensure reliable delivery.',
						'doublescale'
					)}
				</AlertDescription>
			</Alert>

			<div className="flex gap-5 items-start w-full">
				<div className="w-full flex flex-col gap-5">
					<Field
						label={__('Max SMS in Second', 'doublescale')}
						value={max_in_second}
						onChange={(value) =>
							handleFieldChange('max_in_second', value)
						}
						type="number"
						min={1}
						max={10}
					/>
				</div>
			</div>
		</div>
	);
};

export default SMSSettings;

