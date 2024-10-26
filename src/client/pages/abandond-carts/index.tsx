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
import { Table, Flex, Select, Button, Badge, Modal, Typography } from 'antd';

/**
 * Internal dependencies
 */
import './style.scss';
import type { AbandonedCart, AbandonedCartsResponse, CartItem } from '@quillcrm/client';
import { convertDate } from '@quillcrm/utils';
import { map } from 'lodash';

const { Column } = Table;

const AbandonedCartsList: React.FC = () => {
	const [loading, setLoading] = useState(true);
	const [page, setPage] = useState(1);
	const [perPage, setPerPage] = useState(10);
	const [total, setTotal] = useState(0);
	const [data, setData] = useState<AbandonedCart[]>([]);
	const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
	const { createNotice } = useDispatch('quillcrm/core');
	const [bulkAction, setBulkAction] = useState('');
	const [isApplying, setIsApplying] = useState(false);
	const [cartId, setCartId] = useState(0);

	const fetchAbandonedCarts = async () => {
		setLoading(true);
		try {
			const response = (await apiFetch({
				path: addQueryArgs('/qc/v1/abandoned-carts', {
					page,
					per_page: perPage,
				}),
				method: 'GET',
			})) as AbandonedCartsResponse;

			response.total && setTotal(response.total);
			response.data && setData(response.data);
		} catch (error) {
			createNotice({
				type: 'error',
				message: __('Failed to fetch carts', 'quillcrm'),
			});
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchAbandonedCarts();
	}, [page, perPage]);

	const deleteSelected = async () => {
		setIsApplying(true);
		try {
			await apiFetch({
				path: '/qc/v1/abandoned-carts',
				method: 'DELETE',
				data: {
					ids: selectedRowKeys,
				},
			});

			createNotice({
				type: 'success',
				message: __('Carts deleted', 'quillcrm'),
			});
			setSelectedRowKeys([]);
			fetchAbandonedCarts();
		} catch (error) {
			createNotice({
				type: 'error',
				message: __('Failed to delete carts', 'quillcrm'),
			});
		} finally {
			setIsApplying(false);
		}
	};
	const billingFields = [
		'billing_city',
		'billing_state',
		'billing_postcode',
		'billing_country',
		'billing_phone',
	];

	const shippingFields = [
		'shipping_address_1',
		'shipping_address_2',
		'shipping_city',
		'shipping_state',
		'shipping_postcode',
		'shipping_country',
	];

	const getCart = (id: number): AbandonedCart => {
		return data.find((cart) => cart.id === id) as AbandonedCart;
	};

	return (
		<div className="qcrm-carts-list">
			<Flex
				className="qcrm-contacts-list__actions"
				justify="space-between"
			>
				<Flex gap={10}>
					<Flex gap={10}>
						<Select
							options={[
								{
									label: __('Bulk Actions', 'quillcrm'),
									value: '',
								},
								{
									label: __('Delete', 'quillcrm'),
									value: 'delete',
								},
							]}
							value={bulkAction}
							onChange={(value) => setBulkAction(value)}
							disabled={selectedRowKeys.length === 0}
						/>
						<Button
							type="primary"
							onClick={() => {
								if (bulkAction === 'delete') {
									deleteSelected();
								}
							}}
							disabled={selectedRowKeys.length === 0}
							loading={isApplying}
						>
							{__('Apply', 'quillcrm')}
						</Button>
					</Flex>
				</Flex>
			</Flex>
			<Table
				dataSource={data}
				rowKey="id"
				loading={loading}
				pagination={{
					current: page,
					pageSize: perPage,
					total: total,
					onChange: (page, perPage) => {
						setPage(page);
						setPerPage(perPage);
					},
				}}
				rowSelection={{
					selectedRowKeys,
					onChange: (selectedRowKeys) =>
						setSelectedRowKeys(selectedRowKeys),
				}}
			>
				<Column
					title={__('Email', 'quillcrm')}
					dataIndex="email"
					key="email"
				/>
				<Column
					title={__('Status', 'quillcrm')}
					dataIndex="status"
					key="status"
					render={(text) => (
						<Badge
							status={
								text === 'skipped'
									? 'warning'
									: text === 'recovered'
										? 'success'
										: text === 'processing'
											? 'processing'
											: text === 'pending'
												? 'default'
												: 'error'
							}
							text={text}
						/>
					)}
				/>
				<Column
					title={__('Total', 'quillcrm')}
					dataIndex="total"
					key="total"
				/>
				<Column
					title={__('View', 'quillcrm')}
					key="view"
					render={(_, record: AbandonedCart) => (
						<Button onClick={() => setCartId(record.id)}>
							{__('View', 'quillcrm')}
						</Button>
					)}
				/>
				<Column
					title={__('Created At', 'quillcrm')}
					dataIndex="created_at"
					key="created_at"
					render={(text) => convertDate(text)}
				/>
				<Column
					title={__('Updated At', 'quillcrm')}
					dataIndex="updated_at"
					key="updated_at"
					render={(text) => convertDate(text)}
				/>
			</Table>
			<Modal
				title={__('Cart Details', 'quillcrm')}
				open={cartId !== 0}
				onCancel={() => setCartId(0)}
				style={{ minWidth: '800px' }}
				footer={null}
			>
				{cartId !== 0 && (
					<Flex vertical gap={20}>
						<Flex justify='space-between'>
							<Flex vertical gap={10}>
								<Typography.Title level={5}>{__('Billing Address', 'quillcrm')}</Typography.Title>
								<Flex vertical gap={10}>
									{billingFields.map((field) => (
										<Flex justify='space-between'>
											<Typography.Text>{getCart(cartId).fields[field]}</Typography.Text>
										</Flex>
									))}
								</Flex>
							</Flex>
							<Flex vertical gap={10}>
								<Typography.Title level={5}>{__('Shipping Address', 'quillcrm')}</Typography.Title>
								<Flex vertical gap={10}>
									{shippingFields.map((field) => (
										<Flex justify='space-between'>
											<Typography.Text>{getCart(cartId).fields[field]}</Typography.Text>
										</Flex>
									))}
								</Flex>
							</Flex>
						</Flex>
						<Table
							dataSource={map(getCart(cartId).items, (product) => ({
								...product,
							}))}
							rowKey="id"
							pagination={false}
						>
							<Column
								title={__('Image', 'quillcrm')}
								key="image"
								render={(_, record: CartItem) => <div className='qcrm-abandoned-cart-image' dangerouslySetInnerHTML={{ __html: record.product.image }} />}
							/>
							<Column
								title={__('Product', 'quillcrm')}
								dataIndex="name"
								key="name"
								render={(_, record: CartItem) => record.product.name}
							/>
							<Column
								title={__('Quantity', 'quillcrm')}
								key="quantity"
								render={(_, record: CartItem) => record.quantity}
							/>
							<Column
								title={__('Price', 'quillcrm')}
								key="price"
								render={(_, record: CartItem) => record.product.price}
							/>
						</Table>
					</Flex>
				)}
			</Modal>
		</div>
	);
};

export default AbandonedCartsList;
