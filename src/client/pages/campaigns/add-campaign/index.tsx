/**
 * external dependencies
 */
import { __ } from '@wordpress/i18n';
import { useState } from 'react';
/**
 * internal dependencies
 */
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { GradientCampaignsIcon, NoticeBanner } from '@/components';
import { Button } from '@/components/ui/button';
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
					'max-w-[560px] gap-0 overflow-hidden rounded-2xl border-border/70 p-0 shadow-2xl',
					'sm:max-w-[560px]'
				)}
			>
				<div className="border-b border-border/70 bg-gradient-to-br from-muted/30 via-background to-background px-8 pb-6 pt-8">
					<div className="flex gap-4">
						<div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-border/60 bg-card shadow-sm">
							<span className="text-primary [&>svg]:h-6 [&>svg]:w-6">
								<GradientCampaignsIcon />
							</span>
						</div>
						<div className="min-w-0 flex-1 space-y-1.5 pr-6">
							<h2 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
								{title}
							</h2>
							<p className="text-sm leading-relaxed text-muted-foreground">
								{subtitle}
							</p>
						</div>
					</div>
				</div>

				<div className="space-y-8 px-8 py-7">
					{notice && (
						<NoticeBanner
							notice={notice}
							closeNotice={() => setNotice(null)}
						/>
					)}

					<div className="space-y-2">
						<Label
							htmlFor="doublescale-add-campaign-name"
							className="text-sm font-medium text-foreground"
						>
							{__('Internal name', 'doublescale')}
						</Label>
						<Input
							id="doublescale-add-campaign-name"
							autoComplete="off"
							placeholder={__(
								'e.g. Spring promo — enterprise segment',
								'doublescale'
							)}
							value={campaignName}
							onChange={(e) => setCampaignName(e.target.value)}
							className="h-11 rounded-xl border-border/80 bg-background text-base shadow-inner shadow-black/[0.02]"
						/>
						<p className="text-xs text-muted-foreground">
							{__(
								'Use something you will recognize in lists and analytics.',
								'doublescale'
							)}
						</p>
					</div>

					{isEmail && (
						<CampaignTypes
							selectedType={selectedType}
							onTypeChange={setSelectedType}
						/>
					)}
				</div>

				<div className="flex flex-col-reverse gap-3 border-t border-border/70 bg-muted/25 px-8 py-5 sm:flex-row sm:items-center sm:justify-end">
					<Button
						type="button"
						variant="outline"
						className="h-11 rounded-xl border-border/80 sm:min-w-[100px]"
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
						className="h-11 rounded-xl px-8 font-semibold shadow-sm sm:min-w-[160px]"
					>
						{__('Create campaign', 'doublescale')}
					</Button>
				</div>
			</DialogContent>
		</Dialog>
	);
};

export default AddCampaign;
