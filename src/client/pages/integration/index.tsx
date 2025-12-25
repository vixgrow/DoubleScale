/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useState } from '@wordpress/element';
import apiFetch from '@wordpress/api-fetch';
import { addQueryArgs } from '@wordpress/url';

/**
 * External dependencies
 */
import { ChevronRight } from 'lucide-react';
import { useRef, useEffect } from 'react';
import { applyFilters } from '@wordpress/hooks';

/**
 * Internal dependencies
 */
import './style.scss';
import type { Integration as IntegrationType } from '@quillcrm/config';
import type { NoticeMessage } from '@quillcrm/client';
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog';
import {
	Card,
	CardContent,
	CardFooter,
} from '@/components/ui/card';
import Credentials from './credentials';
import TwilioCredentials from './twilio-credentials';
import App from './app';
import Instructions from './instructions';
import { Button } from '@quillcrm/components/ui/button';
import { NoticeBanner } from '@quillcrm/components';
import { ProFeatureNotice } from '@quillcrm/components/pro-feature-notice';

interface IntegrationProps {
	open: boolean;
	onClose: () => void;
	integration: IntegrationType;
	slug: string;
	onSuccess?: (integrationLabel: string) => void;
}

const Integration: React.FC<IntegrationProps> = ({
	open,
	onClose,
	integration,
	slug,
	onSuccess,
}) => {
	const { fields, settings, label, description, is_pro } = integration;
	const isAppBased = !!fields.app;
	const isProActive = applyFilters('quillcrm_is_pro_active', false) as boolean;
	const isProFeature = is_pro === true && !isProActive;

	const initialValues = isAppBased
		? typeof settings.app === 'object'
			? settings.app
			: {}
		: settings || {};

	const [fieldsValue, setFieldsValue] =
		useState<Record<string, any>>(initialValues);
	const [isSaving, setIsSaving] = useState(false);
	const [notice, setNotice] = useState<NoticeMessage | null>(null);
	const noticeBannerRef = useRef<HTMLDivElement>(null);

	const closeNotice = () => {
		setNotice(null);
	};

	// Scroll to notice banner when notice appears
	useEffect(() => {
		if (notice && noticeBannerRef.current) {
			noticeBannerRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
		}
	}, [notice]);

	const save = async () => {
		setIsSaving(true);

		try {
			// @ts-ignore
			await apiFetch({
				path: addQueryArgs(`/qc/v1/integrations/${slug}`),
				method: 'POST',
				data: {
					settings: isAppBased ? { app: fieldsValue } : fieldsValue,
				},
			});

			if (isAppBased) {
				await getAuthUrl();
			} else {
				onClose();
				if (onSuccess) {
					onSuccess(label);
				}
			}
		} catch (error) {
			setNotice({
				type: 'error',
				message: __('Failed to save settings', 'quillcrm'),
			});
		} finally {
			setIsSaving(false);
		}
	};

	const getAuthUrl = async () => {
		try {
			const response = (await apiFetch({
				path: addQueryArgs(`/qc/v1/integrations/${slug}/auth`),
				method: 'GET',
			})) as { auth_uri: string };

			window.location.href = response.auth_uri;
		} catch (error) {
			setNotice({
				type: 'error',
				message: __('Failed to get auth url', 'quillcrm'),
			});
		} finally {
			setIsSaving(false);
		}
	};

	return (
		<Dialog open={open} onOpenChange={(value) => !value && onClose()}>
			<DialogContent
				className="z-[150000] w-screen h-screen max-w-none overflow-y-auto bg-white rounded-none shadow-none"
				style={{
					paddingTop: '10px',
					paddingLeft: '0px',
					paddingRight: '0px',
				}}
			>
				<DialogHeader className="pb-0 border-b border-[#E4E7EC] h-14">
					<DialogTitle className="px-12 pb-4 pt-2">
						<h1 className="text-base font-normal text-[#667085] flex items-center gap-2">
							{__('Integrations', 'quillcrm')}
							<ChevronRight className="w-4 h-4 text-[#667085]" />
							{label}
						</h1>
					</DialogTitle>
				</DialogHeader>

				{notice && (
					<div className="px-12">
						<NoticeBanner ref={noticeBannerRef} notice={notice} closeNotice={closeNotice} />
					</div>
				)}

				<div className="px-12 pb-12 h-screen pt-4">
					{isProFeature ? (
						<ProFeatureNotice
							featureName={label}
							description={description}
						/>
					) : (
						<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
							{/* Instructions Card */}
							<Card className="shadow-none bg-[#F8F8F8] h-screen">
								<CardContent className="p-6">
									<Instructions
										slug={slug}
										label={label}
										description={description}
									/>
								</CardContent>
							</Card>

							{/* Credentials/App Card */}
							<Card className="flex shadow-none bg-[#F8F8F8] flex-col h-screen">
								<CardContent className="flex-1 overflow-y-auto p-6">
								{!isAppBased ? (
									(() => {
										// Determine default component based on slug
										// Twilio has a custom component with test connection in base plugin
										let DefaultComponent = Credentials;
										if (slug === 'twilio') {
											DefaultComponent = TwilioCredentials;
										}
										// Allow Pro plugin to override credentials component
										const CredentialsComponent = applyFilters(
											'quillcrm_integration_credentials_component',
											DefaultComponent,
											slug
										) as React.ComponentType<{
											integration: typeof integration;
											slug: string;
											fieldsValue: Record<string, any>;
											setFieldsValue: (value: Record<string, any>) => void;
										}>;
										return (
											<CredentialsComponent
												integration={integration}
												slug={slug}
												fieldsValue={fieldsValue}
												setFieldsValue={setFieldsValue}
											/>
										);
									})()
								) : (
										<App
											integration={integration}
											fieldsValue={fieldsValue}
											setFieldsValue={setFieldsValue}
										/>
									)}
								</CardContent>
								<CardFooter className="border-t bg-white rounded-b-xl p-4 mt-auto justify-end">
									<Button
										onClick={save}
										disabled={isSaving}
										className="min-w-[120px] rounded-lg px-0"
										variant="gradient"
									>
										{isSaving
											? __('Connecting...', 'quillcrm')
											: __(`Connect ${label}`, 'quillcrm')}
									</Button>
								</CardFooter>
							</Card>
						</div>
					)}
				</div>
			</DialogContent>
		</Dialog>
	);
};

export default Integration;
