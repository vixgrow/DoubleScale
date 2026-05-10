import { CAMPAIGN_STATUS, CampaignStatus } from '../../../types';

export const CAMPAIGN_STATUS_COLORS: Record<CampaignStatus, string> = {
	[CAMPAIGN_STATUS.DRAFT]: 'bg-muted/50 text-muted-foreground border-border',
	[CAMPAIGN_STATUS.INACTIVE]: 'bg-muted/50 text-muted-foreground border-border',
	[CAMPAIGN_STATUS.ACTIVE]: 'bg-emerald-50 text-emerald-700 border-emerald-200',
	[CAMPAIGN_STATUS.SCHEDULED]:
		'bg-primary/5 text-primary border-primary/20',
	[CAMPAIGN_STATUS.PROCESSING]:
		'bg-emerald-50 text-emerald-700 border-emerald-200',
	[CAMPAIGN_STATUS.COMPLETED]: 'bg-emerald-50 text-emerald-700 border-emerald-200',
	[CAMPAIGN_STATUS.RESENDING]: 'bg-emerald-50 text-emerald-700 border-emerald-200',
	[CAMPAIGN_STATUS.PAUSED]: 'bg-amber-50 text-amber-700 border-amber-200',
	[CAMPAIGN_STATUS.CANCELLED]: 'bg-destructive/5 text-destructive border-destructive/20',
};
