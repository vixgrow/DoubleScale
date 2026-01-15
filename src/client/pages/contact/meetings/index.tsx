/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */

interface MeetingsProps {
    contact_id: number;
}

const Meetings: React.FC<MeetingsProps> = ({ contact_id }) => {
    return (
        <div>
            <h1>Meetings</h1>
        </div>
    );
};

export default Meetings;
