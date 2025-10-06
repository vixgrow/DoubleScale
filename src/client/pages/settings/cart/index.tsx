/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * External dependencies
 */
import { Flex, Typography, Divider } from 'antd';

/**
 * Internal dependencies
 */
import type { Settings } from '@quillcrm/client';
import { Field } from '@quillcrm/components';

interface CartSettingsProps {
    settings: Settings;
    onChange: (settings: Settings) => void;
}

const CartSettings: React.FC<CartSettingsProps> = ({ settings, onChange }) => {
    const {
        enable_cart_tracking,
        wait_period,
        cool_off_period,
        lost_cart_days,
        gdpr_compliance,
        gdpr_message,
        lists,
        tags,
        lost_lists,
        lost_tags,
    } = settings.cart;
    const handleFieldChange = (key: string, value: string) => {
        onChange({
            ...settings,
            cart: {
                ...settings.cart,
                [key]: value,
            },
        });
    };
    return (
        <div className="cart-settings qcrm-fields">
            <Field
                label={__('Enable Cart Tracking', 'quillcrm')}
                value={enable_cart_tracking}
                onChange={(value) =>
                    handleFieldChange('enable_cart_tracking', value)
                }
                type="switch"
            />
            {enable_cart_tracking && (
                <>
                    <Field
                        label={__('Wait Period (minutes)', 'quillcrm')}
                        value={wait_period}
                        onChange={(value) =>
                            handleFieldChange('wait_period', value)
                        }
                        type="number"
                    />
                    <Field
                        label={__('Cool Off Period (days)', 'quillcrm')}
                        value={cool_off_period}
                        onChange={(value) =>
                            handleFieldChange('cool_off_period', value)
                        }
                        type="number"
                    />
                    <Field
                        label={__('Lost Cart (days)', 'quillcrm')}
                        value={lost_cart_days}
                        onChange={(value) =>
                            handleFieldChange('lost_cart_days', value)
                        }
                        type="number"
                    />
                    <Flex vertical gap={10}>
                        <Typography.Title level={5}>
                            {__('GDPR Consent', 'quillcrm')}
                        </Typography.Title>
                        <Field
                            label={__(
                                'Inform customers that their will be recieving marketing emails',
                                'quillcrm'
                            )}
                            value={gdpr_compliance}
                            onChange={(value) =>
                                handleFieldChange('gdpr_compliance', value)
                            }
                            type="switch"
                        />
                        {gdpr_compliance && (
                            <>
                                <Field
                                    label={__('GDPR Message', 'quillcrm')}
                                    value={gdpr_message}
                                    onChange={(value) =>
                                        handleFieldChange('gdpr_message', value)
                                    }
                                    type="textarea"
                                />
                                <Typography.Text type="secondary">
                                    {__(
                                        'Use {{no_thanks text="No Thanks"}} to add a no thanks link',
                                        'quillcrm'
                                    )}
                                </Typography.Text>
                            </>
                        )}
                    </Flex>
                    <Flex vertical gap={10}>
                        <Typography.Title level={5}>
                            {__('Contact tags and lists', 'quillcrm')}
                        </Typography.Title>
                        <Divider />
                        <Flex vertical gap={10}>
                            <Typography.Title level={5}>
                                {__('Add Lists on Cart Abandoned', 'quillcrm')}
                            </Typography.Title>
                            <Flex vertical gap={10}>
                                <Field
                                    label={__('Lists', 'quillcrm')}
                                    value={lists}
                                    onChange={(value) =>
                                        handleFieldChange('lists', value)
                                    }
                                    type="lists"
                                />
                                <Typography.Text type="secondary">
                                    {__(
                                        'The selected tag(s) will be added when cart is abandoned. The tag(s) will be automatically removed when cart recovers',
                                        'quillcrm'
                                    )}
                                </Typography.Text>
                            </Flex>
                            <Flex vertical gap={10}>
                                <Field
                                    label={__(
                                        'Add Tags on Cart Abandoned',
                                        'quillcrm'
                                    )}
                                    value={tags}
                                    onChange={(value) =>
                                        handleFieldChange('tags', value)
                                    }
                                    type="tags"
                                />
                                <Typography.Text type="secondary">
                                    {__(
                                        'The selected tag(s) will be added when cart is abandoned. The tag(s) will be automatically removed when cart recovers',
                                        'quillcrm'
                                    )}
                                </Typography.Text>
                            </Flex>
                        </Flex>
                        <Flex vertical gap={10}>
                            <Typography.Title level={5}>
                                {__('Lost Cart', 'quillcrm')}
                            </Typography.Title>
                            <Flex vertical gap={10}>
                                <Field
                                    label={__(
                                        'Add Lists on Cart Lost',
                                        'quillcrm'
                                    )}
                                    value={lost_lists}
                                    onChange={(value) =>
                                        handleFieldChange('lost_lists', value)
                                    }
                                    type="lists"
                                />
                                <Typography.Text type="secondary">
                                    {__(
                                        'The selected tag(s) will be added when cart is lost. The tag(s) will be automatically removed when cart recovers',
                                        'quillcrm'
                                    )}
                                </Typography.Text>
                            </Flex>
                            <Flex vertical gap={10}>
                                <Field
                                    label={__(
                                        'Add Tags on Cart Lost',
                                        'quillcrm'
                                    )}
                                    value={lost_tags}
                                    onChange={(value) =>
                                        handleFieldChange('lost_tags', value)
                                    }
                                    type="tags"
                                />
                                <Typography.Text type="secondary">
                                    {__(
                                        'The selected tag(s) will be added when cart is lost. The tag(s) will be automatically removed when cart recovers',
                                        'quillcrm'
                                    )}
                                </Typography.Text>
                            </Flex>
                        </Flex>
                    </Flex>
                </>
            )}
        </div>
    );
};

export default CartSettings;

