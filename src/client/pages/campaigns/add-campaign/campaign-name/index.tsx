/**
 * external dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * internal dependencies
 */
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CampaignModalStep } from '@quillcrm/client';
import { useRef } from 'react';

interface CampaignNameProps {
	step: CampaignModalStep;
	setStep: (step: CampaignModalStep) => void;
	addCampaign: (campaignName: string) => void;
}

const CampaignName: React.FC<CampaignNameProps> = ({
	step,
	setStep,
	addCampaign,
}) => {
	const campaignNameRef = useRef<HTMLInputElement>(null);

	const handleSubmit = () => {
		const campaignName = campaignNameRef.current?.value || '';
		setStep(null);
		addCampaign(campaignName);
	};

	const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
		if (event.key === 'Enter') {
			handleSubmit();
		}
	};
	return (
		<Dialog
			open={step === 'campaign-name'}
			onOpenChange={() => setStep(null)}
		>
			<DialogContent className="max-w-[600px] w-full mx-auto">
				<DialogHeader>
					<DialogTitle className="text-3xl font-bold mb-1">
						{__('Campaign Name')}
					</DialogTitle>
					<DialogDescription className="text-foreground">
						{__('Enter a name for your campaign', 'quillcrm')}
					</DialogDescription>
				</DialogHeader>

				<div className="grid gap-3">
					<Label htmlFor="campaign-name">
						{__('Campaign Name', 'quillcrm')}
					</Label>
					<Input
						ref={campaignNameRef}
						id="campaign-name"
						name="campaign-name"
						placeholder={__('Enter Campaign Name', 'quillcrm')}
						onKeyDown={handleKeyDown}
					/>
				</div>

				<DialogFooter>
					<Button
						variant="gradient"
						type="submit"
						onClick={handleSubmit}
						className="w-full"
					>
						{__('Create Campaign', 'quillcrm')}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
};

export default CampaignName;
