/**
 * Client Portal SPA root.
 *
 * Uses a HashRouter — the portal lives inside a host page, so we can't own
 * `window.location.pathname`. PHP (`/portal/bootstrap`) decides identity + which
 * sections are visible; the static registry maps each visible slug to its view.
 * view. A `doublescale_portal_path` query arg (set by email deep-links, which
 * survive the WP login redirect) is translated into the initial hash route.
 */

import { Suspense, useEffect, useRef } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import {
	HashRouter,
	Navigate,
	Route,
	Routes,
	useNavigate,
} from 'react-router-dom';

import { fetchBootstrap, useAsync } from './api';
import Dashboard from './sections/dashboard';
import { SECTION_REGISTRY, hasSection } from './sections/registry';
import { PortalLayout } from './shared/layout';
import { ErrorState, Spinner } from './shared/ui';
import type { PortalRendererConfig } from './types';

const DEEP_LINK_ARG = 'doublescale_portal_path';

/**
 * Translate a `?doublescale_portal_path=bookings/12` deep link into a one-time
 * hash navigation, then clear it so refreshes don't re-trigger.
 */
const DeepLinkSync = () => {
	const navigate = useNavigate();
	const done = useRef(false);

	useEffect(() => {
		if (done.current || typeof window === 'undefined') {
			return;
		}
		done.current = true;
		const raw = new URLSearchParams(window.location.search).get(DEEP_LINK_ARG);
		if (!raw) {
			return;
		}
		// Only allow simple internal routes (defense against open-redirect-ish input).
		const path = raw.replace(/^\/+/, '');
		if (/^[a-z0-9/_-]+$/i.test(path)) {
			navigate(`/${path}`);
		}
	}, [navigate]);

	return null;
};

interface Props {
	config: PortalRendererConfig;
}

const PortalApp = ({ config }: Props) => {
	const { data, loading, error } = useAsync(() => fetchBootstrap(), []);

	if (loading) {
		return (
			<div className="doublescale-client-portal">
				<Spinner label={__('Loading your portal…', 'doublescale')} />
			</div>
		);
	}

	if (error || !data) {
		return (
			<div className="doublescale-client-portal mx-auto max-w-3xl p-6">
				<ErrorState
					message={
						error || __('Unable to load the portal.', 'doublescale')
					}
				/>
			</div>
		);
	}

	const visibleSections = data.sections.filter(
		(s) => hasSection(s.slug) && s.slug !== 'calendar'
	);

	return (
		<HashRouter>
			<DeepLinkSync />
			<PortalLayout identity={data.identity} sections={visibleSections}>
				<Suspense fallback={<Spinner />}>
					<Routes>
						<Route
							path="/"
							element={<Dashboard summary={data.summary.cards} />}
						/>
						{visibleSections.map((section) => {
							const Cmp = SECTION_REGISTRY[section.slug];
							return (
								<Route
									key={section.slug}
									path={`/${section.slug}/*`}
									element={<Cmp />}
								/>
							);
						})}
						<Route path="/calendar/*" element={<Navigate to="/" replace />} />
						<Route path="*" element={<Navigate to="/" replace />} />
					</Routes>
				</Suspense>
			</PortalLayout>
		</HashRouter>
	);
};

export default PortalApp;
