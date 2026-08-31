/**
 * Sales payment gateways and default invoice payment methods.
 */

import React from '@wordpress/element';
import type { FC, ReactNode } from 'react';
import { __ } from '@wordpress/i18n';

import { useNavigate, getToLink } from '@doublescale/navigation';
import {
	PaymentModeIcon,
	SettingsPaymentsIcon,
} from '@doublescale/components';
import { useIsProActive } from '@doublescale/shared/hooks/use-is-pro-active';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useSalesOnlinePaymentGateways } from '@/hooks/sales';
import type { OnlinePaymentGatewayStatus, SalesSettings } from '@/types/sales';
import {
	OFFLINE_PAYMENT_MODES,
	OFFLINE_PAYMENT_MODE_LABELS,
	ONLINE_PAYMENT_GATEWAY_LABELS,
	ONLINE_PAYMENT_GATEWAYS,
} from '@/constants/sales';

// @ts-ignore
import stripeImg from '@doublescale/assets/images/stripe/stripe.png';
// @ts-ignore
import paypalImg from '@doublescale/assets/images/paypal/paypal.png';
// @ts-ignore
import wooImg from '@doublescale/assets/images/woocoomerce/woo-icon.png';
import { ArrowRight } from 'lucide-react';

interface PaymentGatewaysSettingsProps {
	form: SalesSettings;
	patch: (key: keyof SalesSettings, value: SalesSettings[keyof SalesSettings]) => void;
}

const GATEWAY_IMAGES: Record<string, string> = {
	stripe: stripeImg,
	paypal: paypalImg,
	woocommerce: wooImg,
};

const GATEWAY_PLACEHOLDERS: Record<string, OnlinePaymentGatewayStatus> = {
	stripe: {
		slug: 'stripe',
		name: 'Stripe',
		description: __(
			'Card payments via Stripe — credentials in Integrations → Stripe.',
			'doublescale'
		),
		available: false,
		configured: false,
		enabled_for_sales: false,
		ready: false,
	},
	paypal: {
		slug: 'paypal',
		name: 'PayPal',
		description: __(
			'PayPal checkout — credentials in Integrations → PayPal.',
			'doublescale'
		),
		available: false,
		configured: false,
		enabled_for_sales: false,
		ready: false,
	},
	woocommerce: {
		slug: 'woocommerce',
		name: 'WooCommerce Checkout',
		description: __(
			'Pay via the store WooCommerce checkout. Requires at least one enabled WooCommerce payment method.',
			'doublescale'
		),
		available: false,
		configured: false,
		enabled_for_sales: false,
		ready: false,
		configuration_hint: __(
			'Enable at least one payment method in WooCommerce → Settings → Payments (e.g. Cash on Delivery).',
			'doublescale'
		),
	},
	square: {
		slug: 'square',
		name: 'Square',
		description: __(
			'Square hosted checkout — credentials in Integrations → Square.',
			'doublescale'
		),
		available: false,
		configured: false,
		enabled_for_sales: false,
		ready: false,
	},
	mollie: {
		slug: 'mollie',
		name: 'Mollie',
		description: __(
			'Mollie hosted checkout (iDEAL, Bancontact, SEPA, cards) — credentials in Integrations → Mollie.',
			'doublescale'
		),
		available: false,
		configured: false,
		enabled_for_sales: false,
		ready: false,
	},
	razorpay: {
		slug: 'razorpay',
		name: 'Razorpay',
		description: __(
			'Razorpay hosted checkout (UPI, cards, netbanking, wallets) — credentials in Integrations → Razorpay.',
			'doublescale'
		),
		available: false,
		configured: false,
		enabled_for_sales: false,
		ready: false,
	},
	authorize_net: {
		slug: 'authorize_net',
		name: 'Authorize.Net',
		description: __(
			'Authorize.Net Accept Hosted card checkout — credentials in Integrations → Authorize.Net.',
			'doublescale'
		),
		available: false,
		configured: false,
		enabled_for_sales: false,
		ready: false,
	},
};

interface SettingsSectionCardProps {
	title: string;
	icon: ReactNode;
	description: string;
	badge?: ReactNode;
	children: ReactNode;
}

const SettingsSectionCard: FC<SettingsSectionCardProps> = ({
	title,
	icon,
	description,
	badge,
	children,
}) => (
	<section className="space-y-6 rounded-xl border border-border bg-[#F7F8FA] sm:p-6 p-3">
		<div className="space-y-1">
			<div className="flex items-center gap-3">
				<div className="flex p-1.5 shrink-0 text-[#0D9DFC] items-center justify-center rounded-full border border-border bg-white">
					{icon}
				</div>
				<h2 className="lg:text-xl text-base font-semibold text-foreground flex items-center gap-2">
					{title}
					{badge}
				</h2>
			</div>
			<p className="pl-[52px] lg:text-base text-sm text-muted-foreground">
				{description}
			</p>
		</div>
		{children}
	</section>
);

const ProLockBadge: FC = () => (
	<Badge
		variant="secondary"
		className="text-[10px] px-1.5 py-0 bg-orange-100 text-orange-700 border-orange-200"
	>
		{__('Pro', 'doublescale')}
	</Badge>
);

