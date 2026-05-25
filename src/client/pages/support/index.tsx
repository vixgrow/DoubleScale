/**
 * Support module page registration.
 *
 * Mirrors `src/client/pages/booking/index.tsx`. Two pages today:
 *   - support               → inbox (list view)
 *   - support/ticket/:id    → ticket detail (hidden in sidebar; routed via row click)
 *
 * Both pages are gated by `requiresModule: 'support'` so they disappear from
 * the registry the moment the module is toggled off via Settings → Modules.
 */

import React, { lazy, Suspense, useEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

import { registerAdminPage } from '@doublescale/navigation';

import { SupportIcon } from '@/components/support';
import { Skeleton } from '@/components/ui/skeleton';

const Inbox = lazy(() => import('./inbox'));
const TicketDetail = lazy(() => import('./ticket'));

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
