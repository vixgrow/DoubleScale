import { Label } from '@/components/ui/label';

const FormField: React.FC<{
	label: string;
	required?: boolean;
	children: React.ReactNode;
	className?: string;
}> = ({ label, required = false, children, className }) => (
	<div className={`mb-4 ${className || ''}`}>
		<div className="mb-1.5">
			<Label className="text-sm font-medium text-foreground">{label}</Label>
			{required && <span className="text-destructive ml-0.5">*</span>}
		</div>
		{children}
	</div>
);

export default FormField;
