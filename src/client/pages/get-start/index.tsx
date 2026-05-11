import { useState } from 'react';
import { __ } from '@wordpress/i18n';
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
		{ number: 1, label: __('Welcome', 'doublescale'), icon: <WelcomeStart /> },
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
		<div className="min-h-screen flex flex-col gap-8">
			<div className="sticky top-0 z-50 bg-background">
				<div className="border border-primary/30 flex items-center justify-between p-6 rounded-xl bg-primary/5 backdrop-blur-sm">
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
			</div>

			<div className="flex-1 p-12 rounded-2xl border border-border bg-card shadow-lg">
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
	);
}
