/**
 * wordpress dependencies
 */
import { __ } from '@wordpress/i18n';
/**
 * internal dependencies
 */
import { Field } from '@quillcrm/components';
import { useExportContext } from '../contexts';

const SegmentFields: React.FC = () => {
	const { selectedFields, toggleField } = useExportContext();

	const segments = [
		{ key: 'lists', label: __('Lists', 'quillcrm') },
		{ key: 'tags', label: __('Tags', 'quillcrm') },
	];

	return (
		<div className="flex flex-col gap-5">
			<div className="text-[#09090B] text-xl font-medium">
				{__('Segments', 'quillcrm')}
			</div>
			<div className="flex flex-wrap gap-8">
				{segments.map(({ key, label }) => (
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

export default SegmentFields;
