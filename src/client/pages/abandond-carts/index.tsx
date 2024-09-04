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
import { Table } from 'antd';

/**
 * Internal dependencies
 */
import './style.scss';
import type { AbandonedCart } from '@quillcrm/client';

const { Column } = Table;

const AbandonedCartsList: React.FC = () => {
	const [loading, setLoading] = useState(true);
	const [page, setPage] = useState(1);
	const [perPage, setPerPage] = useState(10);
	const [total, setTotal] = useState(0);
	const [data, setData] = useState<AbandonedCart[]>([]);
	const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
	const { createNotice } = useDispatch('quillcrm/core');

	const fetchAbandonedCarts = async () => {
		setLoading(true);
		try {
			const response = (await apiFetch({
				path: addQueryArgs('/qc/v1/abandoned-carts', {
					page,
					per_page: perPage,
				}),
				method: 'GET',
			})) as any;

			response.total && setTotal(response.total);
			response.data && setData(response.data as AbandonedCart[]);
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

	return (
		<div className="qcrm-carts-list">
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
				/>
				<Column
					title={__('Updated At', 'quillcrm')}
					dataIndex="updated_at"
					key="updated_at"
				/>
			</Table>
		</div>
	);
};

export default AbandonedCartsList;
