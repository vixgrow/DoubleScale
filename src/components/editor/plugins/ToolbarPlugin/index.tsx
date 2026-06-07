/**
 *  External dependencies
 */
import { lazy, Suspense } from 'react';

/**
 *  Internal dependencies
 */
import SupportToolbar from './support-toolbar';

/**
 * The heavy email composition imports the merge-tags UI (→ `@doublescale/components`).
 * Loading it via `React.lazy` puts it in a SEPARATE async chunk so the support
 * variant — and therefore the public portal bundle — never pulls the admin tree.
 * (`safeSplitChunks()` in webpack.config.js already handles lazy chunks.)
 */
const EmailToolbar = lazy(() => import('./email-toolbar'));

/**
 * `email` — full toolbar (block formats, image, merge tags, alignment) for the
 * email builder. `support` — slim toolbar (text formats, link, lists) for support
 * composers.
 */
export type ToolbarVariant = 'email' | 'support';

interface ToolbarPluginProps {
	variant?: ToolbarVariant;
}

export const ToolbarPlugin = ({ variant = 'email' }: ToolbarPluginProps) => {
	if (variant === 'support') {
		return <SupportToolbar />;
	}

	// A bare toolbar-height placeholder while the email chunk loads.
	return (
		<Suspense
			fallback={
				<div className="toolbar bg-white border-b border-b-[#e0e0e0] p-4 h-[64px]" />
			}
		>
			<EmailToolbar />
		</Suspense>
	);
};