const GatewayStatusBadge: FC<{ gateway: OnlinePaymentGatewayStatus }> = ({ gateway }) => {
	if (!gateway.available) {
		return (
			<Badge variant="secondary" className="text-xs font-normal">
				{__('Requires Pro', 'doublescale')}
			</Badge>
		);
	}
	if (!gateway.configured) {
		return (
			<Badge
				variant="outline"
				className="bg-[#F7F4C3] border-[#F7F4C3] text-sm font-medium text-[#896900] py-1 px-2 rounded-lg"
			>
				{__('Not configured', 'doublescale')}
			</Badge>
		);
	}
	if (gateway.ready) {
		return (
			<Badge variant="default" className="bg-[#D1FADF] border-[#D1FADF] text-sm font-medium text-[#008026] py-1 px-2 rounded-lg">
				{__('Ready', 'doublescale')}
			</Badge>
		);
	}
	return (
		<Badge variant="outline" className="bg-accent border-accent text-sm font-medium text-[#6B6C76] py-1 px-2 rounded-lg">
			{__('Disabled', 'doublescale')}
		</Badge>
	);
};

const GatewayCard: FC<{
	gateway: OnlinePaymentGatewayStatus;
	enabled: boolean;
	locked?: boolean;
	onToggle: (enabled: boolean) => void;
	onConfigure: () => void;
}> = ({ gateway, enabled, locked = false, onToggle, onConfigure }) => (
	<div
		className={cn(
			'flex flex-col gap-4 rounded-xl border border-border bg-white p-4 sm:p-6 sm:flex-row sm:items-center sm:justify-between',
			locked && 'opacity-70'
		)}
	>
		<div className="flex min-w-0 flex-1 items-start sm:flex-row flex-col gap-3">
			{GATEWAY_IMAGES[gateway.slug] ? (
				<img
					src={GATEWAY_IMAGES[gateway.slug]}
					alt={gateway.name}
					className="h-8 w-16 shrink-0 object-contain object-left"
				/>
			) : (
				<div className="flex h-8 w-16 shrink-0 items-center justify-center rounded bg-white text-xs font-semibold text-muted-foreground">
					{gateway.name.slice(0, 1)}
				</div>
			)}
			<div className="min-w-0 space-y-3">
					<h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
						{gateway.name}
						{locked ? <ProLockBadge /> : null}
					</h3>
				{gateway.description ? (
					<p className="text-sm text-muted-foreground">
						{gateway.description}
					</p>
				) : null}
				{locked ? null : <GatewayStatusBadge gateway={gateway} />}
				{!locked && gateway.available && !gateway.configured && gateway.configuration_hint ? (
					<p className="text-sm text-[#896900]">{gateway.configuration_hint}</p>
				) : null}
			</div>
		</div>

		<div className="flex shrink-0 items-start justify-start sm:justify-end gap-3 flex-col sm:items-end">
			<Switch
				id={`gateway-${gateway.slug}`}
				checked={locked ? false : enabled}
				disabled={locked || !gateway.available}
				onCheckedChange={onToggle}
				aria-label={__('Enabled', 'doublescale')}
			/>
			{!locked &&
			(gateway.slug === 'stripe' ||
			gateway.slug === 'paypal' ||
			gateway.integration_url) ? (
				<Button
					type="button"
					variant="secondaryDeepBlue"
					size="sm"
					className="h-9 whitespace-nowrap rounded-lg px-3 text-sm"
					onClick={onConfigure}
				>
					{gateway.slug === 'woocommerce'
						? __('Configure in WooCommerce', 'doublescale')
						: __('Configure in Integrations', 'doublescale')}
					<ArrowRight className='w-4 h-4' />
				</Button>
			) : null}
		</div>
	</div>
);

const SelectionChip: FC<{
	label: string;
	selected: boolean;
	disabled?: boolean;
	badge?: ReactNode;
	onClick: () => void;
}> = ({ label, selected, disabled = false, badge, onClick }) => (
	<button
		type="button"
		onClick={onClick}
		disabled={disabled}
		className={cn(
			'rounded-lg border px-2 py-1 text-sm font-medium transition-colors inline-flex items-center gap-1.5',
			selected
				? 'border-[#EEEEFF] bg-[#EEEEFF] text-primary'
				: 'border-[#D0D0D0] bg-white text-foreground hover:bg-muted/40',
			disabled && 'cursor-not-allowed opacity-70 hover:bg-white'
		)}
	>
		{label}
		{badge}
	</button>
);

