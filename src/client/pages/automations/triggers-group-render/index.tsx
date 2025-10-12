/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * External dependencies
 */
import { Button, Typography, Tabs, Flex, Tooltip } from 'antd';
import { map } from 'lodash';

/**
 * Internal dependencies
 */
import type { TriggersGroup } from '@quillcrm/config';

interface TriggersGroupRenderProps {
    groups: TriggersGroup[];
    onChange: (value: string) => void;
    value: string;
}

const TriggersGroupRender: React.FC<TriggersGroupRenderProps> = ({
    groups,
    onChange,
    value,
}) => {
    // Helper function to get tooltip message for disabled triggers
    const getDisabledTooltip = (groupLabel: string) => {
        if (groupLabel === 'QuillBooking') {
            return __(
                'QuillBooking plugin is not installed or activated. Install QuillBooking to use these triggers.',
                'quillcrm'
            );
        }
        if (groupLabel === 'WooCommerce') {
            return __(
                'WooCommerce plugin is not installed or activated. Install WooCommerce to use these triggers.',
                'quillcrm'
            );
        }
        if (groupLabel === 'LearnDash') {
            return __(
                'LearnDash plugin is not installed or activated. Install LearnDash to use these triggers.',
                'quillcrm'
            );
        }
        if (groupLabel === 'MemberPress') {
            return __(
                'MemberPress plugin is not installed or activated. Install MemberPress to use these triggers.',
                'quillcrm'
            );
        }
        return __(
            'This integration is not available. Please install the required plugin.',
            'quillcrm'
        );
    };

    return (
        <Flex gap={20} wrap vertical={true}>
            {map(groups, (group, key) => (
                <div key={key} className="qcrm-automation-triggers-group">
                    <Typography.Paragraph
                        strong
                        className="qcrm-automation-triggers-group__label"
                        style={{ marginBottom: '10px' }}
                    >
                        {group.label}
                        {group.is_disabled && (
                            <Tooltip title={getDisabledTooltip(group.label)}>
                                <Typography.Text
                                    type="secondary"
                                    style={{
                                        marginLeft: '8px',
                                        fontSize: '12px',
                                    }}
                                >
                                    ({__('Not Available', 'quillcrm')})
                                </Typography.Text>
                            </Tooltip>
                        )}
                    </Typography.Paragraph>
                    <Flex
                        className="qcrm-automation-triggers-group__triggers"
                        gap={10}
                        wrap
                    >
                        {map(group.triggers, (trigger, key) => {
                            const triggerButton = (
                                <Button
                                    key={key}
                                    onClick={() => onChange(key)}
                                    type={value === key ? 'primary' : 'default'}
                                    disabled={group.is_disabled}
                                >
                                    {trigger.label}
                                </Button>
                            );

                            // Wrap disabled triggers in tooltip for additional context
                            if (group.is_disabled) {
                                return (
                                    <Tooltip
                                        key={key}
                                        title={getDisabledTooltip(group.label)}
                                    >
                                        {triggerButton}
                                    </Tooltip>
                                );
                            }

                            return triggerButton;
                        })}
                    </Flex>
                </div>
            ))}
        </Flex>
    );
};

export default TriggersGroupRender;

