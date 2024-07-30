/**
 * WordPress dependencies
 */
import { useState, useEffect } from '@wordpress/element';
import apiFetch from '@wordpress/api-fetch';
import { addQueryArgs } from '@wordpress/url';
import { __ } from '@wordpress/i18n';

/**
 * External dependencies
 */
import { Table, Tag as AntTag } from 'antd';

/**
 * Internal dependencies
 */
import './style.scss';
import type { Contact, Tag, List } from '../types';
import { NavLink } from '@quillcrm/navigation';

const { Column } = Table;

const ContactsList: React.FC = () => {
	const [loading, setLoading] = useState(true);
	const [page, setPage] = useState(1);
	const [perPage, setPerPage] = useState(10);
	const [total, setTotal] = useState(0);
	const [data, setData] = useState<Contact[]>([]);
	const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);

	const fetchContacts = async () => {
		setLoading(true);
		try {
			const response = (await apiFetch({
				path: addQueryArgs('/qc/v1/contacts', {
					page,
					per_page: perPage,
				}),
				method: 'GET',
			})) as any;

			response.total && setTotal(response.total);
			response.data && setData(response.data as Contact[]);
		} catch (error) {
			console.error(error);
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
					title={__('Email', 'quillcrm')}
					dataIndex="email"
					key="email"
					sorter={(a: Contact, b: Contact) =>
						a.email.localeCompare(b.email)
					}
					render={(_, record: Contact) => (
						<NavLink to={`contacts/${record.id}`}>
							{record.email}
						</NavLink>
					)}
				/>
				<Column
					title={__('First Name', 'quillcrm')}
					dataIndex="first_name"
					key="first_name"
					sorter={(a: Contact, b: Contact) =>
						a.first_name
							? a.first_name.localeCompare(b.first_name)
							: 0
					}
				/>
				<Column
					title={__('Last Name', 'quillcrm')}
					dataIndex="last_name"
					key="last_name"
					sorter={(a: Contact, b: Contact) =>
						a.last_name ? a.last_name.localeCompare(b.last_name) : 0
					}
				/>
				<Column
					title="Tag"
					dataIndex="tags"
					key="tags"
					render={(tags: Tag[]) =>
						tags.map((tag) => (
							<AntTag key={tag.id}>{tag.name}</AntTag>
						))
					}
				/>
				<Column
					title="List"
					dataIndex="lists"
					key="lists"
					render={(lists: List[]) =>
						lists.map((list) => (
							<AntTag key={list.id}>{list.name}</AntTag>
						))
					}
				/>
				<Column
					title={__('Status', 'quillcrm')}
					dataIndex="status"
					key="status"
					sorter={(a: Contact, b: Contact) =>
						a.status.localeCompare(b.status)
					}
				/>
			</Table>
		</div>
	);
};

export default ContactsList;
