/**
 * Payment receipt view page.
 */

import React, { useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { ArrowLeft, Trash2 } from 'lucide-react';
import { useParams } from '@doublescale/navigation';

import { useNavigate, getToLink } from '@doublescale/navigation';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
	ConfirmDialog,
	isSalesRepOnly,
	PaymentForm,
	PaymentReceiptPreview,
} from '@/components/sales';
import { deletePayment, formatRestError, updatePayment, usePayment } from '@/hooks/sales';
import type { RecordPaymentPayload } from '@/types/sales';

const PaymentView: React.FC = () => {
	const navigate = useNavigate();
	const params = useParams();
	const paymentId = params?.id ? Number(params.id) : null;

	const { data: payment, loading, error, refetch } = usePayment(paymentId);
	const [deleteOpen, setDeleteOpen] = useState(false);
	const [busy, setBusy] = useState(false);
	const [notice, setNotice] = useState<string | null>(null);
	const [saveError, setSaveError] = useState<string | null>(null);
	const paymentReadOnly = isSalesRepOnly();

	const handleDelete = async () => {
		if (!paymentId) {
			return;
		}
		setBusy(true);
		try {
			await deletePayment(paymentId);
			navigate(getToLink('sales/payments'));
		} finally {
			setBusy(false);
			setDeleteOpen(false);
		}
	};

	const handleSave = async (payload: RecordPaymentPayload) => {
		if (!paymentId) {
			return;
		}
		setBusy(true);
		setNotice(null);
		setSaveError(null);
		try {
			await updatePayment(paymentId, payload);
			await refetch();
			setNotice(__('Payment saved.', 'doublescale'));
		} catch (err: unknown) {
			setSaveError(formatRestError(err));
		} finally {
			setBusy(false);
		}
	};

	if (loading) {
		return (
			<div className="p-6 text-muted-foreground">{__('Loading…', 'doublescale')}</div>
		);
	}

	if (error || !payment) {
		return (
			<div className="p-6 space-y-4">
				<Button variant="ghost" onClick={() => navigate(getToLink('sales/payments'))}>
					<ArrowLeft className="h-4 w-4 mr-1" />
					{__('Payments', 'doublescale')}
				</Button>
				<div className="text-red-600">{error || __('Payment not found.', 'doublescale')}</div>
			</div>
		);
	}

	return (
		<div className="p-6 space-y-6 max-w-5xl">
			{notice ? (
				<div className="text-sm rounded border border-emerald-200 bg-emerald-50 px-3 py-2 text-emerald-700">
					{notice}
				</div>
			) : null}

			<div className="flex items-center justify-between gap-4">
				<Button variant="ghost" onClick={() => navigate(getToLink('sales/payments'))}>
					<ArrowLeft className="h-4 w-4 mr-1" />
					{__('Payments', 'doublescale')}
				</Button>
				{!paymentReadOnly ? (
					<Button
						variant="outline"
						className="text-red-600 hover:text-red-700"
						onClick={() => setDeleteOpen(true)}
						disabled={busy}
					>
						<Trash2 className="h-4 w-4 mr-1" />
						{__('Delete', 'doublescale')}
					</Button>
				) : null}
			</div>

			<Tabs defaultValue="receipt">
				<TabsList>
					<TabsTrigger value="receipt">{__('Payment Receipt', 'doublescale')}</TabsTrigger>
					<TabsTrigger value="payment">{__('Payment', 'doublescale')}</TabsTrigger>
				</TabsList>

				<TabsContent value="receipt" className="mt-6">
					<div className="border rounded-lg bg-white p-8 shadow-sm">
						<PaymentReceiptPreview payment={payment} />
					</div>
				</TabsContent>

				<TabsContent value="payment" className="mt-6">
					<div className="border rounded-lg bg-white p-6 shadow-sm">
						<PaymentForm
							payment={payment}
							busy={busy}
							error={saveError}
							readOnly={paymentReadOnly}
							onSubmit={handleSave}
						/>
					</div>
				</TabsContent>
			</Tabs>

			<ConfirmDialog
				open={deleteOpen}
				onOpenChange={setDeleteOpen}
				title={__('Delete Payment', 'doublescale')}
				description={__(
					'Are you sure you want to delete this payment? The invoice status will be updated.',
					'doublescale'
				)}
				confirmLabel={__('Delete', 'doublescale')}
				destructive
				busy={busy}
				onConfirm={handleDelete}
			/>
		</div>
	);
};

export default PaymentView;
