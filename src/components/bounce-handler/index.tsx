/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useState, useEffect, useRef } from '@wordpress/element';
import apiFetch from '@wordpress/api-fetch';

/**
 * External dependencies
 */
import { Check, ExternalLink } from 'lucide-react';

/**
 * Internal dependencies
 */
import { CopyIcon, NoticeBanner } from '@doublescale/components';
import type { NoticeMessage } from '@doublescale/client';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface BounceWebhook {
	slug: string;
	name: string;
	url: string;
	description?: string;
	doc_url?: string;
	setup_instructions?: string;
}

interface BounceWebhooks {
	[provider: string]: BounceWebhook;
}

export const BounceHandler: React.FC = () => {
	const [selectedProvider, setSelectedProvider] = useState<string>('');
	const [webhooks, setWebhooks] = useState<BounceWebhooks | null>(null);
	const [isLoadingWebhooks, setIsLoadingWebhooks] = useState(false);
	const [copied, setCopied] = useState(false);
	const [notice, setNotice] = useState<NoticeMessage | null>(null);
	const noticeBannerRef = useRef<HTMLDivElement>(null);

	// Fetch webhooks on component mount
	useEffect(() => {
		fetchWebhooks();
	}, []);

	const fetchWebhooks = async () => {
		try {
			setIsLoadingWebhooks(true);
			const response = (await apiFetch({
				path: '/doublescale/v1/settings/bounce-webhooks',
			})) as BounceWebhooks;
			setWebhooks(response);
		} catch (error: any) {
			setNotice({
				type: 'error',
				message: error?.message || __('Failed to fetch bounce webhooks.', 'doublescale'),
			});
			console.error('Failed to fetch bounce webhooks:', error);
		} finally {
			setIsLoadingWebhooks(false);
		}
	};

	const handleCopyWebhook = async () => {
		if (!selectedProvider || !webhooks?.[selectedProvider]) return;

		try {
			await navigator.clipboard.writeText(webhooks[selectedProvider].url);
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
		} catch (err) {
			console.error('Failed to copy:', err);
		}
	};

	const selectedWebhook = selectedProvider && webhooks ? webhooks[selectedProvider] : null;

	// Get sorted provider list for dropdown
	const providersList = webhooks
		? Object.values(webhooks).sort((a, b) => a.name.localeCompare(b.name))
		: [];

	return (
		<div className="bounce-handler-section">
			<div className="text-[#09090B] font-semibold text-xl mb-4">
				{__('Bounce Handler', 'doublescale')}
			</div>

			{notice && (
				<NoticeBanner
					ref={noticeBannerRef}
					notice={notice}
					closeNotice={() => setNotice(null)}
				/>
			)}

			<p className="text-gray-600 text-sm mb-6">
				{__(
					'Configure webhook notifications from your email service provider to automatically handle bounced emails.',
					'doublescale'
				)}
			</p>

			<div className="max-w-2xl">
				<div className="mb-4">
					<label className="text-[#09090B] font-normal text-base mb-2 block">
						{__('Select Email Service Provider', 'doublescale')}
					</label>
					<Select
						value={selectedProvider}
						onValueChange={setSelectedProvider}
						disabled={isLoadingWebhooks || !webhooks}
					>
						<SelectTrigger className="w-full">
							<SelectValue
								placeholder={
									isLoadingWebhooks
										? __('Loading providers...', 'doublescale')
										: __('Choose your email provider...', 'doublescale')
								}
							/>
						</SelectTrigger>
						<SelectContent>
							{providersList.map((provider) => (
								<SelectItem key={provider.slug} value={provider.slug}>
									{provider.name}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>

				{selectedProvider && selectedWebhook && (
					<Card className="mt-6">
						<CardHeader>
							<CardTitle className="text-lg">{selectedWebhook.name}</CardTitle>
							{selectedWebhook.description && (
								<CardDescription>{selectedWebhook.description}</CardDescription>
							)}
						</CardHeader>
						<CardContent className="space-y-4">
							{/* Webhook URL */}
							<div className="space-y-2">
								<label className="text-sm font-medium text-gray-700">
									{__('Webhook URL', 'doublescale')}
								</label>
								<div className="flex gap-2">
									<input
										type="text"
										value={selectedWebhook.url}
										readOnly
										className="flex-1 px-3 py-2 text-sm border !border-border !rounded-lg bg-gray-50 font-mono text-gray-600"
									/>
									<Button
										onClick={handleCopyWebhook}
										variant="outline"
										size="sm"
										className="shrink-0 h-10"
									>
										{copied ? (
											<>
												<Check className="h-4 w-4 mr-1 text-green-600" />
												{__('Copied!', 'doublescale')}
											</>
										) : (
											<>
												<CopyIcon width={24} height={24} />
												{__('Copy', 'doublescale')}
											</>
										)}
									</Button>
								</div>
							</div>

							{/* Setup Instructions */}
							{selectedWebhook.setup_instructions && (
								<Alert>
									<AlertDescription className="text-sm">
										<strong>{__('Setup Instructions:', 'doublescale')}</strong>{' '}
										{selectedWebhook.setup_instructions}
									</AlertDescription>
								</Alert>
							)}

							{/* Documentation Link */}
							{selectedWebhook.doc_url && (
								<div>
									<a
										href={selectedWebhook.doc_url}
										target="_blank"
										rel="noopener noreferrer"
										className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
									>
										<ExternalLink className="h-4 w-4" />
										{__('View Provider Documentation', 'doublescale')}
									</a>
								</div>
							)}

							{/* How It Works Info */}
							<Alert className="bg-blue-50 border-blue-200 mt-4">
								<AlertDescription className="text-sm text-blue-900">
									<strong>{__('How it works:', 'doublescale')}</strong>{' '}
									{__(
										'When an email bounces, your provider sends a notification to this webhook. DoubleScale automatically marks contacts as bounced (hard bounce) or tracks soft bounces. After 3 soft bounces, contacts are converted to hard bounce status.',
										'doublescale'
									)}
								</AlertDescription>
							</Alert>
						</CardContent>
					</Card>
				)}
			</div>
		</div>
	);
};
