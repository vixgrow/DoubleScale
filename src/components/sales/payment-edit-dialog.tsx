/**
 * Dialog to edit an existing payment.
 */

import React from '@wordpress/element';
import { __ } from '@wordpress/i18n';

import { CustomDialogHeader, RecordIcon } from '@doublescale/components';
import { Button } from '@/components/ui/button';
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
} from '@/components/ui/dialog';
import { PaymentForm } from './payment-form';
import type { PaymentDetail, RecordPaymentPayload } from '@/types/sales';

interface PaymentEditDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	payment: PaymentDetail;
	busy?: boolean;
	error?: string | null;
	readOnly?: boolean;
	onSubmit: (payload: RecordPaymentPayload) => void | Promise<void>;
}

const formId = 'payment-edit-form';

export const PaymentEditDialog: React.FC<PaymentEditDialogProps> = ({
	open,
	onOpenChange,
	payment,
	busy = false,
	error = null,
	readOnly = false,
	onSubmit,
}) => (
	<Dialog open={open} onOpenChange={onOpenChange}>
		<DialogContent
			className="z-[150220] max-h-[90vh] max-w-lg overflow-y-auto bg-white"
			overlayClassName="z-[150210] bg-black/45 backdrop-blur-[1px]"
		>
			<DialogHeader>
				<CustomDialogHeader
					title={__('Payment', 'doublescale')}
					subtitle={__('Update payment details', 'doublescale')}
					icon={<RecordIcon width={20} height={20} />}
				/>
			</DialogHeader>

			<PaymentForm
				payment={payment}
				busy={busy}
				error={error}
				readOnly={readOnly}
				layout="dialog"
				formId={formId}
				hideActions
				onSubmit={onSubmit}
			/>

			{!readOnly ? (
				<DialogFooter className="flex gap-3 sm:justify-end">
					<Button
						type="button"
						variant="outline"
						onClick={() => onOpenChange(false)}
						disabled={busy}
						className="border-primary bg-white text-primary"
					>
						{__('Cancel', 'doublescale')}
					</Button>
					<Button type="submit" form={formId} disabled={busy}>
						{busy ? __('Saving…', 'doublescale') : __('Save', 'doublescale')}
					</Button>
				</DialogFooter>
			) : null}
		</DialogContent>
	</Dialog>
);
