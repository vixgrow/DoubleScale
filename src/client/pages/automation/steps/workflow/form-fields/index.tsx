/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useState, useEffect } from '@wordpress/element';
import { useDispatch } from '@wordpress/data';

/**
 * External dependencies
 */
import { Typography, Card, Flex, Select, Switch } from 'antd';
import { map, keys, mapValues } from 'lodash';

/**
 * Internal dependencies
 */
import './style.scss';
import ConfigAPI from '@quillcrm/config';
import type { Form } from '@quillcrm/config';
import AjaxSelect from './ajax-select';
import type { MappedFields } from '@quillcrm/client';
import { ListField, TagField, ContactMappedFields } from '@quillcrm/components';

interface FormFieldsProps {
    values: { [key: string]: any };
    onChange: (value: any) => void;
}

const FormFields: React.FC<FormFieldsProps> = ({ values, onChange }) => {
    const [formFields, setFormFields] = useState<
        Form['fields_settings']['fields'] | null
    >(null);
    const [isFetching, setIsFetching] = useState(true);
    const { form_type, form_id, mapped_fields = {}, lists = [], tags = [], update_existing_contact = false, update_blank_fields = false, mark_as_subscribed = false } = values;
    const forms = ConfigAPI.getForms();
    const fieldsSettings = form_type
        ? forms[form_type]?.fields_settings
        : null;
    const { getAjaxUrl, getNonce } = ConfigAPI;
    const formOptions = form_type ? forms[form_type]?.options : {};
    const { createNotice } = useDispatch('quillcrm/core');

    const checkConditions = (conditions) => {
        if (!conditions) {
            return true;
        }

        const { relation = 'and', rules = [] } = conditions;

        for (let i = 0; i < rules.length; i++) {
            const rule = rules[i];

            if (
                !checkCondition(rule.field, rule.operator, rule.value) &&
                relation === 'and'
            ) {
                return false;
            }
        }

        return true;
    };

    const checkCondition = (field, operator, value) => {
        if (!values) {
            return false;
        }

        switch (operator) {
            case '==':
                return values[field] === value;
            case '!=':
                return values[field] !== value;
            case 'contains':
                return values[field].includes(value);
            case 'not_contains':
                return !values[field].includes(value);
            case 'empty':
                return !values[field];
            case 'not_empty':
                return !!values[field];
            default:
                return false;
        }
    };

    const getFormFields = async () => {
        if (!fieldsSettings || !form_id) {
            setIsFetching(false);
            return;
        }

        try {
            const body = new FormData();
            body.append('action', fieldsSettings.action);
            body.append('nonce', getNonce());
            map(fieldsSettings.fields, (key) => {
                body.append(key, values[key] || '');
            });

            const response = await fetch(getAjaxUrl(), {
                method: 'POST',
                body,
            });

            const data = await response.json();

            if (!data.success) {
                throw new Error(data.data);
            }

            setFormFields(
                data.data as Form['fields_settings']['fields']
            );
        } catch (error) {
            createNotice({
                type: 'error',
                message: __('Failed to fetch form fields', 'quillcrm'),
            });
        } finally {
            setIsFetching(false);
        }
    };

    useEffect(() => {
        getFormFields();
    }, [form_id]);

    return (
        <Flex gap={20} vertical>
            <div className="qcrm-fields">
                <div
                    className="qcrm-field"
                    style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        marginBottom: 20,
                    }}
                >
                    <div className="qcrm-field-label">
                        <Typography.Text>
                            {__('Select Form Type', 'quillcrm')}
                        </Typography.Text>
                    </div>
                    <div className="qcrm-field-input">
                        <Select
                            style={{ width: 200 }}
                            value={form_type}
                            onChange={(value) => {
                                onChange({
                                    ...values,
                                    form_type: value,
                                    form_id: null,
                                    mapped_fields: {},
                                });
                            }}
                            options={map(keys(forms), (key) => ({
                                value: key,
                                label: forms[key].label,
                                disabled: !forms[key].is_enabled
                            }))}
                        />
                    </div>
                </div>
                {form_type &&
                    map(formOptions, (options, key) => {
                        const {
                            type,
                            label,
                            ajax_action = '',
                            conditions,
                            parent = '',
                        } = options;

                        if (!checkConditions(conditions)) {
                            return null;
                        }

                        if (parent && !values[parent]) {
                            return null;
                        }

                        switch (type) {
                            case 'ajax_select':
                                return (
                                    <AjaxSelect
                                        label={label}
                                        ajax_action={ajax_action}
                                        key={key}
                                        parent={parent}
                                        slug={key}
                                        values={values}
                                        onChange={(value) => {
                                            onChange({
                                                ...values,
                                                [key]: value,
                                            });
                                        }}
                                    />
                                );
                            default:
                                return null;
                        }
                    })}
                {form_type && form_id && (
                    <Card loading={isFetching}>
                        {!isFetching && (
                            <div className="qcrm-fields">
                                <div className="qcrm-field">
                                    <div className="qcrm-field-label">
                                        <Typography.Text>
                                            {__('Map fields', 'quillcrm')}
                                        </Typography.Text>
                                    </div>
                                    {formFields && (
                                        <ContactMappedFields
                                            values={mapped_fields}
                                            onChange={(value: MappedFields) => {
                                                onChange({
                                                    ...values,
                                                    mapped_fields: value,
                                                });
                                            }}
                                            fields={mapValues(
                                                formFields,
                                                (name) => ({ label: name })
                                            )}
                                        />
                                    )}
                                </div>
                                <div className="qcrm-field">
                                    <div className="qcrm-field-label">
                                        <Typography.Text>
                                            {__('Contact', 'quillcrm')}
                                        </Typography.Text>
                                    </div>
                                    <div className="qcrm-field-input">
                                        <Flex vertical={true} gap={10}>
                                            <Flex
                                                justify="space-between"
                                                gap={10}
                                            >
                                                <Flex
                                                    vertical={true}
                                                    gap={10}
                                                    style={{ flex: 1 }}
                                                >
                                                    <Typography.Text>
                                                        {__(
                                                            'Lists',
                                                            'quillcrm'
                                                        )}
                                                    </Typography.Text>
                                                    <ListField
                                                        value={
                                                            lists
                                                        }
                                                        onChange={(value) => {
                                                            onChange({
                                                                ...values,
                                                                lists: value,
                                                            });
                                                        }}
                                                    />
                                                </Flex>
                                                <Flex
                                                    vertical={true}
                                                    gap={10}
                                                    style={{ flex: 1 }}
                                                >
                                                    <Typography.Text>
                                                        {__('Tags', 'quillcrm')}
                                                    </Typography.Text>
                                                    <TagField
                                                        value={
                                                            tags
                                                        }
                                                        onChange={(value) => {
                                                            onChange({
                                                                ...values,
                                                                tags: value,
                                                            });
                                                        }}
                                                    />
                                                </Flex>
                                            </Flex>
                                            <Flex
                                                gap={10}
                                                justify="space-between"
                                            >
                                                <Typography.Text>
                                                    {__(
                                                        'Update existing contact',
                                                        'quillcrm'
                                                    )}
                                                </Typography.Text>
                                                <Switch
                                                    checked={update_existing_contact}
                                                    onChange={(value) => {
                                                        onChange({
                                                            ...values,
                                                            update_existing_contact: value,
                                                        });
                                                    }}
                                                />
                                            </Flex>
                                            <Flex
                                                gap={10}
                                                justify="space-between"
                                            >
                                                <Typography.Text>
                                                    {__(
                                                        'Update blank fields',
                                                        'quillcrm'
                                                    )}
                                                </Typography.Text>
                                                <Switch
                                                    checked={update_blank_fields}
                                                    onChange={(value) => {
                                                        onChange({
                                                            ...values,
                                                            update_blank_fields: value,
                                                        });
                                                    }}
                                                />
                                            </Flex>
                                            <Flex
                                                gap={10}
                                                justify="space-between"
                                            >
                                                <Typography.Text>
                                                    {__(
                                                        'Mark as Subscribed',
                                                        'quillcrm'
                                                    )}
                                                </Typography.Text>
                                                <Switch
                                                    checked={
                                                        mark_as_subscribed
                                                    }
                                                    onChange={(value) => {
                                                        onChange({
                                                            ...values,
                                                            mark_as_subscribed: value,
                                                        });
                                                    }}
                                                />
                                            </Flex>
                                        </Flex>
                                    </div>
                                </div>
                            </div>
                        )}
                    </Card>
                )}
            </div>
        </Flex>
    );
};

export default FormFields;
