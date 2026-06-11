/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useEffect, useMemo, useState } from '@wordpress/element';
import { applyFilters } from '@wordpress/hooks';
import type { FC } from 'react';

/**
 * External dependencies — bundled icons so the row always renders (config
 * integrations are not always present on the calendars list payload).
 */
import googleIcon from '@doublescale/assets/booking-icons/google/icon.svg';
import zoomIcon from '@doublescale/assets/booking-icons/zoom/icon.svg';
import appleIcon from '@doublescale/assets/booking-icons/apple/icon.svg';
import outlookIcon from '@doublescale/assets/booking-icons/outlook/icon.svg';
import { ChevronDown, Plug2 } from 'lucide-react';

/**
 * Internal dependencies
 */
import ConfigAPI from '@/config/booking';
import type { Integration } from '@/config/booking';
import type { NoticeMessage } from '@/types/booking';
import IntegrationDetailsPage from '@/client/pages/booking/calendar/tabs/integrations/integration';
import { NoticeBanner } from '@/components/booking';
import { ProFeatureNotice } from '@doublescale/components';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

type CalendarIntegrationSlug = 'google' | 'zoom' | 'apple' | 'outlook';

const SLUG_ORDER: CalendarIntegrationSlug[] = [
	'google',
	'zoom',
	'apple',
	'outlook',
];

const BUNDLED_ICONS: Record< CalendarIntegrationSlug, string > = {
	google: googleIcon,
	zoom: zoomIcon,
	apple: appleIcon,
	outlook: outlookIcon,
};

const AUTH_FALLBACK: Record<
	CalendarIntegrationSlug,
	Integration[ 'auth_type' ]
> = {
	google: 'oauth2',
	outlook: 'oauth2',
	zoom: 'basic',
	apple: 'basic',
};

export interface HostCalendarIntegrationIconsProps {
	calendarId: number;
	setErrorMessage?: ( message: string | null ) => void;
}

type IntegrationRow = {
	slug: CalendarIntegrationSlug;
	icon: string;
	name: string;
	description: string;
};

const HostCalendarIntegrationIcons: FC<
	HostCalendarIntegrationIconsProps
