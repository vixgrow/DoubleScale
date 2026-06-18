import { __ } from '@wordpress/i18n';
//@ts-ignore
import welcomepage from '@doublescale/assets/images/get-start/welcomepage.png';
import { Button } from '@/components/ui/button';

export default function WelcomePage({
	onNext,
	onSkip: _onSkip,
}: Readonly<{ onNext: () => void; onSkip: () => void }>) {
	return (
		<div className="flex min-h-0 flex-1 flex-col">
			<div className="mx-auto flex min-h-0 flex-1 flex-col items-center justify-center gap-6 overflow-y-auto text-center">
				<h1 className="text-2xl font-bold leading-9 text-foreground">
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

				<p className="max-w-4xl text-sm font-medium leading-7 text-muted-foreground lg:text-base">
					{__(
						'Your all-in-one solution for managing email marketing campaigns, automations, and customer relationships — all from your WordPress dashboard. This quick setup wizard will help you configure the essentials in under two minutes',
						'doublescale'
					)}
				</p>
			</div>

			<Button type="button" size="lg" onClick={onNext} className='hidden w-fit lg:inline-flex mx-auto '>
						{__("Let's Get Started!", 'doublescale')}
			</Button>

			<div className="z-20 lg:hidden -mx-6 -mb-6 mt-6 shrink-0 rounded-b-[20px] bg-white px-6 py-4 shadow-[0_-8px_28px_rgba(15,23,42,0.07)]">
				<div className="flex items-center justify-center gap-3 sm:gap-6">
					<Button type="button" size="lg" onClick={onNext}>
						{__("Let's Get Started!", 'doublescale')}
					</Button>
				</div>
			</div>
		</div>
	);
}
