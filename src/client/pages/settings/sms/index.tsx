/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import type { Settings } from '@quillcrm/client';
import { Field } from '@quillcrm/components';
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
			<div className="text-[#09090B] font-semibold text-2xl mb-6">
				{__('SMS', 'quillcrm')}
			</div>

			{/* Info Banner */}
			<Alert className="mb-6 bg-blue-50 border-blue-200">
				<Info className="h-4 w-4 text-blue-600" />
				<AlertDescription className="text-sm text-blue-900">
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

