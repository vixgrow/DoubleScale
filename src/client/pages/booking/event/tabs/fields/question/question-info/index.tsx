/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

import { FieldsGroup } from '@/types/booking';
import { TagComponent } from '@/components/booking';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface QuestionInfoProps {
	fieldKey: string;
	index: number;
	allFields: FieldsGroup;
	onUpdate: (updatedField: any, editingFieldKey: string) => void;
	setType: (type: string) => void;
}
const QuestionInfo: React.FC<QuestionInfoProps> = ({
	fieldKey,
	index,
	allFields,
	onUpdate,
	setType,
}) => {
	return (
        <div className="flex items-center gap-8">
            <p className="font-medium text-xl">
				{__('Question', 'doublescale')} {`(${index + 1})`}
			</p>
            <div>
				<Select
                    defaultValue={allFields[fieldKey].type}
                    onValueChange={(value) => {
						const updatedField = {
							...allFields[fieldKey],
							type: value,
						};

						if (value === 'number') {
							updatedField.settings = {
								...updatedField.settings,
								min: 0,
								max: 100,
							};
						}

						if (
							value === 'select' ||
							value === 'multiple_select' ||
							value === 'radio'
						) {
							updatedField.settings = {
								...updatedField.settings,
								options: ['Option 1', 'Option 2'],
							};
						}
						setType(value);
						onUpdate(updatedField, fieldKey);
					}}
                    disabled={
						allFields[fieldKey].group === 'system' ||
						allFields[fieldKey].group === 'location' ||
						allFields[fieldKey].group === 'other'
					} />
			</div>
            <div className="flex gap-2">
				{allFields[fieldKey].group == 'system' && (
					<TagComponent label={__('system', 'doublescale')} />
				)}

				{allFields[fieldKey].group == 'custom' && (
					<TagComponent label={__('custom', 'doublescale')} />
				)}

				{allFields[fieldKey].required && (
					<TagComponent label={__('required', 'doublescale')} />
				)}
			</div>
        </div>
    );
};

export default QuestionInfo;
