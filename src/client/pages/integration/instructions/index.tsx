/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import SlackInstructions from './slack-instructions';
import TwilioInstructions from './twilio-instructions';

interface InstructionsProps {
    slug: string;
    label: string;
    description: string;
}

const Instructions: React.FC<InstructionsProps> = ({ slug, label, description }) => {
    // Render specific instructions based on integration slug
    switch (slug) {
        case 'slack':
            return <SlackInstructions />;
        case 'twilio':
            return <TwilioInstructions />;
        default:
            // Default fallback for other integrations
            return (
                <div className="space-y-4">
                    <h2 className="text-xl font-semibold text-destructive">
                        {label} {__('Instructions:', 'quillcrm')}
                    </h2>
                    <p className="text-sm text-gray-600">
                        {description}
                    </p>
                </div>
            );
    }
};

export default Instructions;

