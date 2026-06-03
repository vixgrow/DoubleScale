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
import NewTicketModal from './views/new-ticket-modal';

type ViewState =
	| { kind: 'list' }
	| { kind: 'detail'; ticketId: number };

const TICKET_QUERY_ARG = 'ds_support_ticket';

const readInitialView = (): ViewState => {
	if (typeof window === 'undefined') {
		return { kind: 'list' };
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
}

const PortalApp = ({ config }: Props) => {
	const [view, setView] = useState<ViewState>(readInitialView);
	const [showCompose, setShowCompose] = useState(false);
	// Bumping this key causes the list view to re-fetch (used after a new
	// ticket is created and we navigate back to the list).
	const [listVersion, setListVersion] = useState(0);

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
