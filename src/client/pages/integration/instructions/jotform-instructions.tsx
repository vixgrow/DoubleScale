/**
 * Jotform integration setup instructions.
 */

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * External dependencies
 */
import { ExternalLink } from 'lucide-react';

/**
 * Internal dependencies
 */
import ConfigAPI from '@doublescale/config';

const JOTFORM_API_URL = 'https://www.jotform.com/myaccount/api';
const JOTFORM_API_HELP_URL = 'https://api.jotform.com/docs/';
const JOTFORM_WEBHOOKS_HELP_URL =
	'https://www.jotform.com/help/245-how-to-setup-a-webhook-with-jotform/';
const JOTFORM_ADMIN_URL = 'https://www.jotform.com/myforms/';

const linkClass =
	'text-primary font-semibold hover:underline inline-flex items-center gap-1';

const ExternalHref: React.FC<{ href: string; children: React.ReactNode }> = ({
	href,
	children,
}) => (
	<a
		href={href}
		target="_blank"
		rel="noopener noreferrer"
		className={linkClass}
	>
		{children}
		<ExternalLink className="w-3.5 h-3.5 shrink-0" aria-hidden />
	</a>
);

const JotformInstructions: React.FC = () => {
	const proPluginUrl =
		(typeof window !== 'undefined' &&
			(
				window as unknown as {
					doublescalePro?: { proPluginUrl?: string };
				}
			).doublescalePro?.proPluginUrl) ||
		ConfigAPI.getPluginDirUrl();

	const logoUrl = `${proPluginUrl}assets/images/jotform/jotform.png`;

	return (
		<div className="space-y-4">
			<div className="flex items-center gap-4 pb-2">
				<img
					src={logoUrl}
					alt={__('Jotform', 'doublescale')}
					className="h-10 w-auto object-contain rounded"
				/>
				<h2 className="text-xl font-semibold text-destructive">
					{__('Jotform Instructions:', 'doublescale')}
				</h2>
			</div>

			<ol className="list-decimal list-inside space-y-3 text-sm text-gray-600">
				<li>
					{__('Log in to', 'doublescale')}{' '}
					<ExternalHref href={JOTFORM_ADMIN_URL}>
						{__('Jotform', 'doublescale')}
					</ExternalHref>{' '}
					{__('and open', 'doublescale')}{' '}
					<ExternalHref href={JOTFORM_API_URL}>
						{__('Account → API', 'doublescale')}
					</ExternalHref>
					.
				</li>
				<li>
					{__(
						'Create an API key with full access to read forms and manage webhooks.',
						'doublescale'
					)}{' '}
					<a
						href={JOTFORM_API_HELP_URL}
						target="_blank"
						rel="noopener noreferrer"
						className={linkClass}
					>
						{__('See Jotform’s API guide', 'doublescale')}
						<ExternalLink className="w-3.5 h-3.5 shrink-0" aria-hidden />
					</a>
					{', '}
					{__(
						'then paste the API key in the form on the right.',
						'doublescale'
					)}
				</li>
				<li>
					{__(
						'Save the API key here, then go to Forms → SaaS Forms → Jotform to pick a form, map fields, and activate — the same flow as WordPress form plugins.',
						'doublescale'
					)}
				</li>
				<li>
					{__(
						'Submit a test response in Jotform and confirm the contact appears in DoubleScale.',
						'doublescale'
					)}
				</li>
			</ol>

			<p className="text-sm text-gray-500">
				{__(
					'The webhook URL is registered automatically when you activate a form. You can also verify it in Jotform under',
					'doublescale'
				)}{' '}
				<ExternalHref href={JOTFORM_WEBHOOKS_HELP_URL}>
					{__('Settings → Integrations → Webhooks', 'doublescale')}
				</ExternalHref>
				.
			</p>
		</div>
	);
};

export default JotformInstructions;
