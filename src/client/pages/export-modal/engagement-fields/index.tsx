/**
 * wordpress dependencies
 */
import { __ } from '@wordpress/i18n';
/**
 * internal dependencies
 */
import { Field } from '@doublescale/components';
import { useExportContext } from '../contexts';

const EngagementFields: React.FC = () => {
	const { selectedFields, toggleField } = useExportContext();

	const engagementFields = [
		{ key: 'last_sent', label: __('Last Email Sent', 'doublescale') },
		{ key: 'last_opened', label: __('Last Email Opened', 'doublescale') },
		{ key: 'last_clicked', label: __('Last Email Clicked', 'doublescale') },
	];

	return (
		<div className="flex flex-col gap-5 mt-7">
			<div className="text-[#09090B] text-xl font-medium">
				{__('Engagement', 'doublescale')}
			</div>
			<div className="flex flex-wrap gap-8">
				{engagementFields.map(({ key, label }) => (
					<div key={key} className="flex items-center gap-2">
						<Field
							type="checkbox"
							value={selectedFields.includes(key)}
							onChange={() => toggleField(key)}
						/>
						<div className="text-[#3F4254] font-semibold text-base">
							{label}
						</div>
					</div>
				))}
			</div>
		</div>
	);
};

export default EngagementFields;
