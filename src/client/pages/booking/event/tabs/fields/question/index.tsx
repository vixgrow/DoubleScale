/**
 * Wordpress dependencies
 */
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import QuestionInfo from './question-info';

import QuestionActions from './question-actions';
import QuestionInputs from './question-inputs';
import { FieldsGroup } from '@/types/booking';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

interface QuestionProps {
	fieldKey: string;
	index: number;
	allFields: FieldsGroup;
	onUpdate: (updatedField: any, editingFieldKey: string) => void;
	moveField: (fieldKey: string, direction: 'up' | 'down') => void;
	removeField: (
		fieldKey: string,
		group: 'system' | 'location' | 'custom' | 'other'
	) => void;
	sortedFields: string[];
}
const Question: React.FC<QuestionProps> = ({
	fieldKey,
	allFields,
	onUpdate,
	index,
	moveField,
	removeField,
	sortedFields,
}) => {
	const [type, setType] = useState(allFields[fieldKey].type);

	return (
        <Card className="mt-4 overflow-hidden" key={fieldKey} id={`card-${fieldKey}`}><CardHeader className='flex flex-col gap-3 md:flex-row md:items-start md:justify-between'><CardTitle className="min-w-0 flex-1">{<QuestionInfo
                        allFields={allFields}
                        fieldKey={fieldKey}
                        index={index}
                        onUpdate={onUpdate}
                        setType={setType}
                    />}</CardTitle>{<QuestionActions
					allFields={allFields}
					onUpdate={onUpdate}
					fieldKey={fieldKey}
					moveField={moveField}
					removeField={removeField}
					sortedFields={sortedFields}
				/>}</CardHeader><CardContent className="min-w-0">
                <QuestionInputs
                    allFields={allFields}
                    fieldKey={fieldKey}
                    onUpdate={onUpdate}
                    type={type}
                />
            </CardContent></Card>
    );
};

export default Question;
