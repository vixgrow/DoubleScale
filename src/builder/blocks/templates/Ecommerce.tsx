/**
 * wordpress dependencies
 */
import { __ } from '@wordpress/i18n';

//@ts-ignore
import orderConfirmation from '../../../../assets/images/templates/Order-Confirmation.png';
//@ts-ignore
import abandonedCart from '../../../../assets/images/templates/Abandoned-Cart.png';

const templateItems = [
	{
		id: 'order-confirmation',
		title: __('Order Confirmation', 'doublescale'),
		image: orderConfirmation,
	},
	{
		id: 'abandoned-cart',
		title: __('Abandoned Cart', 'doublescale'),
		image: abandonedCart,
	},
];

const EcommerceTemplates = () => {
	return (
		<div className="grid gap-4">
			{templateItems.map((item) => (
				<div key={item.id} className="flex flex-col gap-1 text-[#333333]">
					<label className="text-sm">{item.title}</label>
					<div className="border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer p-2">
						<img
							src={item.image}
							alt={item.title}
							className="w-full h-32 object-cover rounded"
						/>
					</div>
				</div>
			))}
		</div>
	);
};

export default EcommerceTemplates;
