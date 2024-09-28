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
import { Card, Typography, List, Flex } from 'antd';
import { isEmpty } from 'lodash';

/**
 * Internal dependencies
 */
import './style.scss';
import {
	AutomationContact,
	AutomationContactsResponse,
} from '@quillcrm/client';
import { useContactContext } from '../state/context';

interface AutomationProps {
	contact_id: number;
}

const Automation: React.FC<AutomationProps> = ({ contact_id }) => {
	const { automationContacts, setAutomationContacts } = useContactContext();
	const [loading, setLoading] = useState<boolean>(true);
	const [perPage, setPerPage] = useState<number>(10);
	const [page, setPage] = useState<number>(1);
	const [total, setTotal] = useState<number>(0);
	const { createNotice } = useDispatch('quillcrm/core');

	const fetchAutomationContacts = async () => {
		setLoading(true);

		try {
			const response = (await apiFetch({
				path: addQueryArgs(
					`/qc/v1/contacts/${contact_id}/automation-contacts`,
					{
						per_page: perPage,
						page,
					}
				),
			})) as AutomationContactsResponse;

			setAutomationContacts(response.data);
			setTotal(response.total);
		} catch (error) {
			createNotice({
				type: 'error',
				message: __('Failed to fetch automation', 'quillcrm'),
			});
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchAutomationContacts();
	}, [page, perPage]);

	return (
		<>
			<Card className="qcrm-contact-notes" loading={loading}>
				<Flex
					justify="space-between"
					align="center"
					style={{ marginBottom: 20 }}
				>
					<Typography.Title level={4} style={{ margin: 0 }}>
						{__('Automation', 'quillcrm')}
					</Typography.Title>
				</Flex>
				{isEmpty(automationContacts) ? (
					<p>{__('No notes found.', 'quillcrm')}</p>
				) : (
					<List
						itemLayout="horizontal"
						dataSource={automationContacts}
						pagination={{
							current: page,
							pageSize: perPage,
							total,
							onChange: (page, perPage) => {
								setPage(page);
								setPerPage(perPage);
							},
							position: 'bottom',
							align: 'center',
						}}
						renderItem={(item: AutomationContact) => (
							<List.Item>
								<List.Item.Meta title={item.automation.name} />
							</List.Item>
						)}
					/>
				)}
			</Card>
		</>
	);
};

export default Automation;
