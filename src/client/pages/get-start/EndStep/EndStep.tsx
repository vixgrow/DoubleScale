import { __ } from '@wordpress/i18n';
import { Button } from '@/components/ui/button';
import { getToLink } from '@doublescale/navigation';
import { CheckCircle2, ArrowRight } from 'lucide-react';

export default function EndStep() {
	const goToDashboard = () => {
		window.location.href = getToLink('/');
	};

	return (
		<div className="flex flex-col items-center justify-center gap-5 mx-auto min-h-[60vh] text-center max-w-lg px-4">
			<div className="flex items-center justify-center w-16 h-16 rounded-full bg-emerald-50 text-emerald-500 mb-2">
				<CheckCircle2 size={32} />
			</div>

			<h3 className="text-foreground text-2xl font-semibold">
				{__("You're All Set!", 'doublescale')}
			</h3>

			<p className="text-muted-foreground text-sm leading-relaxed">
				{__(
					'Your CRM setup is complete. Start managing relationships, automating tasks, and tracking performance from your dashboard.',
					'doublescale'
				)}
			</p>

			<Button size="lg" onClick={goToDashboard}>
				{__('Go to Dashboard', 'doublescale')}
				<ArrowRight size={16} className="ml-1.5" />
			</Button>
		</div>
	);
}
