/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */

interface UpcomingActivitiesProps {
    contact_id: number;
}

const UpcomingActivities: React.FC<UpcomingActivitiesProps> = ({ contact_id }) => {
    return (
        <div>
            <h1>Upcoming Activities</h1>
        </div>
    );
};

export default UpcomingActivities;