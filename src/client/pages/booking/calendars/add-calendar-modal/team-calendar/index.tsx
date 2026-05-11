/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */

import { Calendar } from '@/types/booking';
import { applyFilters } from '@wordpress/hooks';
import { ProIcon } from '@/components/booking';
import { ACTIVE_PRO_URL } from '@/constants/booking';
import { Dialog, DialogContent } from '@/components/ui/dialog';

interface TeamCalendarProps {
	formData: Partial<Calendar & { members: number[] }>;
	updateFormData: (
		key: keyof TeamCalendarProps['formData'],
		value: any
	) => void;
	open: boolean;
	loading: boolean;
	closeHandler: () => void;
	saveCalendar: () => void;
}

const TeamCalendar: React.FC<TeamCalendarProps> = ({
	formData,
	updateFormData,
	open,
	closeHandler,
	loading,
	saveCalendar,
}) => {
	return applyFilters(
		// Must match the name registered in
		// `client/pages/booking/pro-filters.ts`. The original camelCase name
		// (`doublescale_booking_addCalendarModal_teamCalendar`) was a port
		// the registry actually uses, which is why this slot fell through
		// to the "Pro Version" upsell card.
		'doublescale_booking_calendars_add_team_calendar',
		<Dialog
            open={open}
            onOpenChange={open => {
                if (!open)
                    closeHandler();
            }}><DialogContent className="rounded-lg">
                <div className="flex flex-col items-center text-center py-10">
                    <div className="bg-secondary rounded-full p-4 mb-2 flex items-center justify-center">
                        <ProIcon width={72} height={72} />
                    </div>
                    <div>
                        <h2 className="text-base font-semibold my-1 text-[#3F4254]">
                            {__(
                                'Create team feature is available in Pro Version',
                                'doublescale'
                            )}
                        </h2>
                        <p className="text-[#9197A4] mb-4 text-xs">
                            {__(
                                'Please upgrade to get all the advanced features.',
                                'doublescale'
                            )}
                        </p>
                        <div className="mt-5">
                            <a
                                className="bg-primary text-primary-foreground rounded-lg py-3 px-4 font-medium"
                                href={ACTIVE_PRO_URL}
                            >
                                {__('Upgrade To Pro Now', 'doublescale')}
                            </a>
                        </div>
                    </div>
                </div>
            </DialogContent></Dialog>,
		{ formData, updateFormData, open, closeHandler, loading, saveCalendar }
	) as React.ReactElement;
};

export default TeamCalendar;
