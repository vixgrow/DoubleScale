import { useState } from "react";
import { StepIndicator } from "./StepIndicator/StepIndicator";
import WelcomeStart from "@doublescale/components/icons/start-welcome";
import BusinessInfo from "@doublescale/components/icons/start-businessinfo";
import StartList from "@doublescale/components/icons/start-list";
import StartTag from "@doublescale/components/icons/start-tags";
import StartContact from "@doublescale/components/icons/start-contact";
import StartComplete from "@doublescale/components/icons/start-complete";
import WelcomePage from "./WelcomePage/WelcomePage";
import BusindessInformation from "./BusinessInformation/BusindessInformation";
import Tags from "./Tags/Tags";
import Lists from "./Lists/Lists";
import Contacts from "./Contacts/Contacts";
import PluginComplete from "./Plugins/Plugins";
import EndStep from "./EndStep/EndStep";





export default function GetStart() {
    const [currentStep, setCurrentStep] = useState(1);
   const [formData, setFormData] = useState({
    businessName: '',
    businessAddress: '',
    logo: null
  });

    const steps = [
        { number: 1, label: 'Welcome' ,icon:<WelcomeStart/> },
        { number: 2, label: 'Business Info',icon:<BusinessInfo/> },
        { number: 3, label: 'Lists' ,icon:<StartList/> },
        { number: 4, label: 'Tags',icon:<StartTag/> },
        { number: 5, label: 'Contacts',icon:<StartContact/> },
        { number: 6, label: 'Complete',icon:<StartComplete/> },
      ];

      const handleNext = () => {
        if (currentStep <= steps.length) {
          setCurrentStep(currentStep + 1);
        }
      };
    
      const handlePrevious = () => {
        if (currentStep > 1) {
          setCurrentStep(currentStep - 1);
        }
      };
    
      const handleSkip = () => {
        // setCurrentStep(steps.length);
        setCurrentStep(currentStep + 1);
      };
    
      const handleInputChange = (e) => {
        setFormData({
          ...formData,
          [e.target.name]: e.target.value
        });
      };
    
      const handleFinish = () => {
        alert('Redirecting to dashboard...');
      };
  return (
    <div className="min-h-screen flex flex-col gap-8">
      {/* Sticky Header with Progress Steps */}
      <div className="sticky top-0 z-50 bg-background">
        {/* Progress Steps */}
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
      
      {/* Main Content */}
      <div className="flex-1 p-12 rounded-2xl border border-border bg-card shadow-lg">
        {currentStep === 1 &&(
          <WelcomePage onNext={handleNext} onSkip={handleSkip} />
        )}
         {currentStep === 2 &&(
          <BusindessInformation onNext={handleNext} onPrevious={handlePrevious} />
        )}
        {currentStep === 3 &&(
          <Lists onNext={handleNext} onPrevious={handlePrevious} onSkip={handleSkip}/>
        )}
        {currentStep === 4 &&(
          <Tags onNext={handleNext} onPrevious={handlePrevious} onSkip={handleSkip}/>
        )}
        {currentStep === 5 &&(
         <Contacts onNext={handleNext} onPrevious={handlePrevious} onSkip={handleSkip}/>
        )}
        {currentStep === 6 &&(
         <PluginComplete onNext={handleNext} onPrevious={handlePrevious} onSkip={handleSkip}/>
        )}
        {currentStep === 7 &&(
         <EndStep/>
        )}
    </div>
    </div>
  )
}
