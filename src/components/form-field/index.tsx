import { Label } from '../ui/label';

const FormField: React.FC<{
	label: string;
	required?: boolean;
	children: React.ReactNode;
}> = ({ label, required = false, children }) => (
	<div style={{ marginBottom: '1rem' }}>
		<div style={{ marginBottom: '0.5rem' }}>
			<Label>{label}</Label>
			{required && <span className="text-red-500">*</span>}
		</div>
		{children}
	</div>
);

export default FormField;
