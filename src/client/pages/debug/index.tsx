/**
 * WordPress dependencies
 */
import { useState, useEffect } from '@wordpress/element';
import apiFetch from '@wordpress/api-fetch';
import { __ } from '@wordpress/i18n';
import { useDispatch } from '@wordpress/data';
import { addQueryArgs } from '@wordpress/url';

/**
 * External dependencies
 */
import { Table, Card, Flex, Typography, Modal, Button } from 'antd';

/**
 * Internal dependencies
 */
import './style.scss';
import type { Log } from '@quillcrm/client';
import { convertDate } from '@quillcrm/utils';

const Debug: React.FC = () => {
    const [loading, setLoading] = useState<boolean>(true);
    const [total, setTotal] = useState<number>(0);
    const [page, setPage] = useState<number>(1);
    const [perPage, setPerPage] = useState<number>(10);
    const [logs, setLogs] = useState<Log[]>([]);
    const { createNotice } = useDispatch('quillcrm/core');
    const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);

    const fetchLogs = async () => {
        try {
            const response = await apiFetch({
                path: addQueryArgs('/qc/v1/logs', {
                    page,
                    per_page: perPage,
                }),
            }) as { items: Log[], total_items: number, total_pages: number, page: number, per_page: number };

            setLogs(response.items);
            setTotal(response.total_items);
            setPage(response.page);
            setPerPage(response.per_page);
        } catch (error: any) {
            createNotice({
                type: 'error',
                message: error.message,
            });
        } finally {
            setLoading(false);
        }
    };

    const deleteAll = async () => {
        const data = {};
        if (selectedRowKeys.length > 0) {
            data['ids'] = selectedRowKeys;
        }
        try {
            await apiFetch({
                path: '/qc/v1/logs',
                method: 'DELETE',
                data,
            });

            fetchLogs();
        } catch (error: any) {
            createNotice({
                type: 'error',
                message: error.message,
            });
        }
    };

    const exportLogs = async () => {
        try {
            const response = await apiFetch({
                path: addQueryArgs('/qc/v1/logs', {
                    export: 'json',
                }),
            });

            const blob = new Blob([JSON.stringify(response)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'logs.json';
            a.click();
        } catch (error: any) {
            createNotice({
                type: 'error',
                message: error.message,
            });
        }
    };

    useEffect(() => {
        fetchLogs();
    }, []);

    const columns = [
        {
            title: __('Source', 'quillcrm'),
            dataIndex: 'source',
            key: 'source',
        },
        {
            title: __('Level', 'quillcrm'),
            dataIndex: 'level',
            key: 'level',
        },
        {
            title: __('Message', 'quillcrm'),
            dataIndex: 'message',
            key: 'message',
        },
        {
            title: __('Date', 'quillcrm'),
            dataIndex: 'local_datetime',
            key: 'local_datetime',
            render: (text: string) => convertDate(text, true),
        },
        {
            title: __('Actions', 'quillcrm'),
            key: 'actions',
            render: (text: string, record: Log) => (
                <Flex>
                    <Button
                        type="link"
                        onClick={() => {
                            Modal.info({
                                title: __('Log Details', 'quillcrm'),
                                content: (
                                    <Flex style={{ height: '600px', overflowY: 'auto' }}>
                                        <pre>{JSON.stringify(record.context, null, 2)}</pre>
                                    </Flex>
                                ),
                                width: 800,
                            });
                        }}
                    >
                        {__('View', 'quillcrm')}
                    </Button>
                </Flex>
            ),
        }
    ];

    return (
        <div className="qcrm-debug">
            <Flex
                className="qcrm-contacts-list__actions"
                gap={20}
            >
                <Button type="primary" onClick={() => deleteAll()}>
                    {__('Delete All', 'quillcrm')}
                </Button>
                <Button type="primary" onClick={() => exportLogs()}>
                    {__('Export', 'quillcrm')}
                </Button>
            </Flex>
            <Card title={__('Logs', 'quillcrm')}>
                <Table
                    columns={columns}
                    dataSource={logs}
                    rowKey="id"
                    loading={loading}
                    pagination={{
                        total,
                        current: page,
                        pageSize: perPage,
                        onChange: (newPage, newPerPage) => {
                            setPage(newPage);
                            setPerPage(newPerPage);
                            fetchLogs();
                        },
                    }}
                    rowSelection={{
                        selectedRowKeys,
                        onChange: (selectedRowKeys) =>
                            setSelectedRowKeys(selectedRowKeys),
                    }}
                />
            </Card>
        </div>
    );
};

export default Debug;