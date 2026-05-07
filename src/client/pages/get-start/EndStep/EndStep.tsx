import { Button } from '@doublescale/components/ui/button'

import { useNavigate, getToLink } from '@doublescale/navigation';


export default function EndStep() {
  const navigate = useNavigate();
  const handleClick=()=>{
    navigate(getToLink('/'))
  }
  return (
    <div className='flex flex-col justify-center items-center gap-3 mx-auto min-h-[60vh] text-center px-4'>
      <h3 className="text-[#170F49] text-[32px] font-semibold">
         You're All Set—Start Using Your CRM with Confidence
        </h3>
        <p className="text-[#777] text-lg font-normal leading-7 text-center">
        Your CRM setup is complete—now it’s time to explore, connect, and grow. With contacts, deals, and plugins in place, you’re ready to manage relationships, automate tasks, and track performance all in one dashboard.
        </p>
        <Button className=' bg-[#1E3A8A] text-[#FFF] rounded-[8px] py-3 px-24' onClick={handleClick}>
          Go To Dashboard
        </Button>
    </div>
  )
}
