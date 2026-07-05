/**
 * Invoice create/edit page — delegates to shared InvoiceForm.
 */

import React from '@wordpress/element';
import { useParams } from '@doublescale/navigation';

import InvoiceForm from '@/components/sales/invoice-form';

const InvoiceEdit: React.FC = () => {
	const params = useParams();
	const idParam = params?.id;
	const isNew = !idParam || idParam === 'new';
	const invoiceId = !isNew && idParam ? Number(idParam) : null;

	return <InvoiceForm invoiceId={invoiceId} mode="dialog" />;
};

export default InvoiceEdit;
