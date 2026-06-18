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
import WelcomePage from './WelcomePage/WelcomePage';
import ModulesStep from './Modules/Modules';
import BusindessInformation from './BusinessInformation/BusindessInformation';
import Tags from './Tags/Tags';
import Lists from './Lists/Lists';
import Contacts from './Contacts/Contacts';
import EndStep from './EndStep/EndStep';
import config from '@doublescale/config';
import {
	OPTIONAL_MARKETING_MODULE_SLUGS,
	reduceMarketingModulePending,
} from '@doublescale/shared/lib/optional-marketing-modules';

export default function GetStart() {
	const [currentStep, setCurrentStep] = useState(1);
	const [pendingModuleChanges, setPendingModuleChanges] = useState<Record<string, boolean>>(() => {
		const apiModules = config.getModules();
		const allOn: Record<string, boolean> = {};
		for (const slug of OPTIONAL_MARKETING_MODULE_SLUGS) {
			allOn[slug] = true;
		}
		return reduceMarketingModulePending(allOn, apiModules);
	});

	const steps = [
		{ number: 1, label: __('Welcome to our system', 'doublescale'), icon: <WelcomeStart /> },
		{ number: 2, label: __('Modules', 'doublescale'), icon: <SettingsIcon /> },
		{ number: 3, label: __('Business Info', 'doublescale'), icon: <BusinessInfo /> },
		{ number: 4, label: __('Lists', 'doublescale'), icon: <StartList /> },
		{ number: 5, label: __('Tags', 'doublescale'), icon: <StartTag /> },
		{ number: 6, label: __('Contacts', 'doublescale'), icon: <StartContact /> },
	];
	const totalSteps = steps.length + 1;
	const currentStepMeta = steps.find((step) => step.number === currentStep);
	const mobileProgress = Math.min((currentStep / totalSteps) * 100, 100);

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
		return <EndStep pendingModuleChanges={pendingModuleChanges} />;
	}

	return (
		<div className="doublescale-get-start flex min-h-[calc(100vh-80px)] flex-col bg-white -mx-4 -my-4 lg:-mx-8 lg:-my-6 lg:flex-row">
			<aside className="hidden w-full shrink-0 overflow-x-auto overscroll-x-contain border-b border-primary/20 bg-[#EEF] max-lg:snap-x max-lg:snap-mandatory lg:sticky lg:top-0 lg:block lg:h-screen lg:w-72 lg:self-start lg:snap-none lg:overflow-x-visible lg:overflow-y-auto lg:border-b-0">
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
			<div className="relative flex min-h-0 min-w-0 flex-1 flex-col">
				{/* Mobile compact step header (outside content card) */}
				<div className=" mt-4  bg-white lg:hidden sm:mx-6 sm:mt-6">
					<div className="flex items-center gap-2 px-4 py-3">
						<span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
							{currentStep}
						</span>
						<div className="min-w-0">
							<p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
								{`Step ${currentStep}/${totalSteps}`}
							</p>
							<p className="truncate text-sm font-semibold text-foreground">
								{currentStepMeta?.label}
							</p>
						</div>
					</div>
					<div className="h-1 w-full bg-primary/15">
						<div
							className="h-full bg-primary transition-all duration-300"
							style={{ width: `${mobileProgress}%` }}
						/>
					</div>
				</div>
				<div className="relative m-4 mt-3 flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-[20px] bg-[#F7F8FA] p-4 shadow-[0px_4px_20px_0px_rgba(59,130,246,0.14)] sm:m-6 sm:mt-4 sm:p-6">
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
							pendingModuleChanges={pendingModuleChanges}
							onPendingModuleChange={setPendingModuleChanges}
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
				</div>
			</div>
			</div>
		</div>
	);
}
