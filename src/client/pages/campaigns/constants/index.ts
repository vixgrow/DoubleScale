import { CAMPAIGN_STATUS, CampaignStatus } from '../../../types';

export const CAMPAIGN_STATUS_COLORS: Record<CampaignStatus, string> = {
	[CAMPAIGN_STATUS.DRAFT]: 'bg-[#F8F8F8] text-gray-500 border-gray-500',
	[CAMPAIGN_STATUS.INACTIVE]: 'bg-[#F8F8F8] text-gray-500 border-gray-500',
	[CAMPAIGN_STATUS.ACTIVE]: 'bg-[#EFFFF5] text-[#16A34A] border-[#16A34A]',
	[CAMPAIGN_STATUS.SCHEDULED]:
		'bg-[#5570F129] text-secondary border-secondary',
	[CAMPAIGN_STATUS.PROCESSING]:
		'bg-[#EFFFF5] text-[#16A34A] border-[#16A34A]',
	[CAMPAIGN_STATUS.COMPLETED]: 'bg-[#EFFFF5] text-[#16A34A] border-[#16A34A]',
	[CAMPAIGN_STATUS.RESENDING]: 'bg-[#EFFFF5] text-[#16A34A] border-[#16A34A]',
	[CAMPAIGN_STATUS.PAUSED]: 'bg-orange-100 text-orange-600 border-orange-600',
	[CAMPAIGN_STATUS.CANCELLED]: 'bg-red-100 text-red-600 border-red-600',
};
