/**
 * Booking — "Connect to remote calendars" page.
 *
 * This is a real route rather than a dropdown + dialog on the Calendars list,
 * because connecting an OAuth provider leaves the SPA entirely: the integration
 * panel sets `window.location.href = authUri`, the user consents on Google /
 * Microsoft / Zoom, and Pro's callback redirects back into wp-admin. Dialog
 * state is local React state and cannot survive that round trip — a URL can, so
 * the provider callbacks land the user back on this page with the chosen
 * provider still selected.
 *
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useEffect, useMemo, useState } from '@wordpress/element';
import { applyFilters } from '@wordpress/hooks';
import type { FC } from 'react';

/**
 * External dependencies — bundled icons so the list always renders (config
 * integrations are not always present on the calendars list payload).
 */
import googleIcon from '@doublescale/assets/booking-icons/google/icon.svg';
import zoomIcon from '@doublescale/assets/booking-icons/zoom/icon.svg';
import appleIcon from '@doublescale/assets/booking-icons/apple/icon.svg';
import outlookIcon from '@doublescale/assets/booking-icons/outlook/icon.svg';
import { ArrowLeft, Check, Lock } from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';

/**
 * Internal dependencies
 */
import ConfigAPI from '@/config/booking';
import type { Integration } from '@/config/booking';
import type { NoticeMessage } from '@/types/booking';
import IntegrationDetailsPage from '@/client/pages/booking/calendar/tabs/integrations/integration';
import { Header, NoticeBanner } from '@/components/booking';
import { ProFeatureNotice } from '@doublescale/components';
import { getToLink } from '@doublescale/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
	SLUG_ORDER,
	normalizeProviderSlug,
	resolveProviderCopy,
	type CalendarIntegrationSlug,
} from './providers';

export type { CalendarIntegrationSlug } from './providers';
export { SLUG_ORDER, normalizeProviderSlug } from './providers';

const BUNDLED_ICONS: Record<CalendarIntegrationSlug, string> = {
	google: googleIcon,
	zoom: zoomIcon,
	apple: appleIcon,
	outlook: outlookIcon,
};

const AUTH_FALLBACK: Record<CalendarIntegrationSlug, Integration['auth_type']> =
	{
		google: 'oauth2',
		outlook: 'oauth2',
		zoom: 'basic',
		apple: 'basic',
	};

export type IntegrationRow = {
	slug: CalendarIntegrationSlug;
	icon: string;
	name: string;
	description: string;
};

/**
 * Provider rows, falling back to bundled copy when the server config omits a
 * slug (stale option cache, partial PHP options).
 */
export const buildIntegrationRows = (
	all: Record<string, Integration> | undefined | null
): IntegrationRow[] => {
	const configs = all || {};

	return SLUG_ORDER.map((slug) => {
		const cfg = configs[slug] as Integration | undefined;
		const copy = resolveProviderCopy(slug, cfg);
		return {
			slug,
			icon: BUNDLED_ICONS[slug],
			name: copy.name,
			description: copy.description,
		};
	});
};

