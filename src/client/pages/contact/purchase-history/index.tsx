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
import { Card, Typography, Table, Flex, Divider } from 'antd';
import {
    TransactionOutlined,
    ShopOutlined,
} from '@ant-design/icons';

/**
 * Internal dependencies
 */
import './style.scss';
import type {
    PurchaseHistory as PurchaseHistoryType,
} from '../state/types';
import { convertDate } from '@quillcrm/utils';
import { useContactContext } from '../state/context';
import ConfigAPI from '@quillcrm/config';
import { Order, EddOrder } from '@quillcrm/client';

interface PurchaseHistoryProps {
    contact_id: number;
}

const PurchaseHistory = ({ contact_id }: PurchaseHistoryProps) => {
    const { purchaseHistory, setPurchaseHistory } = useContactContext();
    const [loading, setLoading] = useState<boolean>(false);
    const isEddActive = ConfigAPI.isEddActive();
    const isWooActive = ConfigAPI.isWoocommerceActive();
    const { createNotice } = useDispatch('quillcrm/core');

    const fetchPurchaseHistory = async () => {
        setLoading(true);
        try {
            const response = await apiFetch({
                path: `/qc/v1/contacts/${contact_id}/purchase-history`,
            }) as PurchaseHistoryType;

            setPurchaseHistory(response);
        } catch (error: any) {
            createNotice({
                type: 'error',
                message: error.message,
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPurchaseHistory();
    }, []);

    const wooTableColumns = [
        {
            title: __('Order ID', 'quillcrm'),
            dataIndex: 'id',
            key: 'id',
            render: (_, record: Order) => (
                <Typography.Text>
                    {record.id}
                </Typography.Text>
            ),
        },
        {
            title: __('Date', 'quillcrm'),
            dataIndex: 'date',
            key: 'date',
            render: (_, record: Order) => (
                <Typography.Text>
                    {convertDate(record.date_created_gmt)}
                </Typography.Text>
            ),
        },
        {
            title: __('Status', 'quillcrm'),
            dataIndex: 'status',
            key: 'status',
            render: (status: string) => (
                <Typography.Text>
                    {status}
                </Typography.Text>
            ),
        },
        {
            title: __('Total', 'quillcrm'),
            dataIndex: 'total',
            key: 'total',
            render: (_, record: Order) => (
                <Typography.Text>
                    {record.total_amount}{' '}{record.currency}
                </Typography.Text>
            ),
        },
        {
            title: __('Actions', 'quillcrm'),
            dataIndex: 'actions',
            key: 'actions',
            render: (_, record: Order) => (
                <Typography.Link href={record.url} target="_blank">
                    {__('View', 'quillcrm')}
                </Typography.Link>
            ),
        }
    ];

    const eddTableColumns = [
        {
            title: __('Order ID', 'quillcrm'),
            dataIndex: 'id',
            key: 'id',
            render: (_, record: EddOrder) => (
                <Typography.Text>
                    {record.id}
                </Typography.Text>
            ),
        },
        {
            title: __('Date', 'quillcrm'),
            dataIndex: 'date',
            key: 'date',
            render: (_, record: EddOrder) => (
                <Typography.Text>
                    {convertDate(record.date_completed)}
                </Typography.Text>
            ),
        },
        {
            title: __('Status', 'quillcrm'),
            dataIndex: 'status',
            key: 'status',
            render: (status: string) => (
                <Typography.Text>
                    {status}
                </Typography.Text>
            ),
        },
        {
            title: __('Total', 'quillcrm'),
            dataIndex: 'total',
            key: 'total',
            render: (_, record: EddOrder) => (
                <Typography.Text>
                    {record.total}{' '}{record.currency}
                </Typography.Text>
            ),
        },
        {
            title: __('Actions', 'quillcrm'),
            dataIndex: 'actions',
            key: 'actions',
            render: (_, record: EddOrder) => (
                <Typography.Link href={record.url} target="_blank">
                    {__('View', 'quillcrm')}
                </Typography.Link>
            ),
        }
    ];

    return (
        <Flex vertical gap={20}>
            <Card loading={loading}>
                {isWooActive && purchaseHistory && (
                    <>
                        <Typography.Title level={4}>
                            {__('Woocommerce Purchase History', 'quillcrm')}
                        </Typography.Title>
                        <Flex vertical gap={20}>
                            <Flex gap={20}>
                                <Card style={{ flex: 1 }}>
                                    <Flex vertical={true} gap={10}>
                                        <Flex gap={10}>
                                            <ShopOutlined />
                                            <Typography.Text strong>
                                                {__('Total Orders', 'quillcrm')}
                                            </Typography.Text>
                                        </Flex>
                                        <Typography.Text className="qcrm-analytics-count">
                                            {purchaseHistory.wc.total}
                                        </Typography.Text>
                                    </Flex>
                                </Card>
                                <Card style={{ flex: 1 }}>
                                    <Flex vertical={true} gap={10}>
                                        <Flex gap={10}>
                                            <TransactionOutlined />
                                            <Typography.Text strong>
                                                {__('Total Revenue', 'quillcrm')}
                                            </Typography.Text>
                                        </Flex>
                                        <Typography.Text className="qcrm-analytics-count">
                                            {purchaseHistory.wc.revenue}{' '}{purchaseHistory.wc.currency}
                                        </Typography.Text>
                                    </Flex>
                                </Card>
                                <Card style={{ flex: 1 }}>
                                    <Flex vertical={true} gap={10}>
                                        <Flex gap={10}>
                                            <ShopOutlined />
                                            <Typography.Text strong>
                                                {__('Average Order Value', 'quillcrm')}
                                            </Typography.Text>
                                        </Flex>
                                        <Typography.Text className="qcrm-analytics-count">
                                            {purchaseHistory.wc.average}{' '}{purchaseHistory.wc.currency}
                                        </Typography.Text>
                                    </Flex>
                                </Card>
                            </Flex>
                            <Divider />
                            <Table
                                columns={wooTableColumns}
                                dataSource={purchaseHistory.wc.orders}
                                rowKey="id"
                                pagination={false}
                            />
                        </Flex>
                    </>
                )}
            </Card>
            <Card loading={loading}>
                {isEddActive && purchaseHistory && (
                    <>
                        <Typography.Title level={4}>
                            {__('Easy Digital Downloads Purchase History', 'quillcrm')}
                        </Typography.Title>
                        <Flex vertical gap={20}>
                            <Flex gap={20}>
                                <Card style={{ flex: 1 }}>
                                    <Flex vertical={true} gap={10}>
                                        <Flex gap={10}>
                                            <ShopOutlined />
                                            <Typography.Text strong>
                                                {__('Total Orders', 'quillcrm')}
                                            </Typography.Text>
                                        </Flex>
                                        <Typography.Text className="qcrm-analytics-count">
                                            {purchaseHistory.edd.total}
                                        </Typography.Text>
                                    </Flex>
                                </Card>
                                <Card style={{ flex: 1 }}>
                                    <Flex vertical={true} gap={10}>
                                        <Flex gap={10}>
                                            <TransactionOutlined />
                                            <Typography.Text strong>
                                                {__('Total Revenue', 'quillcrm')}
                                            </Typography.Text>
                                        </Flex>
                                        <Typography.Text className="qcrm-analytics-count">
                                            {purchaseHistory.edd.revenue}{' '}{purchaseHistory.edd.currency}
                                        </Typography.Text>
                                    </Flex>
                                </Card>
                                <Card style={{ flex: 1 }}>
                                    <Flex vertical={true} gap={10}>
                                        <Flex gap={10}>
                                            <ShopOutlined />
                                            <Typography.Text strong>
                                                {__('Average Order Value', 'quillcrm')}
                                            </Typography.Text>
                                        </Flex>
                                        <Typography.Text className="qcrm-analytics-count">
                                            {purchaseHistory.edd.average}{' '}{purchaseHistory.edd.currency}
                                        </Typography.Text>
                                    </Flex>
                                </Card>
                            </Flex>
                            <Divider />
                            <Table
                                columns={eddTableColumns}
                                dataSource={purchaseHistory.edd.orders}
                                rowKey="id"
                                pagination={false}
                            />
                        </Flex>
                    </>
                )}
            </Card>
        </Flex>
    );
}

export default PurchaseHistory;

