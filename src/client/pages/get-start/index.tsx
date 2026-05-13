import { useState } from 'react';
import { __ } from '@wordpress/i18n';
//@ts-ignore
import decorativeLeft from '@doublescale/assets/images/decorative-elements-left.png';
//@ts-ignore
import decorativeRight from '@doublescale/assets/images/decorative-elements-right.png';
import { StepIndicator } from './StepIndicator/StepIndicator';
import WelcomeStart from '@doublescale/components/icons/start-welcome';
import SettingsIcon from '@doublescale/components/icons/settings';
import BusinessInfo from '@doublescale/components/icons/start-businessinfo';
import StartList from '@doublescale/components/icons/start-list';
import StartTag from '@doublescale/components/icons/start-tags';
import StartContact from '@doublescale/components/icons/start-contact';
import StartComplete from '@doublescale/components/icons/start-complete';
import WelcomePage from './WelcomePage/WelcomePage';
import ModulesStep from './Modules/Modules';
import BusindessInformation from './BusinessInformation/BusindessInformation';
import Tags from './Tags/Tags';
import Lists from './Lists/Lists';
import Contacts from './Contacts/Contacts';
import PluginComplete from './Plugins/Plugins';
import EndStep from './EndStep/EndStep';

export default function GetStart() {
	const [currentStep, setCurrentStep] = useState(1);

	const steps = [
		{ number: 1, label: __('Welcome to our system', 'doublescale'), icon: <WelcomeStart /> },
		{ number: 2, label: __('Modules', 'doublescale'), icon: <SettingsIcon /> },
		{ number: 3, label: __('Business Info', 'doublescale'), icon: <BusinessInfo /> },
		{ number: 4, label: __('Lists', 'doublescale'), icon: <StartList /> },
		{ number: 5, label: __('Tags', 'doublescale'), icon: <StartTag /> },
		{ number: 6, label: __('Contacts', 'doublescale'), icon: <StartContact /> },
		{ number: 7, label: __('Complete', 'doublescale'), icon: <StartComplete /> },
	];

	const handleNext = () => {
		setCurrentStep((s) => Math.min(s + 1, steps.length + 1));
	};

	const handlePrevious = () => {
		setCurrentStep((s) => Math.max(s - 1, 1));
	};

	const handleSkip = () => {
		setCurrentStep((s) => s + 1);
	};

	if (currentStep === steps.length + 1) {
		return <EndStep />;
	}

	return (
		<div className="doublescale-get-start flex flex-col lg:flex-row -mx-4 -my-4 lg:-mx-8 lg:-my-6 min-h-[calc(100vh-80px)] bg-white">
			<aside className="w-full shrink-0 overflow-x-auto overscroll-x-contain border-b border-primary/20 bg-[#EEF] max-lg:snap-x max-lg:snap-mandatory lg:sticky lg:top-0 lg:h-screen lg:w-72 lg:self-start lg:snap-none lg:overflow-x-visible lg:overflow-y-auto lg:border-b-0">
				<div className="flex w-max min-w-full flex-row flex-nowrap gap-3 p-4 lg:w-full lg:min-w-0 lg:flex-col lg:flex-nowrap lg:gap-4 lg:p-6">
					{steps.map((step, index) => (
						<StepIndicator
							key={step.number}
							step={step.number}
							currentStep={currentStep}
							label={step.label}
							icon={step.icon}
							isLast={index === steps.length - 1}
						/>
					))}
				</div>
			</aside>
             {/* right side */}
			<div className="relative flex min-h-0 flex-1 min-w-0 flex-col p-6 m-6 rounded-[20px] bg-[#F7F8FA] shadow-[0px_4px_20px_0px_rgba(59,130,246,0.14)] overflow-hidden">
				{/* decorative corner images — sit behind content on every step */}
				<img
					src={decorativeLeft}
					alt=""
					aria-hidden="true"
					decoding="async"
					className="pointer-events-none absolute top-0 left-0 w-56 xl:w-72 select-none"
				/>
				<img
					src={decorativeRight}
					alt=""
					aria-hidden="true"
					decoding="async"
					className="pointer-events-none absolute top-0 right-0 w-56 xl:w-72 select-none"
				/>

				{/* step content sits above the decorative images */}
				<div className="relative z-10 flex min-h-0 flex-1 flex-col">
					{currentStep === 1 && (
						<WelcomePage onNext={handleNext} onSkip={handleSkip} />
					)}
					{currentStep === 2 && (
						<ModulesStep
							onNext={handleNext}
							onPrevious={handlePrevious}
							onSkip={handleSkip}
						/>
					)}
					{currentStep === 3 && (
						<BusindessInformation onNext={handleNext} onPrevious={handlePrevious} />
					)}
					{currentStep === 4 && (
						<Lists
							onNext={handleNext}
							onPrevious={handlePrevious}
							onSkip={handleSkip}
						/>
					)}
					{currentStep === 5 && (
						<Tags
							onNext={handleNext}
							onPrevious={handlePrevious}
							onSkip={handleSkip}
						/>
					)}
					{currentStep === 6 && (
						<Contacts
							onNext={handleNext}
							onPrevious={handlePrevious}
							onSkip={handleSkip}
						/>
					)}
					{currentStep === 7 && (
						<PluginComplete
							onNext={handleNext}
							onPrevious={handlePrevious}
							onSkip={handleSkip}
						/>
					)}
				</div>
			</div>
		</div>
	);
}
