/**
 * Sales payment gateways and default invoice payment methods.
 */

import React from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { ExternalLink, Settings2 } from 'lucide-react';

import { useNavigate, getToLink } from '@doublescale/navigation';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { useSalesOnlinePaymentGateways } from '@/hooks/sales';
import type { OnlinePaymentGatewayStatus, SalesSettings } from '@/types/sales';
import {
	OFFLINE_PAYMENT_MODES,
	OFFLINE_PAYMENT_MODE_LABELS,
	ONLINE_PAYMENT_GATEWAY_LABELS,
} from '@/constants/sales';

interface PaymentGatewaysSettingsProps {
	form: SalesSettings;
	patch: (key: keyof SalesSettings, value: SalesSettings[keyof SalesSettings]) => void;
}

const STRIPE_PLACEHOLDER: OnlinePaymentGatewayStatus = {
	slug: 'stripe',
	name: 'Stripe',
	description: __(
		'Accept credit and debit card payments online. Credentials are managed in CRM Settings → Integrations → Stripe.',
		'doublescale'
	),
	available: false,
	configured: false,
	enabled_for_sales: false,
	ready: false,
};

const GatewayStatusBadges: React.FC<{ gateway: OnlinePaymentGatewayStatus }> = ({ gateway }) => {
	if (!gateway.available) {
		return (
			<Badge variant="secondary" className="text-xs">
				{__('Requires Pro', 'doublescale')}
			</Badge>
		);
	}
	if (!gateway.configured) {
		return (
			<Badge variant="outline" className="text-xs border-amber-300 text-amber-800 bg-amber-50">
				{__('Not configured', 'doublescale')}
			</Badge>
		);
	}
	if (gateway.ready) {
		return (
			<Badge variant="default" className="text-xs bg-emerald-600">
				{__('Ready', 'doublescale')}
			</Badge>
		);
	}
	return (
		<Badge variant="outline" className="text-xs">
			{__('Disabled', 'doublescale')}
		</Badge>
	);
};

const GatewayCard: React.FC<{
	gateway: OnlinePaymentGatewayStatus;
	enabled: boolean;
	onToggle: (enabled: boolean) => void;
	onConfigure: () => void;
}> = ({ gateway, enabled, onToggle, onConfigure }) => (
	<div className="border rounded-lg p-4 space-y-3 bg-white">
		<div className="flex items-start justify-between gap-4">
			<div className="space-y-1 min-w-0">
				<div className="flex flex-wrap items-center gap-2">
					<h3 className="font-medium">{gateway.name}</h3>
					<GatewayStatusBadges gateway={gateway} />
				</div>
				{gateway.description ? (
					<p className="text-sm text-muted-foreground">{gateway.description}</p>
				) : null}
			</div>
			<div className="flex items-center gap-2 shrink-0">
				<Label htmlFor={`gateway-${gateway.slug}`} className="text-sm text-muted-foreground">
					{__('Enabled', 'doublescale')}
				</Label>
				<Switch
					id={`gateway-${gateway.slug}`}
					checked={enabled}
					disabled={!gateway.available}
					onCheckedChange={onToggle}
				/>
			</div>
		</div>
		{gateway.slug === 'stripe' || gateway.slug === 'paypal' || gateway.integration_url ? (
			<Button type="button" variant="outline" size="sm" onClick={onConfigure}>
				<Settings2 className="h-4 w-4 mr-1" />
				{__('Configure in Integrations', 'doublescale')}
				<ExternalLink className="h-3 w-3 ml-1 opacity-60" />
			</Button>
		) : null}
	</div>
);

