/**
 * Portal SPA root.
 *
 * Three "views" managed by local state: list (default), detail (one ticket),
 * compose (new ticket modal overlay). Keeping this stateful here so the
 * presentational components stay dumb.
 */

import { useState } from '@wordpress/element';

import type { PortalConfig } from './types';
import TicketList from './views/ticket-list';
import TicketDetail from './views/ticket-detail';
import GuestTicket from './views/guest-ticket';
import NewTicketModal from './views/new-ticket-modal';

type ViewState =
	| { kind: 'list' }
	| { kind: 'detail'; ticketId: number }
	| { kind: 'guest'; hash: string };

const TICKET_QUERY_ARG = 'doublescale_support_ticket';
const TICKET_HASH_QUERY_ARG = 'doublescale_support_ticket_hash';

const readInitialView = (
	config: PortalConfig,
	initialTicketId?: number
): ViewState => {
	if (config.is_guest && config.guest_hash) {
		return { kind: 'guest', hash: config.guest_hash };
	}
	// A caller-supplied ticket id (the Client Portal timeline deep-links into a
	// specific ticket via its hash route) wins over the standalone-page
	// `?doublescale_support_ticket=` query arg below.
	if (initialTicketId && initialTicketId > 0) {
		return { kind: 'detail', ticketId: initialTicketId };
	}
	if (typeof window === 'undefined') {
		return { kind: 'list' };
	}
	const hash = new URLSearchParams(window.location.search).get(
		TICKET_HASH_QUERY_ARG
	);
	if (hash && /^[a-f0-9]{32}$/.test(hash)) {
		return { kind: 'guest', hash };
	}
	const raw = new URLSearchParams(window.location.search).get(
		TICKET_QUERY_ARG
	);
	const ticketId = raw ? Number.parseInt(raw, 10) : 0;
	if (ticketId > 0) {
		return { kind: 'detail', ticketId };
	}
	return { kind: 'list' };
};

interface Props {
	config: PortalConfig;
	/** Open straight into this ticket on mount (Client Portal deep-link). */
	initialTicketId?: number;
}

const PortalApp = ({ config, initialTicketId }: Props) => {
	const [view, setView] = useState<ViewState>(() =>
		readInitialView(config, initialTicketId)
	);
	const [showCompose, setShowCompose] = useState(false);
	// Bumping this key causes the list view to re-fetch (used after a new
	// ticket is created and we navigate back to the list).
	const [listVersion, setListVersion] = useState(0);

	if (view.kind === 'guest') {
		return (
			<div className="doublescale-support-portal text-base">
				<GuestTicket hash={view.hash} />
			</div>
		);
	}

	return (
		<div className="doublescale-support-portal text-base">
			{view.kind === 'list' && (
				<TicketList
					key={listVersion}
					config={config}
					onOpenTicket={(ticketId) => setView({ kind: 'detail', ticketId })}
					onCompose={() => setShowCompose(true)}
				/>
			)}

			{view.kind === 'detail' && (
				<TicketDetail
					ticketId={view.ticketId}
					config={config}
					onBack={() => setView({ kind: 'list' })}
				/>
			)}

			{showCompose && (
				<NewTicketModal
					boxId={config.box_id}
					onClose={() => setShowCompose(false)}
					onCreated={(ticket) => {
						setShowCompose(false);
						setListVersion((v) => v + 1);
						setView({ kind: 'detail', ticketId: ticket.id });
					}}
				/>
			)}
		</div>
	);
};

export default PortalApp;
