/**
 * Aggregate proposal amounts into Total / Accepted / Open summaries.
 *
 * Mirrors invoice Total / Paid / Due:
 * - Total: all proposals
 * - Accepted: status accepted (like Paid)
 * - Open: draft + sent + open, awaiting a decision (like Due). Declined excluded.
 */

export type ProposalSummaryItem = {
	status: string;
	total: number;
};

export type ProposalSummary = {
	total: number;
	accepted: number;
	open: number;
};

const OPEN_STATUSES = new Set(['draft', 'sent', 'open']);
const ACCEPTED_STATUSES = new Set(['accepted', 'approved']);

export const summarizeProposals = (
	proposals: ProposalSummaryItem[]
): ProposalSummary => {
	let total = 0;
	let accepted = 0;
	let open = 0;

	for (const proposal of proposals) {
		const amount = Number(proposal.total) || 0;
		total += amount;
		const status = (proposal.status || '').toLowerCase();
		if (ACCEPTED_STATUSES.has(status)) {
			accepted += amount;
		} else if (OPEN_STATUSES.has(status)) {
			open += amount;
		}
	}

	return { total, accepted, open };
};
