/**
 * Shared props for document design layouts.
 */

import type { LineItem } from '@/types/sales';

export type DocumentDesignDocType = 'invoice' | 'proposal';

export interface DocumentDesignStatusBadge {
	label: string;
	className: string;
}

export interface DocumentDesignDateRow {
	label: string;
	value: string | null | undefined;
}

export interface DocumentDesignParty {
	label: string;
	lines: string[];
	/** Business logo URL from settings; shown in template header when set. */
	logoUrl?: string;
}

export interface DocumentDesignSection {
	title: string;
	body: string;
}

export interface DocumentDesignProps {
	template: number;
	/** Optional accent override (#RRGGBB); null uses design default. */
	accentColor?: string | null;
	docType: DocumentDesignDocType;
	number: string;
	subject?: string | null;
	/** Company / From block (site name + optional address lines). */
	from?: DocumentDesignParty | null;
	statusBadges: DocumentDesignStatusBadge[];
	parties: DocumentDesignParty[];
	dates: DocumentDesignDateRow[];
	lineItems: LineItem[];
	currency: string;
	showTax?: boolean;
	subtotal: number;
	totalTax?: number;
	discountType: string;
	discountValue: number;
	adjustment: number;
	total: number;
	amountPaid?: number;
	sections?: DocumentDesignSection[];
}
