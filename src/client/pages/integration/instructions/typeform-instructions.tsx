/**
 * Typeform integration setup instructions.
 */

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { ExternalLinkIcon } from '@doublescale/components';

/**
 * External dependencies
 */


/**
 * Internal dependencies
 */
import ConfigAPI from '@doublescale/config';

const TYPEFORM_TOKENS_URL = 'https://admin.typeform.com/account#/section/tokens';
const TYPEFORM_TOKEN_HELP_URL =
	'https://www.typeform.com/developers/get-started/personal-access-token/';
const TYPEFORM_WEBHOOKS_HELP_URL =
	'https://www.typeform.com/developers/webhooks/';
const TYPEFORM_ADMIN_URL = 'https://admin.typeform.com/';

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
		<ExternalLinkIcon width={24} height={24} className="w-6 h-6 shrink-0" aria-hidden />
	</a>
);

const TypeformInstructions: React.FC = () => {
	const logoUrl = `${ConfigAPI.getPluginDirUrl().replace(/\/?$/, '/')}assets/images/typeform/typeform.svg`;

	return (
		<div className="space-y-4">
			<div className="flex items-center gap-4 pb-2">
				<img
					src={logoUrl}
					alt={__('Typeform', 'doublescale')}
					className="h-10 w-auto object-contain rounded"
				/>
				<h2 className="text-xl font-semibold text-destructive">
					{__('Typeform Instructions:', 'doublescale')}
				</h2>
			</div>

			<ol className="list-decimal list-inside space-y-3 text-sm text-gray-600">
				<li>
					{__('Log in to', 'doublescale')}{' '}
					<ExternalHref href={TYPEFORM_ADMIN_URL}>
						{__('Typeform', 'doublescale')}
					</ExternalHref>{' '}
					{__('and open', 'doublescale')}{' '}
					<ExternalHref href={TYPEFORM_TOKENS_URL}>
						{__('Account settings → Personal tokens', 'doublescale')}
					</ExternalHref>
					.
				</li>
				<li>
					{__(
						'Create a token with scopes to read forms and manage webhooks.',
						'doublescale'
					)}{' '}
					<a
						href={TYPEFORM_TOKEN_HELP_URL}
						target="_blank"
						rel="noopener noreferrer"
						className={linkClass}
					>
						{__('See Typeform’s token guide', 'doublescale')}
						<ExternalLinkIcon width={24} height={24} className="w-6 h-6 shrink-0" aria-hidden />
					</a>
					{', '}
					{__(
						'then paste the token in the form on the right.',
						'doublescale'
					)}
				</li>
				<li>
					{__(
						'Save the token here, then go to Forms → SaaS Forms → Typeform to pick a form, map fields, and activate — the same flow as WordPress form plugins.',
						'doublescale'
					)}
				</li>
				<li>
					{__(
						'Submit a test response in Typeform and confirm the contact appears in DoubleScale.',
						'doublescale'
					)}
				</li>
			</ol>

			<p className="text-sm text-gray-500">
				{__(
					'The webhook URL is shown as read-only on the right. You can also verify it in Typeform under',
					'doublescale'
				)}{' '}
				<ExternalHref href={TYPEFORM_WEBHOOKS_HELP_URL}>
					{__('Connect → Webhooks', 'doublescale')}
				</ExternalHref>
				.
			</p>
		</div>
	);
};

export default TypeformInstructions;