export const PaymentGatewaysSettings: FC<PaymentGatewaysSettingsProps> = ({ form, patch }) => {
	const navigate = useNavigate();
	const isProActive = useIsProActive();
	const onlineLocked = !isProActive;
	const { data: gateways, loading } = useSalesOnlinePaymentGateways();

	// Known slugs first (curated order), then any gateway the backend registered
	// that we have no placeholder for — otherwise it would never render.
	const displayGateways = [
		...ONLINE_PAYMENT_GATEWAYS.map(
			(slug) => gateways.find((gateway) => gateway.slug === slug) ?? GATEWAY_PLACEHOLDERS[slug]
		),
		...gateways.filter(
			(gateway) =>
				!ONLINE_PAYMENT_GATEWAYS.includes(
					gateway.slug as (typeof ONLINE_PAYMENT_GATEWAYS)[number]
				)
		),
	];
	const enabledSlugs = form.enabled_online_gateways ?? [];

	const toggleGatewayEnabled = (slug: string, enabled: boolean) => {
		if (onlineLocked) {
			return;
		}
		const next = enabled
			? [...new Set([...enabledSlugs, slug])]
			: enabledSlugs.filter((s) => s !== slug);
		patch('enabled_online_gateways', next);
	};

	const toggleDefaultOffline = (mode: string) => {
		const current = form.default_offline_payment_modes ?? [];
		const next = current.includes(mode)
			? current.filter((m) => m !== mode)
			: [...current, mode];
		patch('default_offline_payment_modes', next);
	};

	const toggleDefaultOnline = (slug: string) => {
		if (onlineLocked) {
			return;
		}
		const current = form.default_online_payment_gateways ?? [];
		const next = current.includes(slug)
			? current.filter((s) => s !== slug)
			: [...current, slug];
		patch('default_online_payment_gateways', next);
	};

	const openIntegration = (gateway: OnlinePaymentGatewayStatus) => {
		if (gateway.slug === 'stripe' || gateway.slug === 'paypal') {
			navigate(getToLink(`integrations/${gateway.slug}`));
			return;
		}
		if (gateway.integration_url) {
			window.open(gateway.integration_url, '_blank', 'noopener,noreferrer');
		}
	};

	return (
		<div className="space-y-6">
			<SettingsSectionCard
				title={__('Online Payment Gateways', 'doublescale')}
				badge={onlineLocked ? <ProLockBadge /> : null}
				icon={<SettingsPaymentsIcon width={20} height={20} color="#0D9DFC" />}
				description={__(
					'Enable gateways for invoice online payments. API keys are managed globally in Integrations — the same Stripe keys used for Booking apply here.',
					'doublescale'
				)}
			>
				{loading ? (
					<p className="text-sm text-muted-foreground">
						{__('Loading gateways…', 'doublescale')}
					</p>
				) : (
					<div className="grid gap-6">
						{displayGateways.map((gateway) => (
							<GatewayCard
								key={gateway.slug}
								gateway={gateway}
								enabled={enabledSlugs.includes(gateway.slug)}
								locked={onlineLocked}
								onToggle={(value) => toggleGatewayEnabled(gateway.slug, value)}
								onConfigure={() => openIntegration(gateway)}
							/>
						))}
					</div>
				)}
			</SettingsSectionCard>

			<SettingsSectionCard
				title={__('Default Payment Methods for New Invoices', 'doublescale')}
				icon={<PaymentModeIcon width={20} height={20} color="#0D9DFC" />}
				description={__(
					'Pre-selected when creating a new invoice. You can still change them per invoice.',
					'doublescale'
				)}
			>
				<div className="grid gap-6 lg:grid-cols-2">
					<div className="bg-white p-4 sm:p-6 rounded-xl border border-border">
						<div>
							<h3 className="text-base font-semibold text-foreground">
								{__('Offline Methods', 'doublescale')}
							</h3>
							<p className="mt-3 text-sm text-muted-foreground">
								{__(
									'Recorded manually by staff when the customer pays offline.',
									'doublescale'
								)}
							</p>
						</div>
						<div className="flex flex-wrap gap-4 mt-3">
							{OFFLINE_PAYMENT_MODES.map((mode) => (
								<SelectionChip
									key={mode}
									label={OFFLINE_PAYMENT_MODE_LABELS[mode]}
									selected={(form.default_offline_payment_modes ?? []).includes(mode)}
									onClick={() => toggleDefaultOffline(mode)}
								/>
							))}
						</div>
					</div>

					<div className="bg-white p-4 sm:p-6 rounded-xl border border-border">
						<div>
							<h3 className="text-base font-semibold text-foreground flex items-center gap-2">
								{__('Online Gateways', 'doublescale')}
								{onlineLocked ? <ProLockBadge /> : null}
							</h3>
							<p className="mt-3 text-sm text-muted-foreground">
								{__(
									'Shown on the public invoice when balance is due.',
									'doublescale'
								)}
							</p>
						</div>
						<div className="flex flex-wrap gap-4 mt-3">
							{displayGateways.map((gateway) => (
								<SelectionChip
									key={gateway.slug}
									label={
										ONLINE_PAYMENT_GATEWAY_LABELS[
											gateway.slug as keyof typeof ONLINE_PAYMENT_GATEWAY_LABELS
										] ?? gateway.name
									}
									selected={
										!onlineLocked &&
										(form.default_online_payment_gateways ?? []).includes(
											gateway.slug
										)
									}
									disabled={onlineLocked}
									badge={onlineLocked ? <ProLockBadge /> : null}
									onClick={() => toggleDefaultOnline(gateway.slug)}
								/>
							))}
						</div>
					</div>
				</div>
			</SettingsSectionCard>
		</div>
	);
};
