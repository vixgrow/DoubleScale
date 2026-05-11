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
		<div className="flex flex-col items-center max-w-2xl mx-auto text-center">
			<img
				src={welcomepage}
				alt="Welcome to DoubleScale"
				className="w-64 mb-6"
			/>

			<h1 className="text-3xl font-bold text-foreground mb-3">
				{__('Welcome to DoubleScale!', 'doublescale')}
			</h1>

			<p className="text-muted-foreground text-base leading-relaxed mb-2">
				{__(
					"Your all-in-one solution for managing email marketing campaigns, automations, and customer relationships — all from your WordPress dashboard.",
					'doublescale'
				)}
			</p>

			<p className="text-muted-foreground text-base leading-relaxed mb-8">
				{__(
					"This quick setup wizard will help you configure the essentials in under two minutes. You can skip it and come back anytime.",
					'doublescale'
				)}
			</p>

			<div className="flex items-center gap-3">
				<Button variant="outline" size="lg" onClick={onSkip}>
					{__('Skip for now', 'doublescale')}
				</Button>
				<Button size="lg" onClick={onNext}>
					{__("Let's Get Started", 'doublescale')}
					<ArrowRight size={16} className="ml-1.5" />
				</Button>
			</div>
		</div>
	);
}
