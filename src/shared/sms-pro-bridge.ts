/**
 * Pro-injected SMS campaign UI (set by QuillCRM-Pro before the SPA renders).
 *
 * @package DoubleScale
 */

import type { ComponentType } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import type { Campaign } from '@doublescale/client';

export interface CampaignColumnProps {
	onDelete: (id: number) => void;
	duplicate: (id: number) => void;
	navigate: (path: string) => void;
	onStatusChange?: (id: number, status: 'active' | 'draft') => void;
}

type SmsCampaignColumnsFn = (
	props: CampaignColumnProps
) => ColumnDef<Campaign>[];

export interface SendTestSMSCardProps {
	campaignId?: number;
	header?: boolean;
	description?: boolean;
	cardClassName?: string;
	buttonClassName?: string;
	buttonVariant?: 'secondary' | 'gradient';
}

export interface TwilioConfigModalProps {
	open: boolean;
	onClose: () => void;
	onSuccess: () => void | Promise<void>;
}

declare global {
	interface Window {
		doublescaleProSmsCampaigns?: {
			smsCampaignColumns?: SmsCampaignColumnsFn;
			SMSTemplateStep?: ComponentType;
			SMSDevice?: ComponentType<{ body?: string; className?: string }>;
			SendTestSMSCard?: ComponentType<SendTestSMSCardProps>;
			TwilioConfigModal?: ComponentType<TwilioConfigModalProps>;
		};
	}
}

export function getProSmsCampaignBridge():
	| Window['doublescaleProSmsCampaigns']
	| undefined {
	if (typeof window === 'undefined') {
		return undefined;
	}
	return window.doublescaleProSmsCampaigns;
}
