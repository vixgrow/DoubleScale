/**
 * Pro upsell stubs for invoice and payment admin routes when Pro is inactive.
 */

import { __ } from '@wordpress/i18n';
import { ProFeatureNotice } from '@doublescale/components';

export const InvoicesProGate = () => (
	<ProFeatureNotice
		featureName={__('Invoices', 'doublescale')}
		description={__(
			'Create and send invoices, track balances, and manage the quote-to-cash flow with DoubleScale Pro.',
			'doublescale'
		)}
		features={[
			__('Create, send, and manage customer invoices', 'doublescale'),
			__('Record offline and online payments', 'doublescale'),
			__('Convert accepted proposals to invoices', 'doublescale'),
			__('Customer portal access and downloadable PDFs', 'doublescale'),
			__('Sequential invoice numbering (INV-000001)', 'doublescale'),
		]}
	/>
);

export const PaymentsProGate = () => (
	<ProFeatureNotice
		featureName={__('Payments', 'doublescale')}
		description={__(
			'Record invoice payments, reconcile balances, and accept online payments with DoubleScale Pro.',
			'doublescale'
		)}
		features={[
			__('Payment history across all invoices', 'doublescale'),
			__('Manual and gateway-recorded payments', 'doublescale'),
			__('Stripe online payments on public invoices', 'doublescale'),
			__('Per-contact payment timeline', 'doublescale'),
		]}
	/>
);

export const ContractsProGate = () => (
	<ProFeatureNotice
		featureName={__('Contracts', 'doublescale')}
		description={__(
			'Manage customer contracts, types, attachments, and e-signatures with DoubleScale Pro.',
			'doublescale'
		)}
		features={[
			__('Create, send, and track customer contracts', 'doublescale'),
			__('Contract types and reusable templates', 'doublescale'),
			__('File attachments and customer e-signatures', 'doublescale'),
			__('Customer portal access and downloadable PDFs', 'doublescale'),
			__('Sequential contract numbering (CON-000001)', 'doublescale'),
		]}
	/>
);

export const ApprovalsProGate = () => (
	<ProFeatureNotice
		featureName={__('Approval Workflow', 'doublescale')}
		description={__(
			'Require internal review before proposals and invoices are sent to customers with DoubleScale Pro.',
			'doublescale'
		)}
		features={[
			__('Sales reps submit documents for manager approval', 'doublescale'),
			__('Approvals Center queue for CRM and Sales Managers', 'doublescale'),
			__('Approve or reject with a required reason', 'doublescale'),
			__('Lock pricing while a document is pending review', 'doublescale'),
			__('Bell and email notifications for reviewers and reps', 'doublescale'),
		]}
	/>
);
