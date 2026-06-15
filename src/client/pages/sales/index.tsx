/**
 * Sales module page registration.
 */

import React, { lazy, Suspense, useEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

import {
	registerAdminPage,
	useNavigate,
	getToLink,
	getAdminPages,
} from '@doublescale/navigation';
import { SalesIcon } from '@doublescale/components';
import { isSalesDocumentsReady } from '@doublescale/shared/lib/optional-marketing-modules';
import config from '@doublescale/config';
import { Skeleton } from '@/components/ui/skeleton';

const ProposalsList = lazy(() => import('./proposals'));
const ProposalView = lazy(() => import('./proposals/view'));
const ProposalEdit = lazy(() => import('./proposals/edit'));
const InvoicesList = lazy(() => import('./invoices'));
const InvoiceView = lazy(() => import('./invoices/view'));
const InvoiceEdit = lazy(() => import('./invoices/edit'));
const PaymentsList = lazy(() => import('./payments'));
const PaymentView = lazy(() => import('./payments/view'));
const SalesSettings = lazy(() => import('./settings'));

const SalesPageSkeleton: React.FC = () => (
	<div className="p-6 space-y-4">
		<Skeleton className="h-8 w-64" />
		<Skeleton className="h-4 w-96" />
		<Skeleton className="h-40" />
	</div>
);

const SALES_MENU_CAPS = [
	'doublescale_view_sales',
	'doublescale_manage_all_sales',
	'doublescale_manage_own_sales',
	'doublescale_crm_manager',
	'doublescale_sales_manager',
	'doublescale_sales_rep',
];

/**
 * `/sales` → Proposals list (Perfex-style Sales parent). While the documents
 * feature is gated, the only destination under Sales is the pipeline.
 */
const resolveSalesLandingPath = (): string | null => {
	if (isSalesDocumentsReady()) {
		return 'sales/proposals';
	}
	if (config.isModuleToggleEnabled('deals')) {
		return 'sales-pipeline';
	}
	const registeredPaths = new Set(
		Object.values(getAdminPages()).map((page) => page.path)
	);
	if (registeredPaths.has('sales-pipeline')) {
		return 'sales-pipeline';
	}
	return null;
};

const RedirectToProposals = () => {
	const navigate = useNavigate();
	useEffect(() => {
		const target = resolveSalesLandingPath();
		if (target) {
			navigate(getToLink(target), { replace: true });
		}
	}, [navigate]);
	return null;
};

const wrap = (Page: React.ComponentType): (() => JSX.Element) => {
	return () => {
		useEffect(() => {
			window.document.documentElement.scrollTop = 0;
		}, []);
		return (
			<Suspense fallback={<SalesPageSkeleton />}>
				<div className="doublescale-sales-page-component-wrapper">
					<Page />
				</div>
			</Suspense>
		);
	};
};

const salesPageDefaults = {
	requiredCapability: SALES_MENU_CAPS,
	requiresModule: 'sales' as const,
	alwaysRegister: true,
};

registerAdminPage('sales', {
	path: 'sales',
	component: wrap(RedirectToProposals),
	label: __('Sales', 'doublescale'),
	icon: <SalesIcon />,
	...salesPageDefaults,
});

// Document routes (proposals/invoices) only exist once the feature is
// released — see isSalesDocumentsReady(). Until then deep links fall through
// to the 404/redirect handling like any unknown path.
if (isSalesDocumentsReady()) {
	registerAdminPage('sales-proposals', {
		path: 'sales/proposals',
		component: wrap(ProposalsList),
		label: __('Proposals', 'doublescale'),
		hidden: true,
		...salesPageDefaults,
	});

	registerAdminPage('sales-proposal-new', {
		path: 'sales/proposals/new',
		component: wrap(ProposalEdit),
		label: __('New Proposal', 'doublescale'),
		hidden: true,
		...salesPageDefaults,
	});

	registerAdminPage('sales-proposal', {
		path: 'sales/proposals/:id',
		component: wrap(ProposalView),
		label: __('Proposal', 'doublescale'),
		hidden: true,
		...salesPageDefaults,
	});

	registerAdminPage('sales-proposal-edit', {
		path: 'sales/proposals/:id/edit',
		component: wrap(ProposalEdit),
		label: __('Edit Proposal', 'doublescale'),
		hidden: true,
		...salesPageDefaults,
	});

	registerAdminPage('sales-invoices', {
		path: 'sales/invoices',
		component: wrap(InvoicesList),
		label: __('Invoices', 'doublescale'),
		hidden: true,
		...salesPageDefaults,
	});

	registerAdminPage('sales-invoice-new', {
		path: 'sales/invoices/new',
		component: wrap(InvoiceEdit),
		label: __('New Invoice', 'doublescale'),
		hidden: true,
		...salesPageDefaults,
	});

	registerAdminPage('sales-invoice', {
		path: 'sales/invoices/:id',
		component: wrap(InvoiceView),
		label: __('Invoice', 'doublescale'),
		hidden: true,
		...salesPageDefaults,
	});

	registerAdminPage('sales-invoice-edit', {
		path: 'sales/invoices/:id/edit',
		component: wrap(InvoiceEdit),
		label: __('Edit Invoice', 'doublescale'),
		hidden: true,
		...salesPageDefaults,
	});

	registerAdminPage('sales-payments', {
		path: 'sales/payments',
		component: wrap(PaymentsList),
		label: __('Payments', 'doublescale'),
		hidden: true,
		...salesPageDefaults,
	});

	registerAdminPage('sales-payment', {
		path: 'sales/payments/:id',
		component: wrap(PaymentView),
		label: __('Payment', 'doublescale'),
		hidden: true,
		...salesPageDefaults,
	});

	registerAdminPage('sales-settings', {
		path: 'sales/settings',
		component: wrap(SalesSettings),
		label: __('Sales Settings', 'doublescale'),
		hidden: true,
		requiredCapability: ['doublescale_manage_all_sales', 'doublescale_crm_manager'],
		...salesPageDefaults,
	});
}
