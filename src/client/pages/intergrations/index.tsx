/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
import { useState, useEffect } from '@wordpress/element';
import apiFetch from '@wordpress/api-fetch';
import { addQueryArgs } from '@wordpress/url';

/**
 * External dependencies
 */
import { map } from 'lodash';

/**
 * Internal dependencies
 */
import type { NoticeMessage } from '@quillcrm/client';
import { getToLink, useNavigate, useParams } from '@quillcrm/navigation';
import ConfigAPI from '@quillcrm/config';
import Integration from '../integration';
import { PageHeader, NoticeBanner } from '@quillcrm/components';
import { Card, CardContent } from '@quillcrm/components/ui/card';
import { IntegrationCard } from './integration-card';
import './style.scss';

// Integration images mapping
const integrationImages: Record<string, string> = {
	slack: `${ConfigAPI.getPluginDirUrl()}assets/images/slack/slack.png`,
	twilio: `${ConfigAPI.getPluginDirUrl()}assets/images/twilio/twilio.png`,
};

// Integration keys to display
const INTEGRATIONS_TO_SHOW = ['twilio', 'slack'];

/**
 * Helper function to filter integrations
 */
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
	const navigate = useNavigate();
	const [notice, setNotice] = useState<NoticeMessage | null>(null);
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
				path: addQueryArgs(`/qc/v1/integrations/${integrationKey}`),
				method: 'GET',
			});

			// Update the specific integration in state
			setIntegrations((prev) => ({
				...prev,
				[integrationKey]: {
					...prev[integrationKey],
					// @ts-ignore
					settings: response.settings,
					// @ts-ignore
					is_connected: Object.keys(response.settings || {}).length > 0,
				},
			}));
		} catch (error) {
			console.error('Failed to refresh integration:', error);
		}
	};

	const showNotice = (type: 'success' | 'error', message: string) => {
		setNotice({ type, message });
	};

	const handleSuccess = async (integrationLabel: string, integrationKey?: string) => {
		if (!integrationKey) return;

		setIntegrationLoading(integrationKey, true);
		showNotice(
			'success',
			sprintf(__('You have successfully connected %s', 'quillcrm'), integrationLabel)
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
				path: addQueryArgs(`/qc/v1/integrations/${integrationKey}`),
				method: 'POST',
				data: { settings: {} },
			});

			showNotice(
				'success',
				sprintf(__('You have successfully disconnected %s', 'quillcrm'), integrationLabel)
			);

			await refreshIntegration(integrationKey);
		} catch (error) {
			showNotice(
				'error',
				sprintf(__('Failed to disconnect %s', 'quillcrm'), integrationLabel)
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
				sprintf(__('You have successfully connected %s', 'quillcrm'), integration.label)
			);

			refreshIntegration(id).finally(() => {
				setIntegrationLoading(id, false);
			});

			navigate(getToLink('integrations'));
		}
	}, [tab, id]);

	return (
		<div className="qcrm-integrations">
			<PageHeader
				title={__('Integrations', 'quillcrm')}
				subtitle={__('Integrations', 'quillcrm')}
				actions={[]}
			/>

			{notice && <NoticeBanner notice={notice} closeNotice={closeNotice} />}

			<Card className="shadow-none bg-[#F8F8F8]">
				<CardContent className="flex gap-4 items-center flex-wrap p-6">
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
				</CardContent>
			</Card>

			{id && !tab && (
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
