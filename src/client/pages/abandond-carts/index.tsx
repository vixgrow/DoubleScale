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
import { Table, Flex, Select, Button, Badge } from 'antd';

/**
 * Internal dependencies
 */
import './style.scss';
import type { AbandonedCart, AbandonedCartsResponse } from '@quillcrm/client';
import { convertDate } from '@quillcrm/utils';

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
		</div>
	);
};

export default AbandonedCartsList;
