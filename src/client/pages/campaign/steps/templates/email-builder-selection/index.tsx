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
	DialogHeader,
	DialogTitle,
	DialogOverlay,
	DialogPortal,
} from '@/components/ui/dialog';
import { EnvelopeIcon, RepeatIcon } from '@/components';
import { getToLink, useNavigate } from '@doublescale/navigation';
import type { Campaign } from '@doublescale/client';

interface CampaignTypesProps {
	setVisible: (visible: boolean) => void;
	visible: boolean;
	campaign: Campaign | null;
}

const EmailBuilderSelection: React.FC<CampaignTypesProps> = ({
	setVisible,
	visible,
	campaign,
}) => {
	const navigate = useNavigate();
	const campaignTypesRows = [
		{
			label: __('Start From Scratch', 'doublescale'),
			description: __(
				'Lorem ipsum contains the typefaces more in use, an aspect that allows you to have an overview of the rendering.'
			),
			type: 'blank',
			icon: <EnvelopeIcon />,
			onClick: () => {
				navigate(getToLink(`campaigns/${campaign?.id}/builder`));
			},
		},
		{
			label: __('Choose A Pre-built Template', 'doublescale'),
			description: __(
				'Lorem ipsum contains the typefaces more in use, an aspect that allows you to have an overview of the rendering.'
			),
			type: 'pre-built',
			icon: <RepeatIcon />,
			onClick: () => {
				navigate(getToLink(`campaigns/${campaign?.id}/builder`));
			},
		},
		{
			label: __('Generate With AI', 'doublescale'),
			beta: true,
			description: __(
				'Lorem ipsum contains the typefaces more in use, an aspect that allows you to have an overview of the rendering.'
			),
			type: 'ai',
			icon: <RepeatIcon />,
			onClick: () => {
				navigate(getToLink(`campaigns/${campaign?.id}/builder`));
			},
		},
	];
	return (
		<Dialog open={visible} onOpenChange={() => setVisible(!visible)}>
			<DialogPortal>
				<DialogOverlay style={{ zIndex: 9999999 }} />
				<DialogContent
					className="max-w-[840px] w-full mx-auto"
					style={{ zIndex: 9999999 }}
				>
					<DialogHeader className="text-center sm:text-center">
						<DialogTitle className="text-3xl font-bold mb-1">
							{__(
								'Choose how you`d like to build your Email',
								'doublescale'
							)}
						</DialogTitle>
						<DialogDescription className="text-foreground">
							{__(
								'Select one of the Type to start creating your own template',
								'doublescale'
							)}
						</DialogDescription>
					</DialogHeader>
					<div className="flex gap-4">
						{campaignTypesRows.map((campaignType) => (
							<div
								className="flex flex-col justify-between items-center py-6 px-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-secondary-background hover:border-primary hover:transition-all hover:duration-300"
								key={campaignType.type}
								onClick={() => {
									campaignType.onClick();
								}}
							>
								<div className="bg-gradient-to-r from-[#1E3A8A] to-[#3B82F6] text-primary-foreground p-3 rounded-xl">
									{campaignType.icon}
								</div>
								<div className="flex items-center gap-2 w-full justify-center">
									<p className="font-semibold text-foreground text-sm my-2">
										{campaignType.label}
									</p>
									{campaignType.beta && (
										<span className="text-xs text-primary bg-secondary-background rounded-full px-2 py-1 font-semibold">
											{__('Beta', 'doublescale')}
										</span>
									)}
								</div>
								<p className="text-foreground text-sm text-center">
									{campaignType.description}
								</p>
							</div>
						))}
					</div>
				</DialogContent>
			</DialogPortal>
		</Dialog>
	);
};

export default EmailBuilderSelection;