const RemoteCalendarsPage: FC = () => {
	const { id } = useParams<{ id: string }>();
	const navigate = useNavigate();
	// The selected provider lives in the URL, not in component state: that is
	// what lets the OAuth return land back on the same provider.
	//
	// Read and written with the raw History API rather than React Router's
	// useSearchParams(), because these are wp-admin URLs — `admin.php?page=…
	// &path=…`. useSearchParams() rebuilds the URL against the router basename
	// and drops the wp-admin script, producing a 404 on reload. Same approach
	// as the calendar tabs (see calendar/tabs/integrations/index.tsx).
	const [selectedSlug, setSelectedSlug] =
		useState<CalendarIntegrationSlug | null>(() =>
			normalizeProviderSlug(
				new URLSearchParams(window.location.search).get('provider')
			)
		);

	const [notice, setNotice] = useState<NoticeMessage | null>(null);

	/**
	 * Keep the selection in sync when the user navigates with the browser's
	 * back/forward buttons — the URL is the source of truth.
	 */
	useEffect(() => {
		const syncFromUrl = () => {
			setSelectedSlug(
				normalizeProviderSlug(
					new URLSearchParams(window.location.search).get('provider')
				)
			);
		};
		window.addEventListener('popstate', syncFromUrl);
		return () => window.removeEventListener('popstate', syncFromUrl);
	}, []);

	/**
	 * Write the provider into the current wp-admin URL without touching the
	 * `page` / `path` parameters that route the admin screen.
	 */
	const writeProviderToUrl = (slug: CalendarIntegrationSlug | null) => {
		const params = new URLSearchParams(window.location.search);
		if (slug) {
			params.set('provider', slug);
		} else {
			params.delete('provider');
		}
		window.history.pushState(
			{},
			'',
			`${window.location.pathname}?${params.toString()}`
		);
	};

	const isProActive = Boolean(
		applyFilters('doublescale_is_pro_active', false)
	);

	const rows = useMemo(
		() => buildIntegrationRows(ConfigAPI.getIntegrations()),
		[]
	);

	const integrationConfigs = useMemo(() => {
		const all = ConfigAPI.getIntegrations() || {};
		return SLUG_ORDER.map((slug) => ({
			id: slug,
			...(all[slug] as Integration),
		}));
	}, []);

	const activeRow = selectedSlug
		? rows.find((row) => row.slug === selectedSlug) || null
		: null;

	const activeIntegration: (Integration & { id: string }) | null =
		useMemo(() => {
			if (!selectedSlug || !activeRow) {
				return null;
			}
			const cfg = integrationConfigs.find((i) => i.id === selectedSlug);
			return {
				id: selectedSlug,
				...(cfg as Integration),
				name: cfg?.name || activeRow.name,
				description: cfg?.description || activeRow.description,
				icon: activeRow.icon,
				auth_type:
					(cfg?.auth_type as Integration['auth_type']) ||
					AUTH_FALLBACK[selectedSlug],
			};
		}, [selectedSlug, activeRow, integrationConfigs]);

	// Clear a stale notice whenever the user switches provider.
	useEffect(() => {
		setNotice(null);
	}, [selectedSlug]);

	/**
	 * Whether the integration panel currently allows the user to walk away.
	 * The panel reports this through `onCloseReadinessChange`: false while it
	 * has a connected account whose Remote Calendar has not been chosen yet.
	 * Defaults to true so a provider with no panel open never traps anyone.
	 */
	const [panelAllowsLeave, setPanelAllowsLeave] = useState(true);

	// A provider with no panel mounted has nothing to strand.
	useEffect(() => {
		if (!selectedSlug) {
			setPanelAllowsLeave(true);
		}
	}, [selectedSlug]);

	// No provider open means nothing can be stranded; otherwise defer to the
	// panel, which owns the account/calendar state the rule depends on.
	const canLeave = !selectedSlug || panelAllowsLeave;

	/**
	 * Refuse an exit while a connected account still needs a Remote Calendar,
	 * showing the same message the dialog used to. Returns true when the caller
	 * may proceed.
	 */
	const confirmLeave = (): boolean => {
		if (canLeave) {
			return true;
		}
		setNotice({
			type: 'error',
			title: __('Remote calendar required', 'doublescale'),
			message: __(
				'Please choose a remote calendar from the list before leaving.',
				'doublescale'
			),
		});
		return false;
	};

	const selectProvider = (slug: CalendarIntegrationSlug) => {
		if (!isProActive) {
			return;
		}
		// Switching provider abandons the current one just as leaving does.
		if (slug !== selectedSlug && !confirmLeave()) {
			return;
		}
		setSelectedSlug(slug);
		writeProviderToUrl(slug);
	};

	const clearProvider = () => {
		if (!confirmLeave()) {
			return;
		}
		setSelectedSlug(null);
		writeProviderToUrl(null);
	};

	const leaveToCalendars = () => {
		if (!confirmLeave()) {
			return;
		}
		navigate(getToLink('booking/calendars'));
	};

	return (
		<div className="doublescale-booking-remote-calendars">
			<div className="pb-5 flex justify-between items-center gap-3">
				<Header
					header={__('Connect to remote calendars', 'doublescale')}
					subHeader={__(
						'Connect a calendar or conferencing account so DoubleScale can check for conflicts and add your bookings.',
						'doublescale'
					)}
				/>
				<Button
					type="button"
					variant="secondaryDeepBlue"
					onClick={leaveToCalendars}
				>
					<ArrowLeft className="h-4 w-4 shrink-0" aria-hidden />
					<span className="text-[14px] font-[500]">
						{__('Back to calendars', 'doublescale')}
					</span>
				</Button>
			</div>

			{notice && (
				<div className="pb-4">
					<NoticeBanner
						notice={notice}
						closeNotice={() => setNotice(null)}
					/>
				</div>
			)}

			<div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-start">
				<Card className="lg:col-span-1">
					<CardContent className="p-3">
						<ul className="flex flex-col gap-2" role="list">
							{rows.map((row) => {
								const isSelected = row.slug === selectedSlug;
								return (
									<li key={row.slug}>
										<button
											type="button"
											aria-pressed={isSelected}
											disabled={!isProActive}
											onClick={() =>
												selectProvider(row.slug)
											}
											className={`flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-colors ${
												isSelected
													? 'border-primary bg-primary/5'
													: 'border-[#EDEBEB] hover:bg-muted/50'
											} ${
												!isProActive
													? 'cursor-not-allowed opacity-70'
													: 'cursor-pointer'
											}`}
										>
											<span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-[#EDEBEB] bg-white">
												<img
													src={row.icon}
													alt=""
													className="h-[22px] w-[22px] object-contain"
												/>
											</span>
											<span className="flex min-w-0 flex-col gap-0.5">
												<span className="font-medium leading-snug">
													{row.name}
												</span>
												<span className="line-clamp-2 text-xs leading-snug text-muted-foreground">
													{row.description}
												</span>
											</span>
											{isSelected && (
												<Check
													className="h-4 w-4 shrink-0 text-primary"
													aria-hidden
												/>
											)}
											{!isProActive && (
												<Lock
													className="h-4 w-4 shrink-0 text-muted-foreground"
													aria-label={__(
														'Requires Pro',
														'doublescale'
													)}
												/>
											)}
										</button>
									</li>
								);
							})}
						</ul>
					</CardContent>
				</Card>

				<div className="lg:col-span-2">
					{!isProActive && activeRow && (
						<ProFeatureNotice
							featureName={activeRow.name}
							description={activeRow.description}
						/>
					)}

					{isProActive && selectedSlug && activeIntegration && id && (
						<Card>
							<CardContent className="p-5">
								<IntegrationDetailsPage
									integration={activeIntegration}
									calendarId={String(id)}
									slug={selectedSlug}
									setNotice={setNotice}
									onCalendarSelect={() => {}}
									hasAccounts={() => {}}
									onCloseReadinessChange={setPanelAllowsLeave}
								/>
								<div className="pt-4">
									<Button
										type="button"
										variant="ghost"
										onClick={clearProvider}
									>
										{__(
											'Choose a different service',
											'doublescale'
										)}
									</Button>
								</div>
							</CardContent>
						</Card>
					)}

					{!selectedSlug && (
						<Card>
							<CardContent className="p-8 text-center text-muted-foreground">
								{__(
									'Choose a service to add or connect an account',
									'doublescale'
								)}
							</CardContent>
						</Card>
					)}
				</div>
			</div>
		</div>
	);
};

export default RemoteCalendarsPage;
