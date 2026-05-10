import { Label } from '@/components/ui/label';

const FormField: React.FC<{
	label: string;
	required?: boolean;
	children: React.ReactNode;
	className?: string;
}> = ({ label, required = false, children, className }) => (
	<div style={{ marginBottom: '1rem' }} className={className}>
		<div style={{ marginBottom: '0.5rem' }}>
			<Label>{label}</Label>
			{required && <span className="text-red-500">*</span>}
		</div>
		{children}
	</div>
);

export default FormField;
