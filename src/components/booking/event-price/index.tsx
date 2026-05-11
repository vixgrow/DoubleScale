/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useEffect, useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { PriceIcon } from '../icons';
import { PaymentsSettings } from '@/types/booking';

const EventPrice: React.FC<{
	payments_settings: PaymentsSettings;
	duration: number;
}> = ({ payments_settings, duration }) => {
	const [price, setPrice] = useState<number>(0);

	useEffect(() => {
		if (payments_settings.enable_items_based_on_duration) {
			setPrice(
				payments_settings.multi_duration_items[duration]?.price ?? 0
			);
			return;
		}

		if (payments_settings.enable_payment) {
			const totalPrice =
				payments_settings.items && payments_settings.items.length > 0
					? payments_settings.items
							.map((item) => item.price ?? 0)
							.reduce((sum, price) => sum + price, 0)
					: 0;
			setPrice(totalPrice);
			return;
		}

		setPrice(0);
	}, [payments_settings, duration]);

	return (
		<div className="flex gap-2.5 items-center">
			<PriceIcon />
			<div className="flex flex-col">
				<span className="text-[#71717A] text-[12px]">
					{__('Price', 'doublescale')}
				</span>
				<span className="text-[#007AFF] text-[14px] font-[500] capitalize">
					{payments_settings.enable_payment ? (
						price > 0 ? (
							price.toString()
						) : (
							__('Free', 'doublescale')
						)
					) : (
						<span>{__('Free', 'doublescale')}</span>
					)}
				</span>
			</div>
		</div>
	);
};

export default EventPrice;
