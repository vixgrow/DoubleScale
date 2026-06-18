/**
 * Client Portal settings — surface the portal page so the feature is
 * discoverable. Shows where the `[doublescale_client_portal]` page lives (with
 * View / Edit links), a copy-shortcode helper, and a "Create page" action for
 * when it was never provisioned or the admin trashed it.
 *
 * The page is auto-created once on a fresh install (PortalPageProvisioner); this
 * panel is the manual escape hatch + visibility layer on top of that.
 */

import { useCallback, useEffect, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import apiFetch from '@wordpress/api-fetch';
import { Check, Copy, ExternalLink, Loader2 } from 'lucide-react';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface PortalPageStatus {
	provisioned: boolean;
	page_id: number;
	exists: boolean;
	view_url: string;
	edit_url: string;
	shortcode: string;
}

const FALLBACK_SHORTCODE = '[doublescale_client_portal]';

const ClientPortalSettings = () => {
	const [status, setStatus] = useState<PortalPageStatus | null>(null);
	const [loading, setLoading] = useState(true);
	const [creating, setCreating] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [copied, setCopied] = useState(false);

	const load = useCallback(() => {
		setLoading(true);
		setError(null);
		apiFetch<PortalPageStatus>({ path: '/doublescale/v1/portal/page' })
			.then(setStatus)
			.catch((e) =>
				setError(
					(e as { message?: string })?.message ||
						__('Failed to load the portal page status.', 'doublescale')
				)
			)
			.finally(() => setLoading(false));
	}, []);

	useEffect(() => {
		load();
	}, [load]);

	const createPage = () => {
		setCreating(true);
		setError(null);
		apiFetch<PortalPageStatus>({
			path: '/doublescale/v1/portal/page',
			method: 'POST',
		})
			.then(setStatus)
			.catch((e) =>
				setError(
					(e as { message?: string })?.message ||
						__('The portal page could not be created.', 'doublescale')
				)
			)
			.finally(() => setCreating(false));
	};

	const shortcode = status?.shortcode || FALLBACK_SHORTCODE;

	const copy = async () => {
		try {
			await navigator.clipboard.writeText(shortcode);
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
		} catch {
			// Clipboard can be unavailable (insecure context); fail silently —
			// the shortcode text is visible for manual copy regardless.
		}
	};

	return (
		<div className="space-y-6">
			<div>
				<h2 className="text-lg font-semibold text-gray-900">
					{__('Client Portal', 'doublescale')}
				</h2>
				<p className="mt-1 text-sm text-gray-500">
					{__(
						'A logged-in area where customers see their support tickets, bookings, documents, and payments. It renders wherever the shortcode is placed.',
						'doublescale'
					)}
				</p>
			</div>

			{error && (
				<div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
					{error}
				</div>
			)}

			<Card>
				<CardContent className="space-y-4 p-5">
					{loading ? (
						<div className="flex items-center gap-2 text-sm text-gray-500">
							<Loader2 className="h-4 w-4 animate-spin" />
							{__('Checking the portal page…', 'doublescale')}
						</div>
					) : status?.exists ? (
						<div className="space-y-3">
							<div className="flex items-center gap-2">
								<span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-green-100 text-green-600">
									<Check className="h-4 w-4" />
								</span>
								<span className="font-medium text-gray-900">
									{__('Your portal page is live.', 'doublescale')}
								</span>
							</div>
							<p className="text-sm text-gray-500">
								{__(
									'Share this page URL with your customers. Logged-out visitors get a login form; staff are redirected to the admin.',
									'doublescale'
								)}
							</p>
							<div className="flex flex-wrap gap-2">
								{status.view_url && (
									<a
										href={status.view_url}
										target="_blank"
										rel="noreferrer"
									>
										<Button variant="outline" className="rounded-lg">
											<ExternalLink className="mr-1 h-4 w-4" />
											{__('View page', 'doublescale')}
										</Button>
									</a>
								)}
								{status.edit_url && (
									<a href={status.edit_url}>
										<Button variant="outline" className="rounded-lg">
											{__('Edit page', 'doublescale')}
										</Button>
									</a>
								)}
							</div>
						</div>
					) : (
						<div className="space-y-3">
							<p className="text-sm text-gray-600">
								{__(
									'No portal page exists yet. Create one in a click, or paste the shortcode below onto any page you choose.',
									'doublescale'
								)}
							</p>
							<Button
								className="rounded-lg"
								onClick={createPage}
								disabled={creating}
							>
								{creating && (
									<Loader2 className="mr-1 h-4 w-4 animate-spin" />
								)}
								{__('Create portal page', 'doublescale')}
							</Button>
						</div>
					)}
				</CardContent>
			</Card>

			<div className="rounded-lg border border-input p-4 space-y-3">
				<div>
					<div className="font-medium text-gray-900">
						{__('Shortcode', 'doublescale')}
					</div>
					<p className="text-sm text-gray-500">
						{__(
							'Paste this on any page to render the client portal. It is visible only to logged-in customers.',
							'doublescale'
						)}
					</p>
				</div>
				<div className="flex items-center gap-2">
					<code className="flex-1 rounded-md border border-input bg-muted/40 px-3 py-2 text-sm text-gray-800">
						{shortcode}
					</code>
					<Button variant="outline" className="rounded-lg" onClick={copy}>
						{copied ? (
							<>
								<Check className="mr-1 h-4 w-4" />
								{__('Copied', 'doublescale')}
							</>
						) : (
							<>
								<Copy className="mr-1 h-4 w-4" />
								{__('Copy', 'doublescale')}
							</>
						)}
					</Button>
				</div>
			</div>
		</div>
	);
};

export default ClientPortalSettings;
