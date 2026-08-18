/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
import { useState, useEffect, useMemo } from '@wordpress/element';
import { useRef } from 'react';
import apiFetch from '@wordpress/api-fetch';
import { addQueryArgs } from '@wordpress/url';

/**
 * External dependencies
 */
import { CreditCard, MessageSquare, ClipboardList, Workflow, Blocks } from 'lucide-react';

/**
 * Internal dependencies
 */
import type { NoticeMessage } from '@doublescale/client';
import { getToLink, useNavigate, useParams } from '@doublescale/navigation';
import ConfigAPI from '@doublescale/config';
import Integration from '../integration';
import { PageHeader, NoticeBanner, PageTabs } from '@doublescale/components';
import { Card, CardContent } from '@doublescale/components/ui/card';
import { IntegrationCard } from './integration-card';
import { AddonCard } from './addon-card';
import './style.scss';

type CatalogCategory = 'payment' | 'messaging' | 'forms' | 'automation' | 'other';

const freePluginUrl = ConfigAPI.getPluginDirUrl().replace(/\/?$/, '/');
const proPluginUrl =
	(typeof window !== 'undefined' &&
		(
			window as unknown as {
				doublescalePro?: { proPluginUrl?: string };
			}
		).doublescalePro?.proPluginUrl) ||
	freePluginUrl;

/**
 * Fallback icons for older payloads that omit `icon_url`.
 * New integrations should set `show_in_catalog` + `get_icon_url()` in PHP.
 */
const fallbackIntegrationImages: Record<string, string> = {
	slack: `${freePluginUrl}assets/images/slack/slack.png`,
	twilio: `${freePluginUrl}assets/images/twilio/twilio.png`,
	stripe: `${freePluginUrl}assets/images/stripe/stripe.png`,
	paypal: `${freePluginUrl}assets/images/paypal/paypal.png`,
	'meta-whatsapp': `${freePluginUrl}assets/images/meta-whatsapp/meta-whatsapp.svg`,
	typeform: `${freePluginUrl}assets/images/typeform/typeform.svg`,
	jotform: `${freePluginUrl}assets/images/jotform/jotform.png`,
	zapier: `${freePluginUrl}assets/images/zapier/zapier.svg`,
	make: `${proPluginUrl}assets/images/make/make.svg`,
};

/** Addon store cards when the addon plugin is not active yet. */
const ADDON_INTEGRATIONS = ['zapier', 'make'];

const CATALOG_CATEGORIES: CatalogCategory[] = [
	'payment',
	'messaging',
	'forms',
	'automation',
	'other',
];

const CATEGORY_BY_SLUG: Record<string, CatalogCategory> = {
	stripe: 'payment',
	paypal: 'payment',
	square: 'payment',
	mollie: 'payment',
	razorpay: 'payment',
	authorize_net: 'payment',
	twilio: 'messaging',
	slack: 'messaging',
	'meta-whatsapp': 'messaging',
	typeform: 'forms',
	jotform: 'forms',
	zapier: 'automation',
	make: 'automation',
};

const getCatalogCategory = (
	key: string,
	integration?: { catalog_category?: string }
): CatalogCategory => {
	const fromApi = integration?.catalog_category;
	if (
		fromApi &&
		CATALOG_CATEGORIES.includes(fromApi as CatalogCategory)
	) {
		return fromApi as CatalogCategory;
	}
	return CATEGORY_BY_SLUG[key] ?? 'other';
};

const catalogTabMeta: Record<
	CatalogCategory,
	{ label: string; icon: JSX.Element }
> = {
	payment: {
		label: __('Payment Gateway', 'doublescale'),
		icon: <CreditCard className="h-4 w-4" />,
	},
	messaging: {
		label: __('Messaging', 'doublescale'),
		icon: <MessageSquare className="h-4 w-4" />,
	},
	forms: {
		label: __('Forms', 'doublescale'),
		icon: <ClipboardList className="h-4 w-4" />,
	},
	automation: {
		label: __('Automation', 'doublescale'),
		icon: <Workflow className="h-4 w-4" />,
	},
	other: {
		label: __('Other', 'doublescale'),
		icon: <Blocks className="h-4 w-4" />,
	},
};

