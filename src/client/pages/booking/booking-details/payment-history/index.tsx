/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import type { Booking } from '@/types/booking';
import { CardHeader, PaymentHistoryIcon } from '@/components/booking';

/*
 * Main Meeting Information Component
 */
interface PaymentHistoryProps {
	booking: Booking;
}

const PaymentHistory: React.FC<PaymentHistoryProps> = ({ booking }) => {
	if (booking.order === undefined || booking.order === null) {
		return;
	}

	const rawItems = booking?.order?.items;
	const items: Array<{ name?: string; item?: string; price?: number }> =
		Array.isArray(rawItems)
			? rawItems
			: typeof rawItems === 'string'
				? (() => {
						try {
							const parsed = JSON.parse(rawItems);
							return Array.isArray(parsed) ? parsed : [];
						} catch {
							return [];
						}
					})()
				: [];

	return (
        <div className="border px-10 py-8 rounded-2xl flex flex-col gap-5">
            <CardHeader
				title={__('Payment History', 'doublescale')}
				description={__(
					'your payment history and transaction details.',
					'doublescale'
				)}
				icon={<PaymentHistoryIcon />}
			/>
            <div className='flex flex-col gap-2.5 pb-4 border-b mb-4'>
				<div
                    className='flex justify-between items-center text-[#09090B] font-medium text-[18px]'>
					<div>{booking?.order?.updated_at}</div>
				</div>
				<div className='flex items-start text-[#71717A] text-base gap-48'>
					<div className='flex flex-col'>
						<div>
							{__(
								`Payment Total: ${booking?.order?.total}`,
								'doublescale'
							)}
						</div>
						<div>
							{__(
								`Payment Method: ${booking?.order?.payment_method}`,
								'doublescale'
							)}
						</div>
					</div>
					<div className='flex flex-col'>
						<div>
							{__(
								`Payment Status: ${booking?.order?.status}`,
								'doublescale'
							)}
						</div>
						<div>
							{__(
								`Transaction ID: ${booking?.order?.transaction_id}`,
								'doublescale'
							)}
						</div>
					</div>
				</div>
			</div>
            <div className="">
				<table className="w-full text-left text-gray-700">
					<thead className="bg-[#F3F4F6] text-[#09090B] font-medium">
						<tr>
							<th className="pl-5 pr-4 py-5 w-2/3">
								{__('Name', 'doublescale')}
							</th>
							<th className="pl-2 py-5 w-1/3">
								{__('Price', 'doublescale')}
							</th>
						</tr>
					</thead>
					<tbody>
					{items.map((item, index) => (
						<tr key={index} className="bg-white">
							<td className="py-4 pl-5 pr-4 w-2/3">
								{item.item ?? item.name}
							</td>
							<td className="pl-2 py-5 w-1/3 flex">
								{booking?.order?.currency} {item.price}
							</td>
						</tr>
					))}
					</tbody>
				</table>

				{/* Total aligned to the right under the Price column */}
				<div className="flex justify-end mt-2">
					<div className="w-2/5 text-right pl-1 pr-56 flex">
						<span className="text-gray-700 mr-8">Total</span>
						<span className="font-medium text-[#0EAD69] flex">
							{booking?.order?.currency} {booking?.order?.total}
						</span>
					</div>
				</div>
			</div>
        </div>
    );
};

export default PaymentHistory;
