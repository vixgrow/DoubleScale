//@ts-ignore
import welcomepage from '@doublescale/assets/images/get-start/welcomepage.png';
import ButtonComponent from '../component/button';
export default function WelcomePage({ onNext, onSkip}) {
  return (
    <div className="flex flex-col gap-12">
      {/* Hero Section */}
      <div className="flex flex-col items-center justify-center gap-6">
        <div className="w-full flex flex-col justify-center items-center">
          <img src={welcomepage} alt="Welcome to DoubleScale" className="max-w-md" />
          <h1 className="text-4xl font-bold text-foreground py-4 text-center">
            Welcome to DoubleScale!
          </h1>
        </div>
        
        {/* Description */}
        <div className="flex flex-col justify-center items-center gap-4 text-muted-foreground text-lg leading-relaxed max-w-4xl">
          <p className="text-center">
            We're so glad you're here. DoubleScale is your all-in-one solution for managing email marketing campaigns, automations, and customer relationships — all from your WordPress dashboard.
          </p>
          <p className="text-center">
            Whether you're launching your first campaign or scaling a growing business, this setup wizard will help you configure the essentials in under two minutes. It's quick, optional, and designed to get you up and running with zero hassle.
          </p>
          <p className="text-center">
            Need more time? No pressure. You can skip the setup and explore the dashboard right away. Whenever you're ready, you can revisit the wizard to customize your CRM experience and unlock powerful features like contact segmentation, email campaign, and performance tracking.
          </p>
          <p className="text-center font-medium text-foreground">
            Let's make email marketing easier, smarter, and more personal — together.
          </p>
        </div>
      </div>
      
      {/* Action Buttons */}
      <div className="flex justify-between items-center">
        <ButtonComponent onClick={onSkip} type="">
          Not Right Now
        </ButtonComponent>
        <ButtonComponent onClick={onNext} type="go">
          Let's Go!
        </ButtonComponent>
      </div>
    </div>
  )
}
