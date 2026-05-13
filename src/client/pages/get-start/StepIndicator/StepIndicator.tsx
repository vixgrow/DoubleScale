import { Check } from 'lucide-react';

type StepIndicatorProps = {
	step: number;
	currentStep: number;
	label: string;
	icon?: React.ReactNode;
	isLast?: boolean;
};

export const StepIndicator = ({
	step,
	currentStep,
	label,
}: StepIndicatorProps) => {
	const isActive = currentStep === step;
	const isCompleted = currentStep > step;

	return (
		<div
			className={`relative flex items-center gap-3 p-4 rounded-xl transition-colors ${
				isActive
					? 'border-2 border-primary bg-background shadow-sm after:content-[""] after:absolute after:top-1/2 after:-translate-y-1/2 after:-right-[11px] after:w-5 after:h-5 after:rotate-45 after:bg-background after:border-r-2 after:border-t-2 after:border-primary'
					: 'border-2 border-transparent'
			}`}
		>
			<div
				className={`w-7 h-7 shrink-0 rounded-full flex items-center justify-center text-xs font-semibold transition-colors ${
					isCompleted
						? 'bg-[#16A34A] text-white'
						: isActive
						? 'bg-primary text-primary-foreground'
						: 'bg-background border border-muted-foreground/30 text-muted-foreground'
				}`}
			>
				{isCompleted ? <Check size={14} /> : step}
			</div>

			<span
				className={`text-sm leading-7 font-bold transition-colors ${
					isActive
						? 'text-primary '
						: isCompleted
						? 'text-[#16A34A] '
						: 'text-muted-foreground font-medium'
				}`}
			>
				{label}
			</span>
		</div>
	);
};
