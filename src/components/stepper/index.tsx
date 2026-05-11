import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

type Step = {
	label: string;
	slug: string;
};

type StepperProps = {
	steps: Step[];
	canProceed: string;
	currentStep: number;
	onStepClick?: (slug: string) => void;
	disableNavigation?: boolean;
};

const StepperComponent: React.FC<StepperProps> = ({
	steps,
	currentStep,
	onStepClick,
	disableNavigation = false,
}) => {
	const isClickable = (index: number): boolean =>
		!disableNavigation && !!onStepClick && currentStep !== index + 1;

	return (
		<div className="flex items-center justify-center w-full py-5 px-6">
			{steps.map((step, index) => {
				const stepNumber = index + 1;
				const isCompleted = currentStep > stepNumber;
				const isActive = currentStep === stepNumber;
				const clickable = isClickable(index);

				return (
					<div key={step.slug} className="flex items-center">
						<button
							type="button"
							disabled={!clickable}
							onClick={() => clickable && onStepClick?.(step.slug)}
							className={cn(
								'group flex items-center gap-2.5 focus:outline-none',
								clickable ? 'cursor-pointer' : 'cursor-default'
							)}
						>
							{/* Circle indicator */}
							<div
								className={cn(
									'flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 text-xs font-semibold transition-all duration-200',
									isCompleted
										? 'border-emerald-500 bg-emerald-500 text-white'
										: isActive
											? 'border-primary bg-primary text-primary-foreground shadow-sm shadow-primary/30'
											: 'border-border bg-background text-muted-foreground'
								)}
							>
								{isCompleted ? (
									<Check className="h-3.5 w-3.5 stroke-[3]" />
								) : (
									<span>{stepNumber}</span>
								)}
							</div>

							{/* Label */}
							<span
								className={cn(
									'text-sm font-medium tracking-tight transition-colors duration-200',
									isCompleted
										? 'text-emerald-600'
										: isActive
											? 'font-semibold text-primary'
											: 'text-muted-foreground',
									clickable && 'group-hover:text-foreground'
								)}
							>
								{step.label}
							</span>
						</button>

						{/* Connector line */}
						{index < steps.length - 1 && (
							<div className="mx-4 flex items-center">
								<div
									className={cn(
										'h-px w-10 shrink-0 rounded-full transition-colors duration-200',
										isCompleted ? 'bg-emerald-400' : 'bg-border'
									)}
								/>
							</div>
						)}
					</div>
				);
			})}
		</div>
	);
};

export default StepperComponent;
