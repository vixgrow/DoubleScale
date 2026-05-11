/**
 * Pro-version placeholder.
 *
 * the free plugin gated functionality behind a separate pro plugin. In
 * DoubleScale Pro everything ships in one plugin — there is no upsell.
 *
 * However, several admin tabs still mount <ProVersion /> (often via <ProTab>)
 * as the placeholder for tabs whose pro implementation will be merged in via
 * `applyFilters` during Phase 3b (QB-Pro admin component port). Until that
 * port lands, we render a neutral "feature available" notice so the page
 * doesn't look broken.
 *
 * Once Phase 3b is complete, the addFilter hooks will override the entire
 * ProTab body — this component will only render when no override is supplied.
 */
import { __ } from '@wordpress/i18n';

const ProVersion: React.FC = () => {
	return (
		<div className="flex flex-col items-center text-center py-10">
			<div>
				<h2 className="text-base font-semibold my-1 text-[#3F4254]">
					{__('Coming Soon', 'doublescale')}
				</h2>
				<p className="text-[#9197A4] mb-4 text-xs">
					{__(
						'This feature is being prepared. Please check back shortly.',
						'doublescale'
					)}
				</p>
			</div>
		</div>
	);
};

export default ProVersion;
