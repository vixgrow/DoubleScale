/**
 * Support module page registration.
 *
 * Mirrors `src/client/pages/booking/index.tsx`. Three pages today:
 *   - support                  → inbox (list view)
 *   - support/ticket/:id       → ticket detail (hidden in sidebar; routed via row click)
 *   - support/mailboxes        → mailbox channels and per-mailbox notifications
 *   - support/custom-fields    → ticket custom fields (Pro; free shows upsell)
 *   - support/auto-close       → auto-close inactive tickets (Pro; free shows upsell)
 *
 * All pages are gated by `requiresModule: 'support'` so they disappear from
 * the registry the moment the module is toggled off via Settings → Modules.
 *
 * The Mailboxes page lives here (a `support/*` route) rather than as a
 * tab on the global Settings page — the same convention Booking follows with
 * `booking/settings`. Feature-scoped settings sit under the feature's sidebar
 * group, and routing them through the navigation registry (which re-derives on
 * `useModulesConfigTick`) avoids the global-settings tab list, which is built
 * once and does not react to late module-config hydration.
 */

import React, { lazy, Suspense, useEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

import { registerAdminPage } from '@doublescale/navigation';

import { SupportIcon } from '@/components/support';
import { Skeleton } from '@/components/ui/skeleton';

const Inbox = lazy(() => import('./inbox'));
const TicketDetail = lazy(() => import('./ticket'));
// The Mailboxes page lives under the Support tree as a `support/*` route. Lazy
// so it only loads when an admin opens Support / Mailboxes.
const Mailboxes = lazy(() => import('./mailboxes'));
const CustomFields = lazy(() => import('./custom-fields'));
const IncomingWebhook = lazy(() => import('./incoming-webhook'));
const AutoClose = lazy(() => import('./auto-close'));
const Reports = lazy(() => import('./reports'));

const SupportPageSkeleton: React.FC = () => (
	<div className="p-6 space-y-4">
		<Skeleton className="h-8 w-64" />
		<Skeleton className="h-4 w-96" />
		<div className="grid grid-cols-3 gap-4 mt-6">
			<Skeleton className="h-40" />
			<Skeleton className="h-40" />
			<Skeleton className="h-40" />
		</div>
	</div>
);

const wrap = (Page: React.ComponentType): (() => JSX.Element) => {
	return () => {
		useEffect(() => {
			window.document.documentElement.scrollTop = 0;
		}, []);
		return (
			<Suspense fallback={<SupportPageSkeleton />}>
				<div className="doublescale-support-page-component-wrapper">
					<Page />
				</div>
			</Suspense>
		);
	};
};

registerAdminPage('support', {
	path: 'support',
	component: wrap(Inbox),
	label: __('Helpdesk', 'doublescale'),
	icon: <SupportIcon width={24} height={24} />,
	// Support is decoupled from CRM roles: only users with `view_support`
	// (the dedicated support roles + admins) reach the inbox. A CRM Manager /
	// Sales Manager / Sales Rep without a support role sees nothing here.
	requiredCapability: ['doublescale_view_support'],
	requiresModule: 'support',
});

registerAdminPage('support-ticket', {
	path: 'support/ticket/:id',
	component: wrap(TicketDetail),
	label: __('Ticket', 'doublescale'),
	hidden: true,
	icon: <SupportIcon width={24} height={24} />,
	requiredCapability: ['doublescale_view_support'],
	requiresModule: 'support',
});

registerAdminPage('support-mailboxes', {
	path: 'support/mailboxes',
	component: wrap(Mailboxes),
	label: __('Mailboxes', 'doublescale'),
	// Hidden from the auto-built sidebar list; surfaced as a submenu item under
	// the Support group in the navbar (see `src/components/navbar/index.tsx`),
	// exactly like `booking/settings`.
	hidden: true,
	icon: <SupportIcon width={24} height={24} />,
	// Support config is exclusive to the support roles (Support Manager /
	// Support Agent) and admins. CRM Manager / Sales roles get NO access unless
	// an admin also gives them a support role. The single flag below already
	// folds in the admin (manage_options) check — see AdminConfig.
	requiredCapability: ['doublescale_manage_support_settings'],
	requiresModule: 'support',
});

registerAdminPage('support-reports', {
	path: 'support/reports',
	component: wrap(Reports),
	label: __('Reports', 'doublescale'),
	hidden: true,
	icon: <SupportIcon width={24} height={24} />,
	requiredCapability: ['doublescale_view_support'],
	requiresModule: 'support',
});

registerAdminPage('support-custom-fields', {
	path: 'support/custom-fields',
	component: wrap(CustomFields),
	label: __('Custom fields', 'doublescale'),
	hidden: true,
	icon: <SupportIcon width={24} height={24} />,
	requiredCapability: ['doublescale_manage_support_settings'],
	requiresModule: 'support',
});

registerAdminPage('support-incoming-webhook', {
	path: 'support/incoming-webhook',
	component: wrap(IncomingWebhook),
	label: __('Incoming Webhook', 'doublescale'),
	hidden: true,
	icon: <SupportIcon width={24} height={24} />,
	requiredCapability: ['doublescale_manage_support_settings'],
	requiresModule: 'support',
});

registerAdminPage('support-auto-close', {
	path: 'support/auto-close',
	component: wrap(AutoClose),
	label: __('Auto close', 'doublescale'),
	hidden: true,
	icon: <SupportIcon width={24} height={24} />,
	requiredCapability: ['doublescale_manage_support_settings'],
	requiresModule: 'support',
});
