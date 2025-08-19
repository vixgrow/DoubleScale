/**
 * wordpress dependencies
 */
import { __ } from '@wordpress/i18n';
/**
 * external dependencies
 */
import { map } from 'lodash';
/**
 * internal dependencies
 */
import ConfigAPI from '@quillcrm/config';
import { useExportContext } from '../contexts';
import FieldGroup from '../field-group';
import SegmentFields from '../segment-fields';
import EngagementFields from '../engagement-fields';

const ExportFields: React.FC = () => {
	const { isFiltering, totalContact } = useExportContext();
	const fields = ConfigAPI.getContactFieldsGroups();

	if (isFiltering || totalContact === 0) {
		return null;
	}

	return (
		<div className="rounded-2xl">
			<div
				style={{
					marginTop: '5px',
					border: '1px solid transparent',
					borderRadius: '10px',
					padding: '20px',
					marginBottom: '20px',
					backgroundImage:
						'linear-gradient(white, white), linear-gradient(90deg, #1e3a8a 61.06%, #3b82f6 100%)',
					backgroundOrigin: 'border-box',
					backgroundClip: 'padding-box, border-box',
				}}
			>
				{map(fields, (fieldGroup, index) => (
					<FieldGroup
						key={index}
						label={fieldGroup.label}
						fields={fieldGroup.fields}
					/>
				))}
				<SegmentFields />
				<EngagementFields />
			</div>
		</div>
	);
};

export default ExportFields;
