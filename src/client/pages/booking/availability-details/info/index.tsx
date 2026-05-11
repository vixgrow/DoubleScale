/**
 * External dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { InfoIcon } from '@/components/booking';

interface InfoComponentProps {
	eventsNumber: number;
}

const InfoComponent: React.FC<InfoComponentProps> = ({ eventsNumber }) => {
	return (
		<div className="flex gap-2 bg-secondary p-2 text-primary border border-border rounded-lg">
			<InfoIcon />
			{`${eventsNumber} ${__('calendar events are using this schedule', 'doublescale')}`}
		</div>
	);
};

export default InfoComponent;
