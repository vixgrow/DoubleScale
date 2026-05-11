import { __ } from '@wordpress/i18n';
import React from 'react';
import { EventInfoIcon, ProTab } from '@/components/booking';
import { Host } from '@/types/booking';
import { applyFilters } from '@wordpress/hooks';

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
		<ProTab
			title={__('Assignment', 'doublescale')}
			description={__('Set your Members and Event Host.', 'doublescale')}
			icon={<EventInfoIcon />}
		/>,
		{ team, calendarId, onChange }
	) as React.ReactNode;
};

export default TeamAssignment;
