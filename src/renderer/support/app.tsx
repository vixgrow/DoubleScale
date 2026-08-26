/**
 * Portal SPA root.
 *
 * Logged-in customers get a split inbox: ticket list + conversation. Side-by-side
 * starts at 1200px; from `lg`–1199px the panes stack vertically so the composer
 * keeps a usable width. Below `lg`, only one pane is shown at a time.
 */

import { useCallback, useEffect, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Plus } from 'lucide-react';

import { Button } from '@/components/ui/button';

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
	initialTicketId?: number;
}

const PortalApp = ({ config, initialTicketId }: Props) => {
	const [view, setView] = useState<ViewState>(() =>
		readInitialView(config, initialTicketId)
	);
	const [selectedTicketId, setSelectedTicketId] = useState<number | null>(
		view.kind === 'detail' ? view.ticketId : null
	);
	const [showCompose, setShowCompose] = useState(false);
	const [listVersion, setListVersion] = useState(0);
	const [mobileShowDetail, setMobileShowDetail] = useState(
		view.kind === 'detail'
	);

	useEffect(() => {
		setMobileShowDetail(view.kind === 'detail');
	}, [view.kind]);

	if (view.kind === 'guest') {
		return (
			<div className="doublescale-support-portal mx-auto w-full max-w-6xl text-base">
				<GuestTicket hash={view.hash} />
			</div>
		);
	}

	const openTicket = (ticketId: number) => {
		setSelectedTicketId(ticketId);
		setView({ kind: 'detail', ticketId });
		setMobileShowDetail(true);
	};

	const backToList = () => {
		setView({ kind: 'list' });
		setMobileShowDetail(false);
	};

	const handleTicketsLoaded = useCallback(
		(ids: number[]) => {
			if (selectedTicketId && ids.includes(selectedTicketId)) {
				return;
			}
			if (selectedTicketId && !ids.includes(selectedTicketId)) {
				const nextId = ids[0] ?? null;
				setSelectedTicketId(nextId);
				if (nextId) {
					setView({ kind: 'detail', ticketId: nextId });
				} else {
					setView({ kind: 'list' });
				}
				return;
			}
			if (!selectedTicketId && ids.length > 0) {
				setSelectedTicketId(ids[0]);
				setView({ kind: 'detail', ticketId: ids[0] });
			}
		},
		[selectedTicketId]
	);

	return (
		<div className="doublescale-support-portal w-full min-w-0 overflow-x-hidden text-base">
			{/*
			 * ≥1200px: fixed-height split inbox.
			 * <1200px: detail card height follows replies + editor (page scrolls).
			 */}
			<div className="flex flex-col min-[1200px]:h-[min(92vh,1100px)] min-[1200px]:min-h-0 min-[1200px]:overflow-hidden">
				<header className="mb-4 flex shrink-0 flex-wrap items-center justify-between gap-3">
					<h2 className="m-0 text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
						{__('My Support Tickets', 'doublescale')}
					</h2>
					<Button
						variant="default"
						size="lg"
						className=""
						onClick={() => setShowCompose(true)}
					>
						<Plus width={14} height={14} className="mr-1.5" />
						{__('Create New Ticket', 'doublescale')}
					</Button>
				</header>

				<div className="flex min-h-0 flex-1 flex-col min-[1200px]:overflow-hidden">
					{/*
					 * <1200px: column (full-width composer). <lg: one pane at a time.
					 * ≥1200px: list | detail side-by-side.
					 */}
					<div className="flex min-h-0 flex-1 flex-col gap-4 min-[1200px]:h-full min-[1200px]:flex-row min-[1200px]:overflow-hidden">
						<div
							className={`support-portal-panel-shadow w-full shrink-0 overflow-hidden rounded-xl max-lg:min-h-[min(70vh,560px)] lg:max-[1199px]:h-[300px] lg:max-[1199px]:min-h-[300px] lg:max-[1199px]:max-h-[300px] min-[1200px]:h-full min-[1200px]:min-h-0 min-[1200px]:w-[min(100%,360px)] min-[1200px]:max-w-[360px] ${
								mobileShowDetail
									? 'hidden lg:block'
									: 'block'
							}`}
						>
							<aside className="flex h-full min-h-0 w-full flex-col overflow-hidden rounded-xl border border-border bg-[#F7F8FA]">
								<TicketList
									key={listVersion}
									config={config}
									variant="pane"
									selectedTicketId={selectedTicketId}
									onOpenTicket={openTicket}
									onCompose={() => setShowCompose(true)}
									onTicketsLoaded={handleTicketsLoaded}
								/>
							</aside>
						</div>

						<div
							className={`support-portal-panel-shadow min-w-0 flex-1 overflow-hidden rounded-xl border border-border bg-[#F7F8FA] max-[1199px]:h-auto min-[1200px]:min-h-0 ${
								mobileShowDetail ? 'block' : 'hidden lg:block'
							}`}
						>
							<main className="flex h-full min-h-0 w-full min-w-0 flex-col overflow-hidden rounded-xl max-[1199px]:h-auto">
								{selectedTicketId ? (
									<div className="flex h-full min-h-0 w-full min-w-0 flex-col overflow-hidden rounded-xl max-[1199px]:h-auto">
										<TicketDetail
											key={selectedTicketId}
											ticketId={selectedTicketId}
											config={config}
											variant="pane"
											showMobileBack
											onBack={backToList}
										/>
									</div>
								) : (
									<div className="flex flex-1 items-center justify-center p-6 text-center text-sm text-muted-foreground min-[1200px]:min-h-[240px]">
										{__(
											'Select a ticket to view the conversation.',
											'doublescale'
										)}
									</div>
								)}
							</main>
						</div>
					</div>
				</div>
			</div>

			{showCompose && (
				<NewTicketModal
					boxId={config.box_id}
					onClose={() => setShowCompose(false)}
					onCreated={(ticket) => {
						setShowCompose(false);
						setListVersion((v) => v + 1);
						openTicket(ticket.id);
					}}
				/>
			)}
		</div>
	);
};

export default PortalApp;
