/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
import { useState, useEffect } from '@wordpress/element';
import { useRef } from 'react';
import apiFetch from '@wordpress/api-fetch';
import { addQueryArgs } from '@wordpress/url';

/**
 * External dependencies
 */
import { map } from 'lodash';

/**
 * Internal dependencies
 */
import type { NoticeMessage } from '@doublescale/client';
import { getToLink, useNavigate, useParams } from '@doublescale/navigation';
import ConfigAPI from '@doublescale/config';
import Integration from '../integration';
import { PageHeader, NoticeBanner } from '@doublescale/components';
import { Card, CardContent } from '@doublescale/components/ui/card';
import { IntegrationCard } from './integration-card';
import { AddonCard } from './addon-card';
import './style.scss';

// @ts-ignore
import slackImg from '@doublescale/assets/images/slack/slack.png';
// @ts-ignore
import twilioImg from '@doublescale/assets/images/twilio/twilio.png';
// @ts-ignore
import stripeImg from '@doublescale/assets/images/stripe/stripe.png';
// @ts-ignore
import paypalImg from '@doublescale/assets/images/paypal/paypal.png';
// @ts-ignore
import metaWhatsappImg from '@doublescale/assets/images/meta-whatsapp/meta-whatsapp.svg';

const proPluginUrl =
	(typeof window !== 'undefined' &&
		(
			window as unknown as {
				doublescalePro?: { proPluginUrl?: string };
			}
		).doublescalePro?.proPluginUrl) ||
	ConfigAPI.getPluginDirUrl();

const integrationImages: Record<string, string> = {
	slack: slackImg,
	twilio: twilioImg,
	stripe: stripeImg,
	paypal: paypalImg,
	'meta-whatsapp': metaWhatsappImg,
	zapier: `${proPluginUrl}assets/images/zapier/zapier.svg`,
	make: `${proPluginUrl}assets/images/make/make.svg`,
};

const INTEGRATIONS_TO_SHOW = ['twilio', 'stripe', 'paypal', 'slack', 'meta-whatsapp', 'zapier', 'make'];

const ADDON_INTEGRATIONS = ['zapier', 'make'];

const filterIntegrations = (allIntegrations: any) => {
	return Object.keys(allIntegrations)
		.filter((key) => INTEGRATIONS_TO_SHOW.includes(key))
		.reduce(
			(obj, key) => {
				obj[key] = allIntegrations[key];
				return obj;
			},
			{} as typeof allIntegrations
		);
};

const Integrations: React.FC = () => {
	const { id, tab } = useParams<{ id: string; tab: string }>();
	const allIntegrations = ConfigAPI.getIntegrations();
	const addons = ConfigAPI.getAddons();
	const navigate = useNavigate();
	const [notice, setNotice] = useState<NoticeMessage | null>(null);
	const noticeBannerRef = useRef<HTMLDivElement>(null);
	const [loadingIntegrations, setLoadingIntegrations] = useState<Record<string, boolean>>({});
	const [integrations, setIntegrations] = useState(() => filterIntegrations(allIntegrations));

	const closeNotice = () => {
		setNotice(null);
	};

	const setIntegrationLoading = (key: string, loading: boolean) => {
		setLoadingIntegrations((prev) => ({ ...prev, [key]: loading }));
	};

	const refreshIntegration = async (integrationKey: string) => {
		try {
			// @ts-ignore
			const response = await apiFetch({
				path: addQueryArgs(`/doublescale/v1/integrations/${integrationKey}`),
				method: 'GET',
			});

			setIntegrations((prev) => ({
				...prev,
				[integrationKey]: {
					...prev[integrationKey],
					// @ts-ignore
					settings: response.settings,
					// @ts-ignore
					is_connected:
						typeof response.is_connected === 'boolean'
							? response.is_connected
							: Object.keys(response.settings || {}).length > 0,
				},
			}));
		} catch (error) {
			console.error('Failed to refresh integration:', error);
		}
	};

	const showNotice = (type: 'success' | 'error', message: string) => {
		setNotice({ type, message });
	};

	useEffect(() => {
		if (notice && noticeBannerRef.current) {
			noticeBannerRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
		}
	}, [notice]);

	useEffect(() => {
		INTEGRATIONS_TO_SHOW.forEach((integrationKey) => {
			void refreshIntegration(integrationKey);
		});
	}, []);

	const handleSuccess = async (integrationLabel: string, integrationKey?: string) => {
		if (!integrationKey) return;

		setIntegrationLoading(integrationKey, true);
		showNotice(
			'success',
			sprintf(__('You have successfully connected %s', 'doublescale'), integrationLabel)
		);

		try {
			await refreshIntegration(integrationKey);
		} finally {
			setIntegrationLoading(integrationKey, false);
		}
	};

	const handleDisconnect = async (integrationKey: string, integrationLabel: string) => {
		setIntegrationLoading(integrationKey, true);

		try {
			// @ts-ignore
			await apiFetch({
				path: addQueryArgs(`/doublescale/v1/integrations/${integrationKey}`),
				method: 'POST',
				data: { settings: {} },
			});

			showNotice(
				'success',
				sprintf(__('You have successfully disconnected %s', 'doublescale'), integrationLabel)
			);

			await refreshIntegration(integrationKey);
		} catch (error) {
			showNotice(
				'error',
				sprintf(__('Failed to disconnect %s', 'doublescale'), integrationLabel)
			);
		} finally {
			setIntegrationLoading(integrationKey, false);
		}
	};

	useEffect(() => {
		if (tab === 'success' && id) {
			const integration = allIntegrations[id];

			setIntegrationLoading(id, true);
			showNotice(
				'success',
				sprintf(__('You have successfully connected %s', 'doublescale'), integration.label)
			);

			refreshIntegration(id).finally(() => {
				setIntegrationLoading(id, false);
			});

			navigate(getToLink('integrations'));
		}
	}, [tab, id]);

	const inactiveAddons = ADDON_INTEGRATIONS.filter(
		(key) => !integrations[key] && addons[key]
	);

	return (
		<div className="doublescale-integrations">
			<PageHeader
				title={__('Integrations', 'doublescale')}
				subtitle={__('Integrations', 'doublescale')}
				actions={[]}
			/>

			{notice && <NoticeBanner ref={noticeBannerRef} notice={notice} closeNotice={closeNotice} />}

			<Card className="shadow-none bg-muted/50">
				<CardContent className="p-6">
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
						{map(integrations, (integration, key) => (
							<IntegrationCard
								key={key}
								integrationKey={key}
								integration={integration}
								imageUrl={integrationImages[key]}
								isLoading={loadingIntegrations[key]}
								onNavigate={() => navigate(getToLink(`integrations/${key}`))}
								onDisconnect={() => handleDisconnect(key, integration.label)}
							/>
						))}
						{inactiveAddons.map((key) => (
							<AddonCard
								key={key}
								addon={addons[key]}
								imageUrl={integrationImages[key]}
							/>
						))}
					</div>
				</CardContent>
			</Card>

			{id && !tab && allIntegrations[id] && (
				<Integration
					integration={allIntegrations[id]}
					slug={id}
					open={!!id}
					onClose={() => navigate(getToLink('integrations'))}
					onSuccess={(label) => handleSuccess(label, id)}
				/>
			)}
		</div>
	);
};

export default Integrations;
