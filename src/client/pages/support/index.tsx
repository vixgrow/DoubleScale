/**
 * Support module page registration.
 *
 * Mirrors `src/client/pages/booking/index.tsx`. Three pages today:
 *   - support               → inbox (list view)
 *   - support/ticket/:id    → ticket detail (hidden in sidebar; routed via row click)
 *   - support/settings      → module settings (mailboxes + notifications)
 *
 * All pages are gated by `requiresModule: 'support'` so they disappear from
 * the registry the moment the module is toggled off via Settings → Modules.
 *
 * The Support settings page lives here (a `support/*` route) rather than as a
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
// The settings panel already exists under the settings tree; we reuse it as a
// support/* route instead of a global Settings tab. Lazy so it only loads when
// an admin opens Support → Settings.
const SupportSettings = lazy(() => import('../settings/support'));

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
	label: __('Support', 'doublescale'),
	icon: <SupportIcon width={24} height={24} />,
	requiresModule: 'support',
});

registerAdminPage('support-ticket', {
	path: 'support/ticket/:id',
	component: wrap(TicketDetail),
	label: __('Ticket', 'doublescale'),
	hidden: true,
	icon: <SupportIcon width={24} height={24} />,
	requiresModule: 'support',
});

registerAdminPage('support-settings', {
	path: 'support/settings',
	component: wrap(SupportSettings),
	label: __('Support Settings', 'doublescale'),
	// Hidden from the auto-built sidebar list; surfaced as a submenu item under
	// the Support group in the navbar (see `src/components/navbar/index.tsx`),
	// exactly like `booking/settings`.
	hidden: true,
	icon: <SupportIcon width={24} height={24} />,
	// Mailbox + notification config is an admin/manager concern, matching
	// `booking-settings`. Agents (support-only roles) don't see it.
	requiredCapability: ['doublescale_crm_manager'],
	requiresModule: 'support',
});
