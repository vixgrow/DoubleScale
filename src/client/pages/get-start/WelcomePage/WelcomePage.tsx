import { __ } from '@wordpress/i18n';
//@ts-ignore
import welcomepage from '@doublescale/assets/images/get-start/welcomepage.png';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';

export default function WelcomePage({
	onNext,
	onSkip,
}: Readonly<{ onNext: () => void; onSkip: () => void }>) {
	return (
		<div className="flex flex-col items-center justify-center gap-6  mx-auto text-center">
			<h1 className="text-2xl  leading-9 font-bold text-foreground ">
				{__("Let's Set up Your", 'doublescale')}{' '}
				<span className="text-[#CB5301]">
					{__('New Project.', 'doublescale')}
				</span>
			</h1>

			<img
				src={welcomepage}
				alt="Welcome to DoubleScale"
				className="w-full max-w-lg"
			/>

			<p className="text-muted-foreground text-sm lg:text-base leading-7 font-medium max-w-4xl">
				{__(
					'Your all-in-one solution for managing email marketing campaigns, automations, and customer relationships — all from your WordPress dashboard. This quick setup wizard will help you configure the essentials in under two minutes'
				    ,'doublescale'
				)}
			</p>

				
				<Button  onClick={onNext}>
					{__("Let’s Get Started!", 'doublescale')}
				</Button>
		</div>
	);
}
