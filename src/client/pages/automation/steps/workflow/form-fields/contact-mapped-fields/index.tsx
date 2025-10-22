/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * External dependencies
 */
import Select from 'react-select';
import { find, flatMap } from 'lodash';
import { useState } from 'react';

/**
 * Internal dependencies
 */
import ConfigAPI from '@quillcrm/config';
import { isObject, map } from 'lodash';
import { Input } from '@/components/ui/input';
import { ChevronDown, ChevronUp } from 'lucide-react';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface ContactMappedFieldsProps {
    onChange: (value: { [key: string]: string }) => void;
    values: { [key: string]: string };
    fields: {
        [key: string]: {
            label: string;
        };
    };
}

const ContactMappedFields: React.FC<ContactMappedFieldsProps> = ({
    onChange,
    values,
    fields,
}) => {
    const contactFieldsGroups = ConfigAPI.getContactFieldsGroups();

    const getAllValue = (value: string) => {
        if (!value) {
            return null;
        }

        const groups = flatMap(contactFieldsGroups, (group) => group.fields);
        const field = find(groups, (fields) => fields[value]);

        return field ? { label: field[value].label, value } : null;
    };

    const options = map(contactFieldsGroups, (group, groupKey) => ({
        label: group.label,
        value: groupKey,
        options: map(group.fields, (field, fieldKey) => ({
            label: field.label,
            value: fieldKey,
        })),
    }));

    // @ts-ignore The none option not a group.
    options.unshift({
        label: __('None', 'quillcrm'),
        value: '',
    });

    const [isAccordionOpen, setIsAccordionOpen] = useState(false);

    return (
        <Card className="shadow-none">
            <CardHeader className={`px-4 py-2 ${isAccordionOpen ? 'border-b-2' : ''}`}>
                <CardTitle className="flex items-center justify-between font-semibold text-base">
                    <div className="flex items-center gap-2">
                        {__('Fields & Contact Fields', 'quillcrm')}
                    </div>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsAccordionOpen(!isAccordionOpen)}
                        className="h-8 w-8 p-0"
                    >
                        {isAccordionOpen ? (
                            <ChevronUp className="h-6 w-6" />
                        ) : (
                            <ChevronDown className="h-6 w-6" />
                        )}
                    </Button>
                </CardTitle>
            </CardHeader>
            {isAccordionOpen && (
                <CardContent className="p-0">
                    <div className="flex flex-col divide-y">
                        {map(fields, (_, key) => {
                            return (
                                <div key={key} className="px-4 py-3">
                                    <div className="space-y-3">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                {__('Field', 'quillcrm')} <span className="text-red-600">*</span>
                                            </label>
                                            <Input
                                                value={fields[key].label}
                                                disabled
                                                className="w-full h-10 px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                {__('Contact Field', 'quillcrm')} <span className="text-red-600">*</span>
                                            </label>
                                            <Select
                                                className="react-select-container"
                                                classNamePrefix="react-select"
                                                onChange={(value) => {
                                                    if (!isObject(value)) {
                                                        return;
                                                    }

                                                    onChange({
                                                        ...values,
                                                        [key]: value.value,
                                                    });
                                                }}
                                                value={values ? getAllValue(values[key]) : null}
                                                options={options}
                                                styles={{
                                                    control: (styles) => ({
                                                        ...styles,
                                                        minHeight: '40px',
                                                        border: '1px solid #d1d5db',
                                                        borderRadius: '6px',
                                                        '&:hover': {
                                                            borderColor: '#9ca3af',
                                                        },
                                                    }),
                                                    container: (styles) => ({
                                                        ...styles,
                                                        width: '100%',
                                                    }),
                                                    menu: (base: any) => ({
                                                        ...base,
                                                        color: 'black',
                                                        zIndex: 9999,
                                                    }),
                                                    dropdownIndicator: (styles) => ({
                                                        ...styles,
                                                        color: '#6b7280',
                                                    }),
                                                }}
                                                isSearchable={false}
                                                placeholder={__('Select contact field...', 'quillcrm')}
                                            />
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </CardContent>
            )}
        </Card>
    );
};

export default ContactMappedFields;