/**
 * Catalog is backend-driven: any registered integration with `show_in_catalog: true`.
 */
const filterIntegrations = (allIntegrations: any) => {
	return Object.keys(allIntegrations)
		.filter((key) => allIntegrations[key]?.show_in_catalog === true)
		.reduce(
			(obj, key) => {
				obj[key] = allIntegrations[key];
				return obj;
			},
			{} as typeof allIntegrations
		);
};

const getIntegrationImage = (key: string, integration: any): string | undefined => {
	if (integration?.icon_url) {
		return integration.icon_url as string;
	}
	return fallbackIntegrationImages[key];
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
	const [activeCategory, setActiveCategory] = useState<CatalogCategory>(() =>
		id ? getCatalogCategory(id, allIntegrations[id]) : 'payment'
	);

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

			setIntegrations((prev) => {
				if (!prev[integrationKey]) {
					return prev;
				}
				return {
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
				};
			});

			const connected =
				typeof response.is_connected === 'boolean'
					? response.is_connected
					: Object.keys(response.settings || {}).length > 0;
			const globalIntegrations = ConfigAPI.getIntegrations();
			if (globalIntegrations[integrationKey]) {
				ConfigAPI.setIntegrations({
					...globalIntegrations,
					[integrationKey]: {
						...globalIntegrations[integrationKey],
						// @ts-ignore
						settings: response.settings,
						is_connected: connected,
					},
				});
			}
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
		Object.keys(integrations).forEach((integrationKey) => {
			void refreshIntegration(integrationKey);
		});
		// eslint-disable-next-line react-hooks/exhaustive-deps -- initial catalog hydrate only
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

	useEffect(() => {
		if (id && allIntegrations[id]) {
			setActiveCategory(getCatalogCategory(id, allIntegrations[id]));
		}
	}, [id, allIntegrations]);

	const grouped = useMemo(() => {
		const buckets: Record<CatalogCategory, string[]> = {
			payment: [],
			messaging: [],
			forms: [],
			automation: [],
			other: [],
		};

		Object.keys(integrations).forEach((key) => {
			buckets[getCatalogCategory(key, integrations[key])].push(key);
		});
		inactiveAddons.forEach((key) => {
			buckets[getCatalogCategory(key)].push(`addon:${key}`);
		});

		return buckets;
	}, [integrations, inactiveAddons]);

	const visibleCategories = CATALOG_CATEGORIES.filter(
		(category) => grouped[category].length > 0
	);

	useEffect(() => {
		if (
			visibleCategories.length > 0 &&
			!visibleCategories.includes(activeCategory)
		) {
			setActiveCategory(visibleCategories[0]);
		}
	}, [visibleCategories, activeCategory]);

	const renderCategoryGrid = (category: CatalogCategory) => (
		<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
			{grouped[category].map((entry) => {
				if (entry.startsWith('addon:')) {
					const key = entry.slice('addon:'.length);
					return (
						<AddonCard
							key={entry}
							addon={addons[key]}
							imageUrl={fallbackIntegrationImages[key]}
						/>
					);
				}

				const integration = integrations[entry];
				return (
					<IntegrationCard
						key={entry}
						integrationKey={entry}
						integration={integration}
						imageUrl={getIntegrationImage(entry, integration)}
						isLoading={loadingIntegrations[entry]}
						onNavigate={() => navigate(getToLink(`integrations/${entry}`))}
						onDisconnect={() => handleDisconnect(entry, integration.label)}
					/>
				);
			})}
		</div>
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
					{visibleCategories.length > 0 ? (
						<PageTabs
							value={activeCategory}
							defaultValue={visibleCategories[0]}
							onValueChange={(value) =>
								setActiveCategory(value as CatalogCategory)
							}
							tabsVariant="underline"
							enableHorizontalScroll
							tabsListWrapperClassName="border-b border-border pb-0 mb-6"
							tabsListClassName="gap-6"
							scrollArrowBg="bg-muted"
							tabsList={visibleCategories.map((category) => ({
								value: category,
								label: catalogTabMeta[category].label,
								icon: catalogTabMeta[category].icon,
							}))}
							tabsContent={visibleCategories.map((category) => ({
								value: category,
								children: renderCategoryGrid(category),
							}))}
						/>
					) : null}
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
