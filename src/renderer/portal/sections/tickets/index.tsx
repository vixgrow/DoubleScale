/**
 * Tickets section — reuses the standalone support portal SPA 1:1.
 *
 * `PortalApp` (and its `views/*`) read their config from the resolver in
 * `src/renderer/support/config.ts`, which prefers the unified
 * `doublescale_client_portal_config` global. We also hand it the support-shaped
 * config prop (mailbox scope + uploader settings) that the Support module
 * injected into the portal config.
 */

import { Route, Routes, useParams } from 'react-router-dom';

import SupportPortalApp from '../../../support/app';
import type { PortalConfig as SupportPortalConfig } from '../../../support/types';
import { getPortalConfig } from '../../config';
import { EmptyState } from '../../shared/ui';
import { GradientTicketsIcon } from '@doublescale/components';
import { __ } from '@wordpress/i18n';

const TicketsApp = () => {
	const { ticketId } = useParams();
	const cfg = getPortalConfig();
	if (!cfg) {
		return (
			<EmptyState
				title={__('No support tickets found yet', 'doublescale')}
				description={__('Create, track, and resolve support tickets with ease.', 'doublescale')}
				icon={<GradientTicketsIcon width={40} height={40} />}
			/>
		);
	}

	const supportConfig = {
		rest_url: cfg.rest_url || '',
		public_rest_url: cfg.public_rest_url,
		rest_root: cfg.rest_root,
		nonce: cfg.nonce,
		user: cfg.user,
		lang: cfg.lang,
		mount_id: cfg.mount_id,
		is_guest: false,
		guest_hash: '',
		box_id: cfg.box_id,
		custom_fields_enabled: cfg.custom_fields_enabled,
		attachment_limits: cfg.attachment_limits,
	} as unknown as SupportPortalConfig;

	const parsed = ticketId ? Number.parseInt(ticketId, 10) : 0;

	return (
		<SupportPortalApp
			config={supportConfig}
			initialTicketId={parsed > 0 ? parsed : undefined}
		/>
	);
};

/**
 * Mounts at `/tickets/*`. The optional `:ticketId` child route lets the
 * dashboard timeline deep-link straight into a ticket (`/tickets/123`); the
 * bare route opens the ticket list.
 */
const Tickets = () => (
	<Routes>
		<Route index element={<TicketsApp />} />
		<Route path=":ticketId" element={<TicketsApp />} />
	</Routes>
);

export default Tickets;