> = ( { calendarId, setErrorMessage: _setErrorMessage } ) => {
	const [ panelSlug, setPanelSlug ] = useState<
		CalendarIntegrationSlug | null
	>( null );
	const [ integrationNotice, setIntegrationNotice ] =
		useState< NoticeMessage | null >( null );
	const [ integrationDialogCanClose, setIntegrationDialogCanClose ] =
		useState( true );

	const isProActive = Boolean(
		applyFilters( 'doublescale_is_pro_active', false )
	);

	useEffect( () => {
		if ( panelSlug === null ) {
			setIntegrationDialogCanClose( true );
		}
	}, [ panelSlug ] );

	const integrationConfigs = useMemo( () => {
		const all = ConfigAPI.getIntegrations() || {};
		return SLUG_ORDER.map( ( slug ) => ( {
			id: slug,
			...( all[ slug ] as Integration ),
		} ) );
	}, [] );

	const rows: IntegrationRow[] = useMemo( () => {
		const all = ConfigAPI.getIntegrations() || {};
		const fallbackName: Record< CalendarIntegrationSlug, string > = {
			google: __( 'Google Calendar / Meet', 'doublescale' ),
			zoom: __( 'Zoom', 'doublescale' ),
			apple: __( 'Apple Calendar', 'doublescale' ),
			outlook: __( 'Outlook / Microsoft 365', 'doublescale' ),
		};
		const fallbackDescription: Record<
			CalendarIntegrationSlug,
			string
		> = {
			google: __(
				'Sync availability and add bookings to Google Calendar.',
				'doublescale'
			),
			zoom: __(
				'Create Zoom meetings when events are booked.',
				'doublescale'
			),
			apple: __(
				'Sync with Apple Calendar using a secure app password.',
				'doublescale'
			),
			outlook: __(
				'Sync with Outlook and optional Microsoft Teams.',
				'doublescale'
			),
		};

		return SLUG_ORDER.map( ( slug ) => {
			const cfg = all[ slug ] as Integration | undefined;
			return {
				slug,
				icon: BUNDLED_ICONS[ slug ],
				name: cfg?.name || fallbackName[ slug ],
				description: cfg?.description || fallbackDescription[ slug ],
			};
		} );
	}, [] );

	const activeRow = panelSlug
		? rows.find( ( r ) => r.slug === panelSlug )
		: null;

	const panelIntegration: ( Integration & { id: string } ) | null =
		useMemo( () => {
			if ( ! panelSlug || ! activeRow ) {
				return null;
			}
			const cfg = integrationConfigs.find( ( i ) => i.id === panelSlug );
			return {
				id: panelSlug,
				...( cfg as Integration ),
				name: cfg?.name || activeRow.name,
				description: cfg?.description || activeRow.description,
				icon: activeRow.icon,
				auth_type:
					( cfg?.auth_type as Integration[ 'auth_type' ] ) ||
					AUTH_FALLBACK[ panelSlug ],
			};
		}, [ panelSlug, activeRow, integrationConfigs ] );

	const closePanel = () => {
		setPanelSlug( null );
		setIntegrationNotice( null );
	};

	const openIntegration = ( slug: CalendarIntegrationSlug ) => {
		setIntegrationNotice( null );
		setPanelSlug( slug );
	};

	return (
		<>
			<DropdownMenu>
				<DropdownMenuTrigger asChild>
					<Button
						type="button"
						variant="default"
						size="default"
						className="h-10 shrink-0 gap-2 rounded-lg px-4 font-medium shadow-sm"
						aria-haspopup="menu"
						aria-label={ __(
							'Connect calendar and conferencing integrations',
							'doublescale'
						) }
					>
						<Plug2 className="h-4 w-4 shrink-0" aria-hidden />
						<span className="text-sm font-medium">
							{ __( 'Connect', 'doublescale' ) }
						</span>
						<ChevronDown className="h-4 w-4 shrink-0 opacity-80" aria-hidden />
					</Button>
				</DropdownMenuTrigger>
				<DropdownMenuContent align="end" className="w-80 p-1.5">
					<DropdownMenuLabel className="px-2 py-1.5 text-xs font-normal text-muted-foreground">
						{ __(
							'Choose a service to add or connect an account',
							'doublescale'
						) }
					</DropdownMenuLabel>
					<DropdownMenuSeparator />
					{ rows.map( ( row ) => (
						<DropdownMenuItem
							key={ row.slug }
							className="cursor-pointer gap-3 rounded-lg py-2.5 pl-2 pr-2"
							onClick={ () => openIntegration( row.slug ) }
						>
							<span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-[#EDEBEB] bg-white">
								<img
									src={ row.icon }
									alt=""
									className="h-[22px] w-[22px] object-contain"
								/>
							</span>
							<span className="flex min-w-0 flex-col gap-0.5 text-left">
								<span className="font-medium leading-snug">
									{ row.name }
								</span>
								<span className="line-clamp-2 text-xs leading-snug text-muted-foreground">
									{ row.description }
								</span>
							</span>
						</DropdownMenuItem>
					) ) }
				</DropdownMenuContent>
			</DropdownMenu>

			<Dialog
				open={ panelSlug !== null }
				onOpenChange={ ( open ) => {
					if ( ! open ) {
						if ( ! integrationDialogCanClose ) {
							setIntegrationNotice( {
								type: 'error',
								title: __(
									'Remote calendar required',
									'doublescale'
								),
								message: __(
									'Please choose a remote calendar from the list before closing.',
									'doublescale'
								),
							} );
							return;
						}
						closePanel();
					}
				} }
			>
				<DialogContent className="max-w-4xl w-[95vw] max-h-[90vh] overflow-y-auto p-6">
					{ panelSlug && panelIntegration && activeRow && (
						isProActive ? (
							<div className="space-y-4">
								{ integrationNotice && (
									<NoticeBanner
										notice={ integrationNotice }
										closeNotice={ () =>
											setIntegrationNotice( null )
										}
									/>
								) }
								<IntegrationDetailsPage
									integration={ panelIntegration }
									calendarId={ String( calendarId ) }
									slug={ panelSlug }
									setNotice={ setIntegrationNotice }
									onCalendarSelect={ () => {} }
									hasAccounts={ () => {} }
									onCloseReadinessChange={
										setIntegrationDialogCanClose
									}
								/>
							</div>
						) : (
							<ProFeatureNotice
								featureName={ activeRow.name }
								description={ activeRow.description }
							/>
						)
					) }
				</DialogContent>
			</Dialog>
		</>
	);
};

export default HostCalendarIntegrationIcons;
