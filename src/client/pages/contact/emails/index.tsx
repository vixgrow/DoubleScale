/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import apiFetch from '@wordpress/api-fetch';
import { useEffect, useState } from '@wordpress/element';
import { addQueryArgs } from '@wordpress/url';
import { useDispatch } from '@wordpress/data';

/**
 * External dependencies
 */
import { Card, Typography, Table, Badge, Flex, Button, Modal, Divider } from 'antd';
import {
    EyeOutlined,
    LinkOutlined,
    UserOutlined,
    MailOutlined,
} from '@ant-design/icons';

/**
 * Internal dependencies
 */
import './style.scss';
import type {
    CampaignEmail,
} from '@quillcrm/client';
import { NavLink } from '@quillcrm/navigation';
import { convertDate } from '@quillcrm/utils';
import type { EmailAnalytics } from '../state/types';
import { useContactContext } from '../state/context';

interface EmailsProps {
    contact_id: number;
}

const Emails: React.FC<EmailsProps> = ({ contact_id }) => {
    const { emailAnalytics, setEmailAnalytics, contact } = useContactContext();
    const [loading, setLoading] = useState<boolean>(true);
    const [perPage, setPerPage] = useState<number>(10);
    const [page, setPage] = useState<number>(1);
    const [total, setTotal] = useState<number>(0);
    const [campaignEmail, setCampaignEmail] = useState<CampaignEmail | null>(null);
    const { createNotice } = useDispatch('quillcrm/core');

    const fetchEmails = async () => {
        setLoading(true);

        try {
            const response = (await apiFetch({
                path: addQueryArgs(
                    `/qc/v1/contacts/${contact_id}/email-campaigns`,
                    {
                        per_page: perPage,
                        page,
                    }
                ),
            })) as EmailAnalytics;

            if (!response || !response.emails) {
                createNotice({
                    type: 'error',
                    message: __('Failed to fetch emails', 'quillcrm'),
                });
                return;
            }

            setEmailAnalytics(response);
            setTotal(response.emails.total);
        } catch (error) {
            createNotice({
                type: 'error',
                message: __('Failed to fetch emails', 'quillcrm'),
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchEmails();
    }, [page, perPage]);

    if (!contact) {
        return null;
    }

    const columns = [
        {
            title: __('Contact', 'quillcrm'),
            dataIndex: 'contact',
            key: 'contact',
            render: (_, record: CampaignEmail) => (
                <NavLink to={`contacts/${contact.id}`}>
                    <Flex vertical gap={5}>
                        <Flex gap={10} align="center">
                            <div className="qcrm-contacts-list__avatar">
                                <UserOutlined />
                            </div>
                            {contact.first_name || '-'}{' '}
                            {contact.last_name || '-'}
                        </Flex>
                        <Typography.Text type="secondary">
                            {__('Sent on', 'quillcrm')}{' '}
                            {convertDate(record.sent_at)}
                        </Typography.Text>
                    </Flex>
                </NavLink>
            ),
        },
        {
            title: __('Email', 'quillcrm'),
            dataIndex: 'email',
            key: 'email',
            render: (_, _record: CampaignEmail) => contact.email,
        },
        {
            title: __('Sent Status', 'quillcrm'),
            dataIndex: 'status',
            key: 'status',
            render: (_, record: CampaignEmail) => (
                <Badge
                    status={record.status === 'sent' ? 'success' : 'error'}
                    text={record.status === 'sent' ? __('Sent', 'quillcrm') : __('Failed', 'quillcrm')}
                />
            ),
        },
        {
            title: __('Opened', 'quillcrm'),
            dataIndex: 'opened',
            key: 'opened',
            render: (_, record: CampaignEmail) => (
                <Badge
                    status={record.opened != '0' ? 'success' : 'default'}
                    text={
                        record.opened != '0'
                            ? __('Yes', 'quillcrm')
                            : __('No', 'quillcrm')
                    }
                />
            ),
        },
        {
            title: __('Clicked', 'quillcrm'),
            dataIndex: 'clicked',
            key: 'clicked',
            render: (_, record: CampaignEmail) => (
                <Badge
                    status={record.clicked != '0' ? 'success' : 'default'}
                    text={
                        record.clicked != '0'
                            ? __('Yes', 'quillcrm')
                            : __('No', 'quillcrm')
                    }
                />
            ),
        },
        {
            title: __('Template', 'quillcrm'),
            key: 'template',
            render: (_, record: CampaignEmail) => (
                <Button onClick={() => setCampaignEmail(record)}>
                    {__('View', 'quillcrm')}
                </Button>
            ),
        }
    ];

    const calculatePercentage = (total: number, value: number) => {
        if (total === 0) {
            return 0;
        }

        return ((value / total) * 100).toFixed(2);
    };

    return (
        <>
            <Card>
                <Typography.Title level={4}>
                    {__('Emails', 'quillcrm')}
                </Typography.Title>
                <Flex vertical gap={20}>
                    <Card loading={loading}>
                        {emailAnalytics && (
                            <Flex gap={20}>
                                <Card style={{ flex: 1 }}>
                                    <Flex vertical={true} gap={10}>
                                        <Flex gap={10}>
                                            <MailOutlined />
                                            <Typography.Text strong>
                                                {__('Total Emails', 'quillcrm')}
                                            </Typography.Text>
                                        </Flex>
                                        <Typography.Text className="qcrm-analytics-count">
                                            {total}
                                        </Typography.Text>
                                    </Flex>
                                </Card>
                                <Card style={{ flex: 1 }}>
                                    <Flex vertical={true} gap={10}>
                                        <Flex gap={10}>
                                            <EyeOutlined />
                                            <Typography.Text strong>
                                                {__('Open Rate', 'quillcrm')}
                                            </Typography.Text>
                                        </Flex>
                                        <Typography.Text className="qcrm-analytics-count">
                                            {calculatePercentage(
                                                total,
                                                emailAnalytics.total_opened
                                            )}
                                            %
                                        </Typography.Text>
                                    </Flex>
                                </Card>
                                <Card style={{ flex: 1 }}>
                                    <Flex vertical={true} gap={10}>
                                        <Flex gap={10}>
                                            <LinkOutlined />
                                            <Typography.Text strong>
                                                {__('Click Rate', 'quillcrm')}
                                            </Typography.Text>
                                        </Flex>
                                        <Typography.Text className="qcrm-analytics-count">
                                            {calculatePercentage(
                                                total,
                                                emailAnalytics.total_clicked
                                            )}
                                            %
                                        </Typography.Text>
                                    </Flex>
                                </Card>
                            </Flex>
                        )}
                    </Card>
                    <Table
                        dataSource={emailAnalytics?.emails.data}
                        columns={columns}
                        loading={loading}
                        pagination={{
                            current: page,
                            pageSize: perPage,
                            total: total,
                            onChange: (page, pageSize) => {
                                setPage(page);
                                setPerPage(pageSize);
                            },
                        }}
                    />
                </Flex>
                <Modal
                    open={!!campaignEmail}
                    title={__('Details')}
                    onCancel={() => setCampaignEmail(null)}
                    footer={null}
                    style={{ minWidth: '800px' }}
                >
                    {campaignEmail && (
                        <Flex vertical gap={20}>
                            <Flex vertical gap={10}>
                                <Flex gap={10}>
                                    <Typography.Text>{__('Status', 'quillcrm')}{': '}</Typography.Text>
                                    <Badge
                                        status={campaignEmail.status === 'sent' ? 'success' : 'error'}
                                        text={campaignEmail.status}
                                    />
                                </Flex>
                                {campaignEmail.campaign && (
                                    <Flex gap={10}>
                                        <Typography.Text>{__('Campaign', 'quillcrm')}{': '}</Typography.Text>
                                        <Typography.Text strong>{campaignEmail.campaign.name}</Typography.Text>
                                    </Flex>
                                )}
                                <Flex gap={10}>
                                    <Typography.Text>{__('From Name', 'quillcrm')}{': '}</Typography.Text>
                                    <Typography.Text strong>{campaignEmail.template.settings.from_name}</Typography.Text>
                                </Flex>
                                <Flex gap={10}>
                                    <Typography.Text>{__('From Email', 'quillcrm')}{': '}</Typography.Text>
                                    <Typography.Text strong>{campaignEmail.template.settings.from_email}</Typography.Text>
                                </Flex>
                                <Flex gap={10}>
                                    <Typography.Text>{__('Subject', 'quillcrm')}{': '}</Typography.Text>
                                    <Typography.Text strong>{campaignEmail.template.subject}</Typography.Text>
                                </Flex>
                            </Flex>
                            <Divider style={{ margin: 0 }} />
                            <Card title={__('Body', 'quillcrm')}>
                                <div dangerouslySetInnerHTML={{ __html: campaignEmail.template.body }} />
                            </Card>
                        </Flex>
                    )}
                </Modal>
            </Card>
        </>
    );
};

export default Emails;