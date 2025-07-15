import { CAMPAIGN_STATUS, CampaignStatus } from '../../../types';

export const CAMPAIGN_STATUS_COLORS: Record<CampaignStatus, string> = {
  [CAMPAIGN_STATUS.DRAFT]: 'bg-gray-100 text-gray-600',
  [CAMPAIGN_STATUS.INACTIVE]: 'bg-gray-200 text-gray-700',
  [CAMPAIGN_STATUS.ACTIVE]: 'bg-green-100 text-green-600',
  [CAMPAIGN_STATUS.SCHEDULED]: 'bg-blue-100 text-blue-600',
  [CAMPAIGN_STATUS.PROCESSING]: 'bg-amber-100 text-amber-600',
  [CAMPAIGN_STATUS.COMPLETED]: 'bg-green-200 text-green-700',
  [CAMPAIGN_STATUS.RESENDING]: 'bg-fuchsia-100 text-fuchsia-600',
  [CAMPAIGN_STATUS.PAUSED]: 'bg-orange-100 text-orange-600',
  [CAMPAIGN_STATUS.CANCELLED]: 'bg-red-100 text-red-600',
};
