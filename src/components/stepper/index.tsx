import TwoArrows from '../icons/two-arrows';

type Step = {
	label: string;
	slug: string;
};

type Stepper = {
	steps: Step[];
	canProceed: string;
	currentStep: number;
};

const StepperComponent: React.FC<Stepper> = ({
	steps,
	canProceed,
	currentStep,
}) => {
	return (
		<div className="flex items-center justify-center gap-6 w-full py-4">
			{steps.map((step, index) => (
				<>
					<div
						key={index}
						className="flex items-center justify-center gap-2"
					>
						<div
							className={`rounded-full border border-gray w-[30px] h-[30px] flex justify-center items-center ${currentStep == index + 1 && 'border-[#3B82F6] bg-[#3B82F6] text-white font-semibold'} ${currentStep > index + 1 && 'text-[#16A34A] font-semibold'}`}
						>
							{index > 9 ? index + 1 : `0${index + 1}`}
						</div>
						<div
							className={`${currentStep == index + 1 && 'text-[#3B82F6] font-semibold'} ${currentStep > index + 1 && 'text-[#16A34A] font-semibold'}`}
						>
							{step.label}
						</div>
					</div>
					<div
						className={`text-gray ${currentStep > index + 1 && 'text-[#16A34A]'}`}
					>
						{steps.length > index + 1 && <TwoArrows />}
					</div>
				</>
			))}
		</div>
	);
};

export default StepperComponent;
