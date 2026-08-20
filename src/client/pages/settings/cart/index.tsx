/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import type { Settings } from '@doublescale/client';
import { Field, CartIcon, InfoIcon } from '@doublescale/components';
import { Switch } from '@doublescale/components/ui/switch';
import { Label } from '@doublescale/components/ui/label';

interface CartSettingsProps {
	settings: Settings;
	onChange: (settings: Settings) => void;
}

const CartSettings: React.FC<CartSettingsProps> = ({ settings, onChange }) => {
	const {
		enable_cart_tracking,
		create_contacts_in_crm = false,
		wait_period,
		cool_off_period,
		lost_cart_days,
		gdpr_compliance,
		gdpr_message,
		lists,
		tags,
		lost_lists,
		lost_tags,
	} = settings.cart;
	const handleFieldChange = (
		key: string,
		value: string | boolean | number | number[]
	) => {
		onChange({
			...settings,
			cart: {
				...settings.cart,
				[key]: value,
			},
		});
	};
	return (
		<div className="cart-settings doublescale-fields">
			<div className="flex items-center justify-between">
				<div className="text-[#09090B] font-semibold text-2xl">
					{__('Cart', 'doublescale')}
				</div>
				<div className="flex items-center gap-2">
					<Switch
						checked={enable_cart_tracking}
						onCheckedChange={(checked: boolean) => {
							onChange({
								...settings,
								cart: {
									...settings.cart,
									enable_cart_tracking: checked,
									// Keep CRM sync opt-in in sync with the master switch.
									...(checked
										? {}
										: { create_contacts_in_crm: false }),
								},
							});
						}}
					/>
					<Label>{__('Enable Cart Tracking', 'doublescale')}</Label>
				</div>
			</div>
			{!enable_cart_tracking && (
				<div className="flex flex-col items-center justify-center py-16 gap-4 text-gray-500">
					<CartIcon width={100} height={100} />
					<div className="text-base text-center flex items-center gap-1">
						{__('To fill your cart details, please', 'doublescale')}
						<span className="text-black font-semibold">
							{__('enable cart tracking', 'doublescale')}
						</span>
					</div>
				</div>
			)}
			{enable_cart_tracking && (
				<>
					<div className="flex items-center gap-5 border-b pb-5">
						<Field
							label={__('Wait Period (minutes)', 'doublescale')}
							value={wait_period}
							onChange={(value) =>
								handleFieldChange('wait_period', value)
							}
							type="number"
						/>
						<Field
							label={__('Cool Off Period (days)', 'doublescale')}
							value={cool_off_period}
							onChange={(value) =>
								handleFieldChange('cool_off_period', value)
							}
							type="number"
						/>
						<Field
							label={__('Lost Cart (days)', 'doublescale')}
							value={lost_cart_days}
							onChange={(value) =>
								handleFieldChange('lost_cart_days', value)
							}
							type="number"
						/>
					</div>
					<div className="flex flex-col gap-2 border-b pb-5">
						<div className="flex items-center justify-between w-full">
							<div className="text-xl font-medium w-full">
								{__('GDPR Consent', 'doublescale')}
							</div>
							<div className="flex items-center gap-2">
								<Switch
									checked={gdpr_compliance}
									onCheckedChange={(checked: boolean) =>
										handleFieldChange(
											'gdpr_compliance',
											checked
										)
									}
								/>
							</div>
						</div>
						<div className="text-[#9197A4]">
							{__(
								'When customers enter checkout details, inform them that their email, phone number, and cart data may be saved to send abandonment reminders',
								'doublescale'
							)}
						</div>
						{gdpr_compliance && (
							<>
								<Field
									label={__('GDPR Message', 'doublescale')}
									value={gdpr_message}
									onChange={(value) =>
										handleFieldChange('gdpr_message', value)
									}
									type="textarea"
								/>
								<div className="text-primary flex items-center gap-2">
									<InfoIcon width={20} height={20}/>
									{__(
										'Use smartcode {{opt_out label="No Thanks"}} to let users opt out of cart tracking.',
										'doublescale'
									)}
								</div>
							</>
						)}
					</div>
					<div className="flex flex-col gap-2 border-b pb-5">
						<div className="flex items-center justify-between w-full">
							<div className="text-xl font-medium w-full">
								{__('CRM contacts', 'doublescale')}
							</div>
							<div className="flex items-center gap-2">
								<Switch
									checked={create_contacts_in_crm}
									onCheckedChange={(checked: boolean) =>
										handleFieldChange(
											'create_contacts_in_crm',
											checked
										)
									}
								/>
								<Label>
									{__('Create contacts in CRM', 'doublescale')}
								</Label>
							</div>
						</div>
						<div className="text-[#9197A4]">
							{__(
								'Create CRM contacts from abandoned carts so you can assign lists and tags below. When off, contacts are only created by active Abandoned Cart automations that match your rules.',
								'doublescale'
							)}
						</div>
					</div>
					<div className="flex flex-col gap-2 border-b pb-5">
						<div className="text-xl font-medium">
							{__('Add Lists on Cart Abandoned', 'doublescale')}
						</div>
						{!create_contacts_in_crm && (
							<div className="text-primary flex items-center gap-2">
								<InfoIcon width={20} height={20}/>
								{__(
									'Enable CRM contacts above to apply these lists and tags when a cart is abandoned.',
									'doublescale'
								)}
							</div>
						)}
						<div className="flex items-center gap-5">
							<Field
								label={__('Lists', 'doublescale')}
								value={lists}
								onChange={(value) =>
									handleFieldChange('lists', value)
								}
								type="lists"
							/>
							<Field
								label={__(
									'Add Tags on Cart Abandoned',
									'doublescale'
								)}
								value={tags}
								onChange={(value) =>
									handleFieldChange('tags', value)
								}
								type="tags"
							/>
						</div>
					</div>
					<div className="flex flex-col gap-2">
						<div className="text-xl font-medium">
							{__('Lost Cart', 'doublescale')}
						</div>
						{!create_contacts_in_crm && (
							<div className="text-primary flex items-center gap-2">
								<InfoIcon width={20} height={20}/>
								{__(
									'Enable CRM contacts above to apply these lists and tags when a cart is marked lost.',
									'doublescale'
								)}
							</div>
						)}
						<div className="flex items-center gap-5">
							<Field
								label={__('Add Lists on Cart Lost', 'doublescale')}
								value={lost_lists}
								onChange={(value) =>
									handleFieldChange('lost_lists', value)
								}
								type="lists"
							/>
							<Field
								label={__('Add Tags on Cart Lost', 'doublescale')}
								value={lost_tags}
								onChange={(value) =>
									handleFieldChange('lost_tags', value)
								}
								type="tags"
							/>
						</div>
					</div>
				</>
			)}
		</div>
	);
};

export default CartSettings;
