/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import './style.scss';

import { map } from 'lodash';
import { Input } from '@/components/ui/input';

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
        <div className='flex gap-2.5 flex-col'>
            <div className='flex gap-5'>
                <span style={{ flex: 1 }}>
                    {__('Field')}
                </span>
                <span style={{ flex: 1 }}>
                    {__('Contact Field')}
                </span>
            </div>
            {map(fields, (_, key) => {
                return (
                    <div key={key} className='flex gap-5'>
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
                    </div>
                );
            })}
        </div>
    );
};

export default MappedFields;
