/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */

const TwilioInstructions: React.FC = () => {
    return (
        <div className="space-y-4">
            <h2 className="text-xl font-semibold text-destructive">
                {__('Twilio Instructions:', 'quillcrm')}
            </h2>

            <p className="text-base text-gray-900 font-semibold">
                {__('To get your Account SID and Auth Token for Twilio, follow these steps:', 'quillcrm')}
            </p>

            <ol className="list-decimal list-inside space-y-3 text-lg text-gray-500">
                <li>
                    {__('Go to Your', 'quillcrm')} <a href="https://console.twilio.com/" target="_blank" rel="noopener noreferrer" className="text-secondary font-semibold hover:underline">{__('Twilio account', 'quillcrm')}</a> {__('dashboard.', 'quillcrm')}
                </li>

                <li>
                    {__('Click on the account dropdown.', 'quillcrm')}
                </li>

                <li>
                    {__('Click on API keys & tokens.', 'quillcrm')}
                </li>

                <li>
                    {__('Go to Live credentials.', 'quillcrm')}
                </li>

                <li>
                    {__('Copy Account SID & Auth Token and paste it.', 'quillcrm')}
                </li>
            </ol>
        </div>
    );
};

export default TwilioInstructions;

