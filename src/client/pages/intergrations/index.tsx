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
import './style.scss';
import type { NoticeMessage } from '@quillcrm/client';
import { getToLink, useNavigate, useParams } from '@quillcrm/navigation';
import ConfigAPI from '@quillcrm/config';
import Integration from '../integration';
import { PageHeader, PlusIcon, NoticeBanner } from '@quillcrm/components';
import { Card, CardContent } from '@quillcrm/components/ui/card';
import { Button } from '@quillcrm/components/ui/button';
import { Check } from 'lucide-react';

// Integration images mapping
const integrationImages: Record<string, string> = {
	slack: `${ConfigAPI.getPluginDirUrl()}assets/images/slack/slack.png`,
	twilio: `${ConfigAPI.getPluginDirUrl()}assets/images/twilio/twilio.png`,
};

const Integrations: React.FC = () => {
	const { id, tab } = useParams<{ id: string; tab: string }>();
	const allIntegrations = ConfigAPI.getIntegrations();
	const navigate = useNavigate();
	const [notice, setNotice] = useState<NoticeMessage | null>(null);

	// Filter to show only Twilio and Slack
	const integrationsToShow = ['twilio', 'slack'];
	const integrations = Object.keys(allIntegrations)
		.filter((key) => integrationsToShow.includes(key))
		.reduce(
			(obj, key) => {
				obj[key] = allIntegrations[key];
				return obj;
			},
			{} as typeof allIntegrations
		);

	const closeNotice = () => {
		setNotice(null);
	};

	useEffect(() => {
		if (tab && id) {
			const integration = allIntegrations[id];

			if (tab === 'success') {
				setNotice({
					type: 'success',
					message: sprintf(
						__('You have successfully connected %s', 'quillcrm'),
						integration.label
					),
				});
				// Navigate back to integrations without the success tab
				navigate(getToLink('integrations'));
			}
		}
	}, [tab, id]);

	const handleSuccess = (integrationLabel: string) => {
		setNotice({
			type: 'success',
			message: sprintf(
				__('You have successfully connected %s', 'quillcrm'),
				integrationLabel
			),
		});
	};

	const handleDisconnect = async (integrationKey: string, integrationLabel: string) => {
		try {
			// Call API to disconnect by clearing settings
			// @ts-ignore
			await apiFetch({
				path: addQueryArgs(`/qc/v1/integrations/${integrationKey}`),
				method: 'POST',
				data: {
					settings: {},
				},
			});

			setNotice({
				type: 'success',
				message: sprintf(
					__('You have successfully disconnected %s', 'quillcrm'),
					integrationLabel
				),
			});

			// Refresh the page to reflect disconnection
			window.location.reload();
		} catch (error) {
			setNotice({
				type: 'error',
				message: sprintf(
					__('Failed to disconnect %s', 'quillcrm'),
					integrationLabel
				),
			});
		}
	};

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
					{map(integrations, (integration, key) => {
						const imageUrl = integrationImages[key];
						return (
							<Card key={key} className="shadow-none max-w-md">
								<CardContent className="p-4">
									<div className="flex items-center justify-between mb-3">
										<div className="flex items-center gap-4">
											{imageUrl && (
												<div className="">
													<img
														src={imageUrl}
														alt={integration.label}
														className="max-w-[100px] h-auto"
													/>
												</div>
											)}
											<div className="font-semibold text-xl">
												{integration.label}
											</div>
										</div>
										{integration.is_connected && (
											<div className="text-white bg-[#16A34A] rounded-full p-1">
												<Check className="w-4 h-4" />
											</div>
										)}
									</div>

									<div className="text-base text-gray-500 border-b pb-3">
										{integration.description}
									</div>
									<div className="flex items-center justify-end gap-3 mt-4">
										<Button
											onClick={() =>
												navigate(
													getToLink(
														`integrations/${key}`
													)
												)
											}
											variant="secondary"
											className='rounded-lg'
										>
											{integration.is_connected ? (
												__('Settings', 'quillcrm')
											) : (
												<>
													{__(
														'Connect Now',
														'quillcrm'
													)}
													<PlusIcon />
												</>
											)}
										</Button>
										{integration.is_connected && (
											<Button
												variant="destructive"
												className='rounded-lg'
												onClick={() => handleDisconnect(key, integration.label)}
											>
												{__('Disconnect', 'quillcrm')}
											</Button>
										)}
									</div>
								</CardContent>
							</Card>
						);
					})}
				</CardContent>
			</Card>

			{id && !tab && (
				<Integration
					integration={allIntegrations[id]}
					slug={id}
					open={!!id}
					onClose={() => navigate(getToLink('integrations'))}
					onSuccess={handleSuccess}
				/>
			)}
		</div>
	);
};

export default Integrations;
