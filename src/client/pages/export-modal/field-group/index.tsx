/**
 * external dependencies
 */
import { map } from 'lodash';
/**
 * internal dependencies
 */
import { Checkbox } from '@/components/ui/checkbox';
import { useExportContext } from '../contexts';

interface FieldGroupProps {
	label: string;
	fields: Record<string, { label: string }>;
}

const FieldGroup: React.FC<FieldGroupProps> = ({ label, fields }) => {
	const { selectedFields, toggleField } = useExportContext();

	return (
		<div className="flex flex-col gap-5 mb-7">
			<div className="text-[#09090B] capitalize text-xl font-medium">
				{label}
			</div>
			<div className="flex flex-wrap gap-x-8 gap-y-4">
				{map(fields, (field, index) => (
			<div key={index} className="flex gap-2 items-center">
					<Checkbox
						checked={selectedFields.includes(index)}
						onCheckedChange={() => toggleField(index)}
					/>
						<div className="text-[#3F4254] capitalize font-semibold text-base">
							{field.label}
						</div>
					</div>
				))}
			</div>
		</div>
	);
};

export default FieldGroup;
