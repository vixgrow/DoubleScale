
import NextStepIcon from "@doublescale/shared/icons/next-step";
export const StepIndicator = ({ step, currentStep, label, icon, isLast }) => {
  const isActive = currentStep === step;
  const isCompleted = currentStep > step;
  
  return (
    <>
      {/* Step Content */}
      <div className="flex items-center gap-2">
      <div className={`w-10 h-10 rounded-full flex items-center justify-center border text-sm font-medium transition-colors ${
             isCompleted ? 'bg-[#16A34A] text-white' : 
             isActive ? 'bg-[#458DC7] text-white' : 
             'border-[#777] text-muted-foreground'
            }`}>
              {icon}
             </div>
        
        <span className={`text-base whitespace-nowrap font-medium transition-colors ${
          isActive ? 'text-[#458DC7]' :
          isCompleted ? 'text-[#16A34A]' : 
          'text-muted-foreground'
        }`}>
          {label}
        </span>
      </div>
      
      {!isLast && (
        <div className={`shrink-0 transition-colors ${
          isActive ? 'text-[#458DC7]' :
          isCompleted ? 'text-[#16A34A]' : 
          'text-muted-foreground'
        }`}>
          <NextStepIcon/>
        </div>
      )}
    </>
  );
};