import { CheckTrueIcon } from '@doublescale/components';

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
			className={`relative flex max-lg:snap-start shrink-0 items-center gap-3 rounded-xl p-4 transition-colors lg:min-w-0 ${
				isActive
					? 'border-2 border-primary bg-background shadow-sm lg:after:absolute lg:after:top-1/2 lg:after:h-5 lg:after:w-5 lg:after:-translate-y-1/2 lg:after:-right-[11px] lg:after:rotate-45 lg:after:border-r-2 lg:after:border-t-2 lg:after:border-primary lg:after:bg-background lg:after:content-[""]'
					: 'border-2 border-transparent'
			}`}
		>			<div
				className={`w-7 h-7 shrink-0 rounded-full flex items-center justify-center text-xs font-semibold transition-colors ${
					isCompleted
						? 'bg-[#16A34A] text-white'
						: isActive
						? 'bg-primary text-primary-foreground'
						: 'bg-background border border-muted-foreground/30 text-muted-foreground'
				}`}
			>
				{isCompleted ? <CheckTrueIcon /> : step}
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
