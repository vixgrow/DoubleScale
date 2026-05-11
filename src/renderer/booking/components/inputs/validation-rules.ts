import { __ } from '@wordpress/i18n';

interface ValidationRule {
    required?: boolean;
    type?: string;
    pattern?: RegExp;
    min?: number;
    max?: number;
    message?: string;
}

const getValidationRules = (field): ValidationRule[] => {
    const { required, label, type, pattern, settings } = field;
    const rules: ValidationRule[] = [];

    if (required) {
        rules.push({
            required: true,
            message: __(`${label} is required`, 'doublescale'),
        });
    }

    if (type === 'email') {
        rules.push({
            type: 'email',
            message: __('Please enter a valid email address', 'doublescale'),
        });
    }

    if (type === 'phone') {
        rules.push({
            pattern: pattern || /^[0-9+\-\s()]*$/,
            message: __('Please enter a valid phone number', 'doublescale'),
        });
    }

    if (type === 'number') {
        if (settings?.min !== undefined) {
            rules.push({
                type: 'number',
                min: settings.min,
                message: __(`${label} must be at least ${settings.min}`, 'doublescale'),
            });
        }
        if (settings?.max !== undefined) {
            rules.push({
                type: 'number',
                max: settings.max,
                message: __(`${label} must be at most ${settings.max}`, 'doublescale'),
            });
        }
        rules.push({
            type: 'number',
            message: __('Please enter a valid number', 'doublescale'),
        });
    }

    return rules;
};

export default getValidationRules;
