/**
 * Tickets section — reuses the standalone support portal SPA 1:1.
 *
 * `PortalApp` (and its `views/*`) read their config from the resolver in
 * `src/renderer/support/config.ts`, which prefers the unified
 * `doublescale_client_portal_config` global. We also hand it the support-shaped
 * config prop (mailbox scope + uploader settings) that the Support module
 * injected into the portal config.
 */

import SupportPortalApp from '../../../support/app';
import type { PortalConfig as SupportPortalConfig } from '../../../support/types';
import { getPortalConfig } from '../../config';
import { EmptyState } from '../../shared/ui';

const Tickets = () => {
	const cfg = getPortalConfig();
	if (!cfg) {
		return <EmptyState title="Support unavailable" />;
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

	return <SupportPortalApp config={supportConfig} />;
};

export default Tickets;
