/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { applyFilters } from '@wordpress/hooks';

/**
 * Internal dependencies
 */
import SlackInstructions from './slack-instructions';

interface InstructionsProps {
    slug: string;
    label: string;
    description: string;
}

const Instructions: React.FC<InstructionsProps> = ({ slug, label, description }) => {
    // Allow Pro plugin to override instruction components
    const OverrideComponent = applyFilters(
        'quillcrm_integration_instructions_component',
        null,
        slug
    ) as React.ComponentType | null;

    if (OverrideComponent) {
        return <OverrideComponent />;
    }

    // Render specific instructions based on integration slug
    switch (slug) {
        case 'slack':
            return <SlackInstructions />;
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

