/**
 * Calendars-list action that opens the "Connect to remote calendars" page.
 *
 * This used to be a dropdown that opened the integration panel in a dialog.
 * Connecting an OAuth provider is a full page navigation away from the SPA
 * (`window.location.href = authUri`), and Pro's callback redirects back into
 * wp-admin — so dialog state was always destroyed by the round trip and the
 * user returned to a bare calendars list with no sign of what happened. A
 * route survives it, which is why this is now a link rather than a popup.
 *
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import type { FC } from 'react';

/**
 * External dependencies
 */
import { Plug2 } from 'lucide-react';

/**
 * Internal dependencies
 */
import { useNavigate } from '@/hooks/booking';
import { Button } from '@/components/ui/button';

export interface HostCalendarIntegrationIconsProps {
	calendarId: number;
	setErrorMessage?: (message: string | null) => void;
}

const HostCalendarIntegrationIcons: FC<HostCalendarIntegrationIconsProps> = ({
	calendarId,
}) => {
	// Booking's useNavigate already runs the path through getToLink().
	const navigate = useNavigate();

	return (
		<Button
			type="button"
			variant="secondaryDeepBlue"
			onClick={() =>
				navigate(`booking/calendars/${calendarId}/remote-calendars`)
			}
		>
			<Plug2 className="h-4 w-4 shrink-0" aria-hidden />
			<span className="text-[14px] font-[500]">
				{__('Connect to remote calendars', 'doublescale')}
			</span>
		</Button>
	);
};

export default HostCalendarIntegrationIcons;
