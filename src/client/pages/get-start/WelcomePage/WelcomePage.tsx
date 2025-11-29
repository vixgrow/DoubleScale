
import welcomepage from '@quillcrm/assets/images/get-start/welcomepage.png';
import ButtonComponent from '../component/button';
export default function WelcomePage({ onNext, onSkip}) {
  return (
    <div className=' flex flex-col gap-12'>
      {/* image */}
     <div className='flex flex-col items-center justify-center gap-5'>
       <div className=' w-full flex flex-col justify-center items-center !py-0'>
        <img src={welcomepage} alt=" welcomepage" />
        <h3 className=' text-[32px] text-[#170F49] py-3 font-semibold text-center'>Welcome to Quill CRM!</h3>
       </div>
      {/* other contact */}
      <div className=' flex flex-col justify-center items-center gap-4 text-[#777] text-xl leading-[30px]'>
        <p className=' text-center'>We’re so glad you’re here. Quill CRM is your all-in-one solution for managing email marketing campaigns, automations, and customer relationships — all from your WordPress dashboard.</p>
        <p className=' text-center'>Whether you're launching your first campaign or scaling a growing business, this setup wizard will help you configure the essentials in under two minutes. It’s quick, optional, and designed to get you up and running with zero hassle.</p>
        <p className=' text-center'>Need more time? No pressure. You can skip the setup and explore the dashboard right away. Whenever you're ready, you can revisit the wizard to customize your CRM experience and unlock powerful features like contact segmentation, email campaign, and performance tracking.</p>
        <p className=' text-center'>Let’s make email marketing easier, smarter, and more personal — together.</p>
      </div>
     </div>
      {/* buttons */}
      <div className=' flex justify-between'>
        <ButtonComponent onClick={onSkip} type=''>
          Not Right Now
        </ButtonComponent>
        <ButtonComponent onClick={onNext} type='go'>
          Let’s Go!
        </ButtonComponent>
      </div>
    </div>
  )
}
