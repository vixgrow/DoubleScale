/**
 * external dependencies
 */
import { __ } from '@wordpress/i18n';
import { useState } from 'react';
/**
 * internal dependencies
 */
import { Dialog, DialogContent, DialogHeader } from '@/components/ui/dialog';
import { CustomDialogHeader, GradientCampaignsIcon, InfoIcon, NoticeBanner } from '@/components';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import CampaignTypes from './campaign-types';
import {
	AutomatedTriggerConfig,
	CampaignModalStep,
	CampaignType,
	NoticeMessage,
} from '@doublescale/client';
import { cn } from '@/lib/utils';

interface AddCampaignProps {
	setCampaignType: (campaignType: CampaignType) => void;
	campaignType: CampaignType;
	step: CampaignModalStep;
	setStep: (step: CampaignModalStep) => void;
	addCampaign: (
		campaignName: string,
		campaignType: CampaignType,
		triggerConfig?: AutomatedTriggerConfig
	) => Promise<{ success: boolean; error?: string }>;
	activeTab: string;
}

const AddCampaign: React.FC<AddCampaignProps> = ({
	setCampaignType,
	step,
	setStep,
	addCampaign,
	activeTab,
}) => {
	const [campaignName, setCampaignName] = useState('');
	const [selectedType, setSelectedType] = useState<CampaignType>('standard');
	const [triggerConfig, setTriggerConfig] = useState<AutomatedTriggerConfig>({
		trigger_type: 'event',
		event: { event_type: 'post_published', post_type: 'post' },
	});
	const [notice, setNotice] = useState<NoticeMessage | null>(null);
	const [isSubmitting, setIsSubmitting] = useState(false);

	const isEmail = activeTab === 'email';

	const handleSubmit = async () => {
		if (isSubmitting) {
			return;
		}

		if (!campaignName.trim()) {
			setNotice({
				type: 'error',
				message: __('Campaign name is required', 'doublescale'),
			});
			return;
		}

		if (isEmail) {
			setCampaignType(selectedType);
		}

		setIsSubmitting(true);

		try {
			const isAutomated = isEmail && selectedType === 'automated';
			const result = await addCampaign(
				campaignName,
				selectedType,
				isAutomated ? triggerConfig : undefined
			);
			if (!result.success && result.error) {
				setNotice({
					type: 'error',
					message: result.error,
				});
			} else {
				resetModal();
			}
		} finally {
			setIsSubmitting(false);
		}
	};

	const resetModal = () => {
		setStep(null);
		setCampaignName('');
		setSelectedType('standard');
		setTriggerConfig({
			trigger_type: 'event',
			event: { event_type: 'post_published', post_type: 'post' },
		});
		setNotice(null);
		setIsSubmitting(false);
	};

	const handleOpenChange = (open: boolean) => {
		if (!open) {
			resetModal();
		}
	};

	const isOpen = step === 'campaign-types';

	const title = isEmail
		? __('Create email campaign', 'doublescale')
		: __('Create SMS campaign', 'doublescale');

	const subtitle = isEmail
		? __(
				'Give your campaign a clear internal name. Only your team sees this—it keeps reporting and drafts organized.',
				'doublescale'
			)
		: __(
				'Name this SMS campaign for your workspace. Recipients never see this title.',
				'doublescale'
			);

	return (
		<Dialog open={isOpen} onOpenChange={handleOpenChange}>
			<DialogContent
				className={cn(
					'flex max-h-[90vh] max-w-5xl flex-col gap-0 overflow-hidden rounded-2xl border-border/70 p-6 shadow-2xl bg-white',
					'sm:max-w-5xl'
				)}
			>
				<DialogHeader>
					<CustomDialogHeader
						title={title}
						subtitle={subtitle}
						icon={<GradientCampaignsIcon />}
					/>
				</DialogHeader>

				<div className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto py-6">
					{notice && (
						<NoticeBanner
							notice={notice}
							closeNotice={() => setNotice(null)}
						/>
					)}

					<Card className="border-border bg-background shadow-none">
						<CardContent className="p-6">
							<div className="space-y-2">
								<Label
									htmlFor="doublescale-add-campaign-name"
									className="text-base font-medium text-foreground flex items-center gap-1 py-0"
								>
									{__('Campaign name', 'doublescale')}
									<span className="text-destructive">*</span>
								</Label>
								<Input
									id="doublescale-add-campaign-name"
									autoComplete="off"
									placeholder={__(
										'e.g. Spring promo — enterprise segment',
										'doublescale'
									)}
									value={campaignName}
									onChange={(e) =>
										setCampaignName(e.target.value)
									}
									className="h-11 rounded-xl border-border bg-white text-base shadow-inner shadow-black/[0.02] my-1"
								/>
								<p className="text-sm text-muted-foreground flex items-center gap-2">
									<InfoIcon />
									{__(
										'Use something you will recognize in lists and analytics.',
										'doublescale'
									)}
								</p>
							</div>
						</CardContent>
					</Card>

					{isEmail && (
						<Card className="border-border bg-background shadow-none">
							<CardContent className="p-6">
								<CampaignTypes
									selectedType={selectedType}
									onTypeChange={setSelectedType}
								/>
							</CardContent>
						</Card>
					)}
				</div>

				<div className="flex shrink-0 flex-col-reverse gap-3 pt-6 sm:flex-row sm:items-center sm:justify-end">
					<Button
						type="button"
						variant="outline"
						className="h-10 rounded-lg border-border bg-white sm:min-w-[100px]"
						onClick={() => resetModal()}
					>
						{__('Cancel', 'doublescale')}
					</Button>
					<Button
						type="button"
						variant="default"
						size="lg"
						onClick={handleSubmit}
						disabled={!campaignName.trim() || isSubmitting}
						className="h-10 rounded-lg px-8 font-semibold shadow-sm sm:min-w-[160px]"
					>
						{__('Create campaign', 'doublescale')}
					</Button>
				</div>
			</DialogContent>
		</Dialog>
	);
};

export default AddCampaign;