export const PaymentGatewaysSettings: React.FC<PaymentGatewaysSettingsProps> = ({ form, patch }) => {
	const navigate = useNavigate();
	const { data: gateways, loading } = useSalesOnlinePaymentGateways();

	const displayGateways = gateways.length > 0 ? gateways : [STRIPE_PLACEHOLDER];
	const enabledSlugs = form.enabled_online_gateways ?? [];

	const toggleGatewayEnabled = (slug: string, enabled: boolean) => {
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
		const current = form.default_online_payment_gateways ?? [];
		const next = current.includes(slug)
			? current.filter((s) => s !== slug)
			: [...current, slug];
		patch('default_online_payment_gateways', next);
	};

	const openIntegration = (gateway: OnlinePaymentGatewayStatus) => {
		if (gateway.slug === 'stripe' || gateway.slug === 'paypal') {
			navigate(getToLink(`integrations/${gateway.slug}`));
		}
	};

	const enabledOnlineForDefaults = displayGateways.filter(
		(g) => g.available && enabledSlugs.includes(g.slug)
	);

	return (
		<div className="space-y-6">
			<section className="space-y-4 border rounded-lg bg-white p-6">
				<div>
					<h2 className="font-medium">{__('Online payment gateways', 'doublescale')}</h2>
					<p className="text-sm text-muted-foreground mt-1">
						{__(
							'Enable gateways for invoice online payments. API keys are managed globally in Integrations — the same Stripe keys used for Booking apply here.',
							'doublescale'
						)}
					</p>
				</div>
				{loading ? (
					<p className="text-sm text-muted-foreground">{__('Loading gateways…', 'doublescale')}</p>
				) : (
					<div className="space-y-3">
						{displayGateways.map((gateway) => (
							<GatewayCard
								key={gateway.slug}
								gateway={gateway}
								enabled={enabledSlugs.includes(gateway.slug)}
								onToggle={(v) => toggleGatewayEnabled(gateway.slug, v)}
								onConfigure={() => openIntegration(gateway)}
							/>
						))}
					</div>
				)}
			</section>

			<section className="space-y-4 border rounded-lg bg-white p-6">
				<div>
					<h2 className="font-medium">{__('Default payment methods for new invoices', 'doublescale')}</h2>
					<p className="text-sm text-muted-foreground mt-1">
						{__(
							'Pre-selected when creating a new invoice. You can still change them per invoice.',
							'doublescale'
						)}
					</p>
				</div>

				<div className="space-y-2">
					<Label>{__('Offline methods', 'doublescale')}</Label>
					<p className="text-xs text-muted-foreground">
						{__('Recorded manually by staff when the customer pays offline.', 'doublescale')}
					</p>
					<div className="flex flex-wrap gap-2">
						{OFFLINE_PAYMENT_MODES.map((mode) => (
							<button
								key={mode}
								type="button"
								className={`px-3 py-1 rounded border text-sm ${
									(form.default_offline_payment_modes ?? []).includes(mode)
										? 'bg-primary text-white border-primary'
										: 'bg-white'
								}`}
								onClick={() => toggleDefaultOffline(mode)}
							>
								{OFFLINE_PAYMENT_MODE_LABELS[mode]}
							</button>
						))}
					</div>
				</div>

				<div className="space-y-2">
					<Label>{__('Online gateways', 'doublescale')}</Label>
					<p className="text-xs text-muted-foreground">
						{__('Shown on the public invoice when balance is due.', 'doublescale')}
					</p>
					{enabledOnlineForDefaults.length === 0 ? (
						<p className="text-sm text-muted-foreground">
							{__('Enable an online gateway above to set defaults.', 'doublescale')}
						</p>
					) : (
						<div className="flex flex-wrap gap-2">
							{enabledOnlineForDefaults.map((gateway) => (
								<button
									key={gateway.slug}
									type="button"
									className={`px-3 py-1 rounded border text-sm ${
										(form.default_online_payment_gateways ?? []).includes(gateway.slug)
											? 'bg-primary text-white border-primary'
											: 'bg-white'
									}`}
									onClick={() => toggleDefaultOnline(gateway.slug)}
								>
									{ONLINE_PAYMENT_GATEWAY_LABELS[gateway.slug as keyof typeof ONLINE_PAYMENT_GATEWAY_LABELS] ??
										gateway.name}
								</button>
							))}
						</div>
					)}
				</div>
			</section>
		</div>
	);
};
