/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import type { Settings } from '@quillcrm/client';
import { AlertIcon, Field } from '@quillcrm/components';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info } from 'lucide-react';

interface SMSSettingsProps {
	settings: Settings;
	onChange: (settings: Settings) => void;
}

const SMSSettings: React.FC<SMSSettingsProps> = ({ settings, onChange }) => {
	const { max_in_second, max_in_day } = settings.sms;

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
		<div className="sms-settings qcrm-fields">
			<div className="text-[#09090B] font-semibold text-2xl">
				{__('SMS', 'quillcrm')}
			</div>

			{/* Info Banner */}
			<Alert className="border-secondary bg-secondary/10 text-secondary flex items-center gap-2">
			<div className='text-secondary'>
				<AlertIcon width={16} height={16} />
				</div>
				<AlertDescription className="text-base text-secondary">
					{__(
						'Configure SMS sending rate limits to control message throughput and ensure reliable delivery.',
						'quillcrm'
					)}
				</AlertDescription>
			</Alert>

			<div className="flex gap-5 items-start w-full">
				<div className="w-full flex flex-col gap-5">
					<Field
						label={__('Max SMS in Second', 'quillcrm')}
						value={max_in_second}
						onChange={(value) =>
							handleFieldChange('max_in_second', value)
						}
						type="number"
						min={1}
						max={10}
					/>
					<Field
						label={__('Max SMS in Day', 'quillcrm')}
						value={max_in_day}
						onChange={(value) =>
							handleFieldChange('max_in_day', value)
						}
						type="number"
						min={1}
						max={100000}
					/>
				</div>
			</div>
		</div>
	);
};

export default SMSSettings;

