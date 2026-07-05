/**
 * Payment receipt view page.
 */

import React, { useState } from '@wordpress/element';
import type { NoticeMessage } from '@doublescale/client';
import { __ } from '@wordpress/i18n';
import { useParams } from '@doublescale/navigation';

import { useNavigate, getToLink } from '@doublescale/navigation';
import {
	DeleteIcon,
	NoticeBanner,
	PanelLayout,
	RecordIcon,
} from '@doublescale/components';
import { Button } from '@/components/ui/button';
import {
	ConfirmDialog,
	isSalesRepOnly,
	PaymentEditDialog,
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
	const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
	const [busy, setBusy] = useState(false);
	const [notice, setNotice] = useState<NoticeMessage | null>(null);
	const [saveError, setSaveError] = useState<string | null>(null);
	const paymentReadOnly = isSalesRepOnly();

	const handleClose = () => navigate(getToLink('sales/payments'));

	const breadcrumbItems = [
		{ label: __('Sales (Payments)', 'doublescale'), href: 'sales/payments' },
		{ label: __('Payment Receipt', 'doublescale') },
	];

	const panelShell = (children: React.ReactNode) => (
		<PanelLayout
			fullWidth
			items={breadcrumbItems}
			showPanelClose
			onClosePanel={handleClose}
			handleNavigate={(href) => navigate(getToLink(href))}
		>
			{children}
		</PanelLayout>
	);

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
			setNotice({
				type: 'success',
				message: __('Payment saved.', 'doublescale'),
			});
			setPaymentDialogOpen(false);
		} catch (err: unknown) {
			setSaveError(formatRestError(err));
		} finally {
			setBusy(false);
		}
	};

	if (loading) {
		return panelShell(
			<div className="py-12 text-center text-muted-foreground">
				{__('Loading…', 'doublescale')}
			</div>
		);
	}

	if (error || !payment) {
		return panelShell(
			<div className="py-12 text-center text-red-600">
				{error || __('Payment not found.', 'doublescale')}
			</div>
		);
	}

	return (
		<>
			{panelShell(
				<div className="space-y-6">
					{notice ? (
						<NoticeBanner
							notice={notice}
							closeNotice={() => setNotice(null)}
						/>
					) : null}

					<div className="flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-start sm:justify-between">
						<h1 className="text-2xl font-bold tracking-tight text-foreground">
							{__('Payment Receipt', 'doublescale')} (#{payment.id})
						</h1>

						<div className="flex flex-wrap items-center justify-start gap-6 sm:justify-end">
							{!paymentReadOnly ? (
								<Button
									variant="outline"
									onClick={() => {
										setSaveError(null);
										setPaymentDialogOpen(true);
									}}
									disabled={busy}
									className="border-primary bg-white text-primary"
								>
									{__('Payment', 'doublescale')}
									<RecordIcon />
								</Button>
							) : null}
							{!paymentReadOnly ? (
								<Button
									variant="outline"
									size="icon"
									className="h-10 w-10 shrink-0 border-destructive bg-white text-destructive hover:bg-[#FEE2E2]"
									onClick={() => setDeleteOpen(true)}
									disabled={busy}
									aria-label={__('Delete', 'doublescale')}
								>
									<DeleteIcon width={24} height={24} />
								</Button>
							) : null}
						</div>
					</div>

					<PaymentReceiptPreview payment={payment} />
				</div>
			)}

			<PaymentEditDialog
				open={paymentDialogOpen}
				onOpenChange={(open) => {
					setPaymentDialogOpen(open);
					if (!open) {
						setSaveError(null);
					}
				}}
				payment={payment}
				busy={busy}
				error={saveError}
				readOnly={paymentReadOnly}
				onSubmit={handleSave}
			/>

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
		</>
	);
};

export default PaymentView;
