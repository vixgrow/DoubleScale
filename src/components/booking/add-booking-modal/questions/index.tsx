import { Fields } from '@/types/booking';
import './style.scss';
import FormField from '../inputs';

interface QuestionsComponentsProps {
	fields: Fields;
	form?: any;
}

const QuestionsComponents: React.FC<QuestionsComponentsProps> = ({
	fields,
	form,
}) => {
	const allFields = {
		...fields.system,
		...(fields.location?.['location-select']
			? { 'location-select': fields.location['location-select'] }
			: { ...(fields.location || {}) }),
		...(fields.custom || {}),
	};

	const sortedFields = Object.keys(allFields).sort(
		(a, b) => allFields[a].order - allFields[b].order
	);

	return (
		<>
			{sortedFields.map(
				(fieldKey, index) =>
					(allFields[fieldKey].enabled ||
						allFields[fieldKey].enabled === undefined) && (
						<FormField
							key={index}
							id={fieldKey}
							field={allFields[fieldKey]}
							form={form}
						/>
					)
			)}
		</>
	);
};

export default QuestionsComponents;
