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
import { Table, Tag, Modal, Button } from 'antd';

/**
 * Internal dependencies
 */
import './style.scss';
import type {
	AutomationContact,
	AutomationContactsResponse,
} from '@quillcrm/client';
import { NavLink } from '@quillcrm/navigation';
import { useParams } from '@quillcrm/navigation';
import Result from '../workflow/result';
import { convertDate } from '@quillcrm/utils';

const { Column } = Table;

const ContactsList: React.FC = () => {
	const { id } = useParams<{ id: string; tab: string }>();
	const [loading, setLoading] = useState(true);
	const [page, setPage] = useState(1);
	const [perPage, setPerPage] = useState(10);
	const [total, setTotal] = useState(0);
	const [data, setData] = useState<AutomationContact[]>([]);
	const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
	const [contact, setContact] = useState<AutomationContact | null>(null);
	const { createNotice } = useDispatch('quillcrm/core');

	const fetchContacts = async () => {
		setLoading(true);
		try {
			const response = (await apiFetch({
				path: addQueryArgs(`/qc/v1/automations/${id}/contacts`, {
					page,
					per_page: perPage,
				}),
				method: 'GET',
			})) as AutomationContactsResponse;

			response.total && setTotal(response.total);
			response.data && setData(response.data);
		} catch (error) {
			createNotice({
				type: 'error',
				message: __('Failed to fetch contacts', 'quillcrm'),
			});
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchContacts();
	}, [page, perPage]);

	return (
		<div className="qcrm-contacts-list">
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
					title={__('Contact', 'quillcrm')}
					dataIndex="contact"
					key="contact"
					render={(_, record: AutomationContact) => (
						<NavLink to={`contacts/${record.contact.id}`}>
							{record.contact.email}
						</NavLink>
					)}
				/>
				<Column
					title={__('Started At', 'quillcrm')}
					dataIndex="created_at"
					key="created_at"
					render={(date) => convertDate(date)}
				/>
				<Column
					title={__('Last Run', 'quillcrm')}
					dataIndex="updated_at"
					key="updated_at"
					render={(date) => convertDate(date)}
				/>
				<Column
					title={__('Status', 'quillcrm')}
					dataIndex="status"
					key="status"
					render={(status) => (
						<Tag
							color={
								status === 'completed'
									? 'green'
									: status === 'failed'
										? 'red'
										: 'blue'
							}
						>
							{status}
						</Tag>
					)}
				/>
				<Column
					title={__('Actions', 'quillcrm')}
					key="actions"
					render={(_, record: AutomationContact) => (
						<Button type='link' onClick={() => setContact(record)}>
							{__('View Journey', 'quillcrm')}
						</Button>
					)}
				/>
			</Table>
			<Modal
				open={contact !== null}
				onCancel={() => setContact(null)}
				footer={null}
				width={800}
			>
				<Result contact={contact} />
			</Modal>
		</div>
	);
};

export default ContactsList;
