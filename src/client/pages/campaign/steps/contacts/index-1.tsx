/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useState, useEffect } from '@wordpress/element';
import apiFetch from '@wordpress/api-fetch';
import { addQueryArgs } from '@wordpress/url';
import { useDispatch } from '@wordpress/data';

/**
 * External dependencies
 */
import { Button, Card, Badge, Flex, Typography, Spin } from 'antd';

/**
 * Internal dependencies
 */
import './style.scss';
import { useNavigate, getToLink } from '@quillcrm/navigation';
import { useCampaignContext } from '../../state/context';
import type { Filter as FilterType, ContactsResponse } from '@quillcrm/client';
import { Filters } from '@quillcrm/components';

const Contacts: React.FC = () => {
	const { campaign, isLoading, saveCampaign, isSaving, updateSettings } =
		useCampaignContext();
	const navigate = useNavigate();
	const filters = campaign?.settings.filters || [];
	const setFilters = (newFilters: FilterType[]) => {
		updateSettings('filters', newFilters);
	};

	const [loading, setLoading] = useState(true);
	const [total, setTotal] = useState(0);
	const { createNotice } = useDispatch('quillcrm/core');

	const fetchContacts = async () => {
		setLoading(true);
		try {
			const response = (await apiFetch({
				path: addQueryArgs('/qc/v1/contacts', {
					per_page: 1,
					page: 1,
					filters: filters,
					subscribed: true,
				}),
				method: 'GET',
				parse: true,
			})) as ContactsResponse;

			setTotal(response.total);
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
	}, []);

	const save = async () => {
		if (!campaign) {
			return;
		}
		await saveCampaign();
		navigate(getToLink(`campaigns/${campaign.id}/review`));
	};

	return (
		<Card loading={isLoading}>
			{campaign && (
				<>
					<Flex
						justify="space-between"
						align="center"
						style={{ marginBottom: 20 }}
					>
						<Flex vertical gap={10}>
							<Typography.Title level={4}>
								{__('Recipient Selection', 'quillcrm')}
							</Typography.Title>
							<Typography.Text>
								{__(
									'Select the contacts to send the campaign to',
									'quillcrm'
								)}
							</Typography.Text>
						</Flex>
						<div className="qcrm-contacts">
							<div className="qcrm-contacts-total">
								{__(
									'Total Contacts based on filters',
									'quillcrm'
								)}
								:{' '}
								{!loading && (
									<Badge
										count={total}
										style={{
											backgroundColor: '#52c41a',
											color: '#fff',
											marginLeft: '10px',
										}}
										showZero
									/>
								)}
								{loading && <Spin />}
							</div>
						</div>
					</Flex>
					<Filters
						filters={filters}
						onChange={setFilters}
						onApply={fetchContacts}
						isApplying={loading}
					/>
					<div className="qcrm-actions">
						<Button
							onClick={() =>
								navigate(
									getToLink(
										`campaigns/${campaign.id}/template`
									)
								)
							}
						>
							{__('Back', 'quillcrm')}
						</Button>
						<Button
							type="primary"
							onClick={() => save()}
							loading={isSaving}
						>
							{__('Next', 'quillcrm')}
						</Button>
					</div>
				</>
			)}
		</Card>
	);
};

export default Contacts;
