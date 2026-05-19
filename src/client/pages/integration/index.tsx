/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useState } from '@wordpress/element';
import apiFetch from '@wordpress/api-fetch';

/**
 * External dependencies
 */
import { ChevronRight, Loader2 } from 'lucide-react';
import { useRef, useEffect } from 'react';
import { applyFilters } from '@wordpress/hooks';

/**
 * Internal dependencies
 */
import './style.scss';
import type { Integration as IntegrationType } from '@doublescale/config';
import type { NoticeMessage } from '@doublescale/client';
import { getApiErrorMessage } from '@doublescale/utils';
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
import App from './app';
import Instructions from './instructions';
import { Button } from '@doublescale/components/ui/button';
import { NoticeBanner } from '@doublescale/components';
import { ProFeatureNotice } from '@doublescale/components/pro-feature-notice';

interface IntegrationProps {
	open: boolean;
	onClose: () => void;
	integration: IntegrationType;
	slug: string;
	onSuccess?: (integrationLabel: string) => void;
}

/**
 * Parse settings into initial field values based on integration type
 */
const parseSettingsToFieldValues = (
	settings: Record<string, any> | undefined,
	isAppBased: boolean
): Record<string, any> => {
	if (!settings) return {};
	if (!isAppBased) return settings;
	return typeof settings.app === 'object' ? settings.app : {};
};

const Integration: React.FC<IntegrationProps> = ({
	open,
	onClose,
	integration,
	slug,
	onSuccess,
}) => {
	const { fields, label, description, is_pro } = integration;
	const isAppBased = !!fields.app;
	const isProActive = applyFilters('doublescale_is_pro_active', false) as boolean;
	const isProFeature = is_pro === true && !isProActive;

	const [fieldsValue, setFieldsValue] = useState<Record<string, any>>({});
	const [isLoading, setIsLoading] = useState(true);
	const [isSaving, setIsSaving] = useState(false);
	const [notice, setNotice] = useState<NoticeMessage | null>(null);
	const noticeBannerRef = useRef<HTMLDivElement>(null);

	// Fetch fresh settings from API when dialog opens
	useEffect(() => {
		if (!open || !slug) return;

		const loadSettings = async () => {
			setIsLoading(true);
			try {
				const response = await apiFetch<{ settings: Record<string, any> }>({
					path: `/doublescale/v1/integrations/${slug}`,
				});
				setFieldsValue(parseSettingsToFieldValues(response.settings, isAppBased));
			} catch (error) {
				console.error('Failed to load integration settings:', error);
				// Fallback to integration prop settings if API fails
				setFieldsValue(parseSettingsToFieldValues(integration.settings, isAppBased));
			} finally {
				setIsLoading(false);
			}
		};

		loadSettings();
	}, [open, slug, isAppBased]);

	const closeNotice = () => setNotice(null);

	const showError = (error: unknown, fallbackMessage: string) => {
		setNotice({
			type: 'error',
			message: getApiErrorMessage(error, fallbackMessage),
		});
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
			await apiFetch({
				path: `/doublescale/v1/integrations/${slug}`,
				method: 'POST',
				data: {
					settings: isAppBased ? { app: fieldsValue } : fieldsValue,
				},
			});

			if (isAppBased) {
				await getAuthUrl();
			} else {
				onClose();
				onSuccess?.(label);
			}
		} catch (error) {
			showError(error, __('Failed to save settings', 'doublescale'));
		} finally {
			setIsSaving(false);
		}
	};

	const getAuthUrl = async () => {
		try {
			const response = await apiFetch<{ auth_uri?: unknown }>({
				path: `/doublescale/v1/integrations/${slug}/auth`,
			});
			const authUri = response?.auth_uri;
			if ( typeof authUri !== 'string' || ! authUri.trim() ) {
				showError(
					new Error( __( 'Invalid authorization response', 'doublescale' ) ),
					__( 'Failed to get auth url', 'doublescale' )
				);
				return;
			}
			window.location.href = authUri;
		} catch (error) {
			showError(error, __('Failed to get auth url', 'doublescale'));
		} finally {
			setIsSaving(false);
		}
	};

	return (
		<Dialog open={open} onOpenChange={(value) => !value && onClose()}>
			<DialogContent
				className="z-[150300] w-screen h-screen max-w-none overflow-y-auto bg-white rounded-none shadow-none"
				style={{
					paddingTop: '10px',
					paddingLeft: '0px',
					paddingRight: '0px',
				}}
			>
				<DialogHeader className="pb-0 border-b border-[#E4E7EC] h-14">
					<DialogTitle className="px-12 pb-4 pt-2">
						<h1 className="text-base font-normal text-[#667085] flex items-center gap-2">
							{__('Integrations', 'doublescale')}
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
					) : isLoading ? (
						<div className="flex items-center justify-center h-64">
							<Loader2 className="w-8 h-8 animate-spin text-gray-400" />
						</div>
					) : (
						<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
							{/* Instructions Card */}
							<Card className="shadow-none bg-muted/50 h-screen">
								<CardContent className="p-6">
									<Instructions
										slug={slug}
										label={label}
										description={description}
									/>
								</CardContent>
							</Card>

							{/* Credentials/App Card */}
							<Card className="flex shadow-none bg-muted/50 flex-col h-screen">
								<CardContent className="flex-1 overflow-y-auto p-6">
								{!isAppBased ? (
									(() => {
										// Allow Pro plugin to override credentials component
										// Pro plugin provides custom components for Twilio and Meta WhatsApp
										const CredentialsComponent = applyFilters(
											'doublescale_integration_credentials_component',
											Credentials,
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
									disabled={isSaving || isLoading}
									className="min-w-[120px] rounded-lg px-4"
									variant="gradient"
								>
										{isSaving
											? __('Connecting...', 'doublescale')
											: __(`Connect ${label}`, 'doublescale')}
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
