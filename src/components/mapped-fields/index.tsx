/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * External dependencies
 */
import { Typography, Flex, Input } from 'antd';

/**
 * Internal dependencies
 */
import './style.scss';
import { map } from 'lodash';

interface MappedFieldsProps {
    onChange: (value: { [key: string]: string }) => void;
    values: { [key: string]: string };
    fields: {
        [key: string]: {
            label: string;
        };
    };
}

const MappedFields: React.FC<MappedFieldsProps> = ({
    onChange,
    values,
    fields,
}) => {
    return (
        <Flex gap={10} vertical>
            <Flex gap={20}>
                <Typography.Text style={{ flex: 1 }} strong>
                    {__('Field')}
                </Typography.Text>
                <Typography.Text style={{ flex: 1 }} strong>
                    {__('Contact Field')}
                </Typography.Text>
            </Flex>
            {map(fields, (_, key) => {
                return (
                    <Flex key={key} gap={20}>
                        <Input
                            value={fields[key].label}
                            disabled
                            style={{ flex: 1 }}
                        />
                        <Input
                            value={values ? values[key] : ''}
                            onChange={(e) => {
                                onChange({ ...values, [key]: e.target.value });
                            }}
                            style={{ flex: 1 }}
                        />
                    </Flex>
                );
            })}
        </Flex>
    );
};

export default MappedFields;
