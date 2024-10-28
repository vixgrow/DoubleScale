/**
 * WordPress dependencies
 */
import { useState, useEffect } from '@wordpress/element';
import apiFetch from '@wordpress/api-fetch';
import { addQueryArgs } from '@wordpress/url';
import { __ } from '@wordpress/i18n';
import { useDispatch } from '@wordpress/data';

/**
 * External dependencies
 */
import {
    Modal,
    Flex,
    Button,
    Typography,
    Progress,
    Spin,
} from 'antd';
import { map } from 'lodash';

/**
 * Internal dependencies
 */
import './style.scss';
import { Field, Filters } from '@quillcrm/components';
import ConfigAPI from '@quillcrm/config';
import type {
    Filter as FilterType,
    ContactsResponse
} from '@quillcrm/client';

export interface Props {
    open: boolean;
    onClose: () => void;
}

const ExportModal: React.FC<Props> = ({ open, onClose }) => {
    const [selectedFields, setSelectedFields] = useState<string[]>(['first_name', 'last_name', 'email']);
    const fields = ConfigAPI.getContactFieldsGroups();
    const [offset, setOffset] = useState(0);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(false);
    const [filters, setFilters] = useState<FilterType[]>([]);
    const [isFiltering, setIsFiltering] = useState(false);
    const [totalContact, setTotalContact] = useState(0);
    const { createNotice } = useDispatch('quillcrm/core');

    const handleExport = async (currentOffset = 0, file = '') => {
        if (selectedFields.length === 0 || loading) {
            return;
        }
        setLoading(true);

        try {
            const response = await apiFetch({
                path: addQueryArgs('/qc/v1/import-export/export'),
                method: 'POST',
                data: {
                    fields: selectedFields,
                    offset: currentOffset,
                    file_id: file,
                    filters: filters
                }
            }) as { offset: number, file_id: string, status: string, total: number };
            console.log(response);

            setTotal(response.total);
            if (response.status === 'in_progress') {
                setOffset(response.offset);
                setTimeout(() => handleExport(response.offset, response.file_id), 1000);
            } else {
                downloadFile(response.file_id);
            }
        } catch (error) {
            setLoading(false);
            createNotice({
                type: 'error',
                message: __('Export failed', 'quillcrm')
            });
        }
    };

    const downloadFile = async (fileId: string) => {
        try {
            const response = await apiFetch({
                path: addQueryArgs('/qc/v1/import-export/download', { file_id: fileId }),
                method: 'GET',
                parse: false
            }) as Response;

            const blob = await response.blob();

            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.style.display = 'none';
            const fileName = `quillcrm-contacts-${fileId}.csv`;
            a.href = url;
            a.download = fileName;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            handleClose();
        } catch (error) {
            console.log(error);

            createNotice({
                type: 'error',
                message: __('Download failed', 'quillcrm')
            });
        } finally {
            setLoading(false);
        }
    }

    const handleClose = () => {
        setOffset(0);
        setLoading(false);
        setSelectedFields(['first_name', 'last_name', 'email']);
        setFilters([]);
        setTotalContact(0);
        setTotal(0);
        setIsFiltering(false);
        onClose();
    };

    const fetchContacts = async () => {
        setIsFiltering(true);
        try {
            const response = (await apiFetch({
                path: addQueryArgs('/qc/v1/contacts', {
                    per_page: 1,
                    page: 1,
                    filters: filters,
                }),
                method: 'GET',
                parse: true,
            })) as ContactsResponse;

            setTotalContact(response.total);
        } catch (error) {
            createNotice({
                type: 'error',
                message: __('Failed to fetch contacts', 'quillcrm'),
            });
        } finally {
            setIsFiltering(false);
        }
    };

    useEffect(() => {
        fetchContacts();
    }, [open]);

    return (
        <Modal
            open={open}
            onCancel={handleClose}
            title={__('Export Contacts', 'quillcrm')}
            footer={[
                <Button key="back" onClick={onClose}>
                    {__('Cancel', 'quillcrm')}
                </Button>,
                <Button key="submit" type="primary" loading={loading} disabled={loading || selectedFields.length === 0 || isFiltering || totalContact === 0} onClick={() => handleExport()}>
                    {__('Export', 'quillcrm')}
                </Button>
            ]}
            style={{ minWidth: 800 }}
        >
            <Flex vertical gap={10}>
                {!loading && (
                    <>
                        <div className="qcrm-contacts-list__filters">
                            <Filters
                                filters={filters}
                                onChange={setFilters}
                                onApply={() => {
                                    fetchContacts();
                                }}
                                isApplying={isFiltering}
                            />
                        </div>
                        <div className="qcrm-contacts">
                            <Flex gap={10} className="qcrm-contacts-total">
                                {__(
                                    'Total Contacts based on filters',
                                    'quillcrm'
                                )}
                                :{' '}
                                {!isFiltering && (
                                    <Typography.Text strong>{totalContact}</Typography.Text>
                                )}
                                {isFiltering && <Spin />}
                            </Flex>
                        </div>
                        {!isFiltering && totalContact > 0 && (
                            <>
                                {map(fields, (fieldGroup, index) => (
                                    <Flex key={index} vertical gap={10}>
                                        <Typography.Title level={5}>{fieldGroup.label}</Typography.Title>
                                        <Flex wrap gap={20}>
                                            {map(fieldGroup.fields, (field, index) => (
                                                <Field
                                                    key={index}
                                                    label={field.label}
                                                    type='checkbox'
                                                    value={selectedFields.includes(index)}
                                                    onChange={(value) => {
                                                        if (value) {
                                                            setSelectedFields([...selectedFields, index]);
                                                        } else {
                                                            setSelectedFields(selectedFields.filter((selectedField) => selectedField !== index));
                                                        }
                                                    }}
                                                />
                                            ))}
                                        </Flex>
                                    </Flex>
                                ))}
                                <Flex vertical gap={10}>
                                    <Typography.Title level={5}>{__('Segments', 'quillcrm')}</Typography.Title>
                                    <Flex wrap gap={20}>
                                        <Field
                                            label={__('Lists', 'quillcrm')}
                                            type='checkbox'
                                            value={selectedFields.includes('lists')}
                                            onChange={(value) => {
                                                if (value) {
                                                    setSelectedFields([...selectedFields, 'lists']);
                                                } else {
                                                    setSelectedFields(selectedFields.filter((selectedField) => selectedField !== 'lists'));
                                                }
                                            }}
                                        />
                                        <Field
                                            label={__('Tags', 'quillcrm')}
                                            type='checkbox'
                                            value={selectedFields.includes('tags')}
                                            onChange={(value) => {
                                                if (value) {
                                                    setSelectedFields([...selectedFields, 'tags']);
                                                } else {
                                                    setSelectedFields(selectedFields.filter((selectedField) => selectedField !== 'tags'));
                                                }
                                            }}
                                        />
                                    </Flex>
                                </Flex>
                                <Flex vertical gap={10}>
                                    <Typography.Title level={5}>{__('Engagement', 'quillcrm')}</Typography.Title>
                                    <Flex wrap gap={20}>
                                        <Field
                                            label={__('Last Email Sent', 'quillcrm')}
                                            type='checkbox'
                                            value={selectedFields.includes('last_sent')}
                                            onChange={(value) => {
                                                if (value) {
                                                    setSelectedFields([...selectedFields, 'last_sent']);
                                                } else {
                                                    setSelectedFields(selectedFields.filter((selectedField) => selectedField !== 'last_sent'));
                                                }
                                            }}
                                        />
                                        <Field
                                            label={__('Last Email Opened', 'quillcrm')}
                                            type='checkbox'
                                            value={selectedFields.includes('last_opened')}
                                            onChange={(value) => {
                                                if (value) {
                                                    setSelectedFields([...selectedFields, 'last_opened']);
                                                } else {
                                                    setSelectedFields(selectedFields.filter((selectedField) => selectedField !== 'last_opened'));
                                                }
                                            }}
                                        />
                                        <Field
                                            label={__('Last Email Clicked', 'quillcrm')}
                                            type='checkbox'
                                            value={selectedFields.includes('last_clicked')}
                                            onChange={(value) => {
                                                if (value) {
                                                    setSelectedFields([...selectedFields, 'last_clicked']);
                                                } else {
                                                    setSelectedFields(selectedFields.filter((selectedField) => selectedField !== 'last_clicked'));
                                                }
                                            }}
                                        />
                                    </Flex>
                                </Flex>
                            </>
                        )}
                        {!isFiltering && totalContact === 0 && (
                            <Typography.Text>{__('No contacts found based on the filters', 'quillcrm')}</Typography.Text>
                        )}
                    </>
                )}
                {loading && (
                    <Flex vertical gap={10}>
                        <Typography.Text>{__('Exporting...', 'quillcrm')}</Typography.Text>
                        <Progress percent={Math.round((offset / total) * 100)} />
                    </Flex>
                )}
            </Flex>
        </Modal>
    )
};

export default ExportModal;