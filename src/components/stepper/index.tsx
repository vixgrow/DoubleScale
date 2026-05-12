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
	className?: string;
};

const StepperComponent: React.FC<StepperProps> = ({
	steps,
	currentStep,
	onStepClick,
	disableNavigation = false,
	className,
}) => {
	const isClickable = (index: number): boolean =>
		!disableNavigation && !!onStepClick && currentStep !== index + 1;

	return (
		<aside
			className={cn(
				'w-full shrink-0 rounded-2xl border border-border bg-[#F7F8FA] p-6 lg:w-[min(100%,260px)] lg:self-start',
				className
			)}
		>
			{steps.map((step, index) => {
				const stepNumber = index + 1;
				const isCompleted = currentStep > stepNumber;
				const isActive = currentStep === stepNumber;
				const clickable = isClickable(index);
				const isLast = index === steps.length - 1;

				return (
					<div key={step.slug} className="flex gap-2.5">
						<div className="flex flex-col items-center">
							<button
								type="button"
								disabled={!clickable}
								onClick={() => clickable && onStepClick?.(step.slug)}
								className={cn(
									'flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold transition-colors',
									isActive
										? 'bg-brandPrimary text-white'
										: isCompleted
											? 'bg-[#16A34A] text-white'
											: 'border-2 border-[#D0D5DC] bg-white text-primaryText',
									clickable ? 'cursor-pointer' : 'cursor-default'
								)}
							>
								{isCompleted ? (
									<Check className="h-3.5 w-3.5 stroke-[3]" />
								) : (
									<span>{stepNumber}</span>
								)}
							</button>
							{!isLast ? (
								<span
									className={cn(
										'my-1 h-8 w-px shrink-0 rounded-full',
										isCompleted ? 'bg-[#16A34A]' : 'bg-border'
									)}
									aria-hidden
								/>
							) : null}
						</div>
						<button
							type="button"
							disabled={!clickable}
							onClick={() => clickable && onStepClick?.(step.slug)}
							className={cn(
								'pb-3 pt-0.5 text-left font-semibold leading-7 transition-colors',
								isActive
									? 'text-[#3A3A99]'
									: isCompleted
										? 'text-[#16A34A]'
										: 'text-primaryText',
								clickable ? 'cursor-pointer' : 'cursor-default'
							)}
						>
							{step.label}
						</button>
					</div>
				);
			})}
		</aside>
	);
};

export default StepperComponent;
