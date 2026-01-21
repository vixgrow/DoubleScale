import Field from '../field';
import Timeframe, { TimeframeValue } from '../timeframe';

interface FormSubmissionValue {
	form_ids?: string[];
	timeframe?: TimeframeValue;
}

interface FormSubmissionProps {
	options: any;
	value: FormSubmissionValue;
	onChange: (value: FormSubmissionValue) => void;
}

const FormSubmission = ({ options, value, onChange }: FormSubmissionProps) => {
	const handleFormIdsChange = (form_ids: string[]) => {
		onChange({
			...value,
			form_ids,
		});
	};

	const handleTimeframeChange = (timeframe: TimeframeValue) => {
		onChange({
			...value,
			timeframe,
		});
	};

	return (
		<>
			<Field
				type="multiselect"
				options={options}
				value={value?.form_ids || []}
				onChange={handleFormIdsChange}
				placeholder="Select forms"
			/>
			<Timeframe
				value={value?.timeframe || {}}
				onChange={handleTimeframeChange}
			/>
		</>
	);
};

export default FormSubmission;
