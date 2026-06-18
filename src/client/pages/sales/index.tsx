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
import { ContractsProGate, InvoicesProGate, PaymentsProGate } from './pro-gates';

const ProposalsList = lazy(() => import('./proposals'));
const ProposalView = lazy(() => import('./proposals/view'));
const ProposalEdit = lazy(() => import('./proposals/edit'));
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
 * `/sales` → first enabled Sales child (documents, contracts) or pipeline.
 */
const resolveSalesLandingPath = (): string | null => {
	if (isSalesDocumentsReady()) {
		const candidates: Array<{ module: string; path: string }> = [
			{ module: 'documents', path: 'sales/proposals' },
			{ module: 'contracts', path: 'sales/contracts' },
		];
		for (const { module, path } of candidates) {
			if (config.isModuleToggleEnabled(module)) {
				return path;
			}
		}
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

const documentsPageDefaults = {
	...salesPageDefaults,
	requiresModule: 'documents' as const,
};

const contractPageDefaults = {
	...salesPageDefaults,
	requiresModule: 'contracts' as const,
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
		...documentsPageDefaults,
	});

	registerAdminPage('sales-proposal-new', {
		path: 'sales/proposals/new',
		component: wrap(ProposalEdit),
		label: __('New Proposal', 'doublescale'),
		hidden: true,
		...documentsPageDefaults,
	});

	registerAdminPage('sales-proposal', {
		path: 'sales/proposals/:id',
		component: wrap(ProposalView),
		label: __('Proposal', 'doublescale'),
		hidden: true,
		...documentsPageDefaults,
	});

	registerAdminPage('sales-proposal-edit', {
		path: 'sales/proposals/:id/edit',
		component: wrap(ProposalEdit),
		label: __('Edit Proposal', 'doublescale'),
		hidden: true,
		...documentsPageDefaults,
	});

	// Invoice & payment routes — stub registration the Pro plugin overrides via filter.
	registerAdminPage('sales-invoices', {
		path: 'sales/invoices',
		component: () => <InvoicesProGate />,
		label: __('Invoices', 'doublescale'),
		hidden: true,
		...documentsPageDefaults,
	});

	registerAdminPage('sales-invoice-new', {
		path: 'sales/invoices/new',
		component: () => <InvoicesProGate />,
		label: __('New Invoice', 'doublescale'),
		hidden: true,
		...documentsPageDefaults,
	});

	registerAdminPage('sales-invoice', {
		path: 'sales/invoices/:id',
		component: () => <InvoicesProGate />,
		label: __('Invoice', 'doublescale'),
		hidden: true,
		...documentsPageDefaults,
	});

	registerAdminPage('sales-invoice-edit', {
		path: 'sales/invoices/:id/edit',
		component: () => <InvoicesProGate />,
		label: __('Edit Invoice', 'doublescale'),
		hidden: true,
		...documentsPageDefaults,
	});

	registerAdminPage('sales-payments', {
		path: 'sales/payments',
		component: () => <PaymentsProGate />,
		label: __('Payments', 'doublescale'),
		hidden: true,
		...documentsPageDefaults,
	});

	// Contract routes — stub registration the Pro plugin overrides via filter.
	registerAdminPage('sales-contracts', {
		path: 'sales/contracts',
		component: () => <ContractsProGate />,
		label: __('Contracts', 'doublescale'),
		hidden: true,
		...contractPageDefaults,
	});

	registerAdminPage('sales-contract-new', {
		path: 'sales/contracts/new',
		component: () => <ContractsProGate />,
		label: __('New Contract', 'doublescale'),
		hidden: true,
		...contractPageDefaults,
	});

	registerAdminPage('sales-contract', {
		path: 'sales/contracts/:id',
		component: () => <ContractsProGate />,
		label: __('Contract', 'doublescale'),
		hidden: true,
		...contractPageDefaults,
	});

	registerAdminPage('sales-contract-edit', {
		path: 'sales/contracts/:id/edit',
		component: () => <ContractsProGate />,
		label: __('Edit Contract', 'doublescale'),
		hidden: true,
		...contractPageDefaults,
	});

	registerAdminPage('sales-contract-types', {
		path: 'sales/contract-types',
		component: () => <ContractsProGate />,
		label: __('Contract Types', 'doublescale'),
		hidden: true,
		...contractPageDefaults,
	});

	registerAdminPage('sales-payment', {
		path: 'sales/payments/:id',
		component: () => <PaymentsProGate />,
		label: __('Payment', 'doublescale'),
		hidden: true,
		...documentsPageDefaults,
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
