import { __ } from '@wordpress/i18n';
import React from 'react';
import { Host } from '@/types/booking';
import { applyFilters } from '@wordpress/hooks';
import { ProFeatureNotice } from '@doublescale/components';

interface TeamAssignmentProps {
	team: Host[];
	calendarId: number;
	onChange: (key: string, value: any) => void;
}

const TeamAssignment: React.FC<TeamAssignmentProps> = ({
	team,
	calendarId,
	onChange,
}) => {
	return applyFilters(
		'doublescale_booking_event_team_assignment',
		<ProFeatureNotice
			featureName={__('Team Assignment', 'doublescale')}
			description={__(
				'Assign multiple hosts to a single event and choose how attendees are matched. Pick between round-robin rotation, collective availability, or specific host preference.',
				'doublescale'
			)}
		/>,
		{ team, calendarId, onChange }
	) as React.ReactNode;
};

export default TeamAssignment;
