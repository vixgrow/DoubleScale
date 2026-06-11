/**
 * Public proposal renderer config and DTOs.
 */

import type { LineItem, ProposalStatus } from '@/types/sales';

export interface ProposalRendererConfig {
	public_rest_url: string;
	lang: string;
	mount_id: string;
}

export interface PublicProposal {
	proposal_number: string;
	subject: string;
	status: ProposalStatus;
	date: string | null;
	open_till: string | null;
	currency: string;
	discount_type: string;
	discount_value: number;
	line_items: LineItem[];
	subtotal: number;
	adjustment: number;
	total: number;
	to_name: string | null;
	address: string | null;
	city: string | null;
	state: string | null;
	country: string | null;
	zip: string | null;
	email: string | null;
	phone: string | null;
	is_expired?: boolean;
	can_accept: boolean;
	can_decline: boolean;
	accepted_at: string | null;
	declined_at: string | null;
	decline_reason: string | null;
}

declare global {
	interface Window {
		doublescale_proposal_config?: ProposalRendererConfig;
	}
}
