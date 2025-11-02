/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

const UnsubscribesTab: React.FC = () => {
    return (
        <div className="flex items-center justify-center py-12">
            <p className="text-gray-500">
                {__('Unsubscribes', 'quillcrm')}
            </p>
        </div>
    );
};

export default UnsubscribesTab;

