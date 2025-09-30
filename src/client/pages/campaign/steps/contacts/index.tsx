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
import {
	Filters,
	PanelLayout,
	PanelSettings,
	TeamIcon,
} from '@quillcrm/components';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { ListTagFilter } from '@quillcrm/components';

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
	const [filterBy, setFilterBy] = useState('list-tags');
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

	const fetchList = async () => {
		const response = await apiFetch({
			path: '/qc/v1/lists',
		});
		console.log(response);
	};
	useEffect(() => {
		fetchContacts();
		fetchList();
	}, []);

	const save = async () => {
		if (!campaign) {
			return;
		}

		// Validate that campaign has templates
		const templates = campaign.settings?.templates;
		if (!templates || templates.length === 0) {
			createNotice({
				type: 'error',
				message: __(
					'Please create a template before proceeding',
					'quillcrm'
				),
			});
			navigate(getToLink(`campaigns/${campaign.id}/template`));
			return;
		}

		const template = templates[0];

		if (!template.body || template.body.trim().length === 0) {
			createNotice({
				type: 'error',
				message: __(
					campaign.type === 'email'
						? 'Email body is required'
						: 'Message content is required',
					'quillcrm'
				),
			});
			navigate(getToLink(`campaigns/${campaign.id}/template`));
			return;
		}

		// Email-specific validation
		if (campaign.type === 'email') {
			if (!template.subject) {
				createNotice({
					type: 'error',
					message: __('Email subject is required', 'quillcrm'),
				});
				navigate(getToLink(`campaigns/${campaign.id}/template`));
				return;
			}

			if (!template.settings?.from_name) {
				createNotice({
					type: 'error',
					message: __('From Name is required', 'quillcrm'),
				});
				navigate(getToLink(`campaigns/${campaign.id}/template`));
				return;
			}

			if (!template.settings?.from_email) {
				createNotice({
					type: 'error',
					message: __('From Email is required', 'quillcrm'),
				});
				navigate(getToLink(`campaigns/${campaign.id}/template`));
				return;
			}
		}

		// SMS/WhatsApp validation: max length check
		if (campaign.type === 'sms' || campaign.type === 'whatsapp') {
			if (template.body.length > 1600) {
				createNotice({
					type: 'error',
					message: __(
						'Message is too long. Maximum 1600 characters.',
						'quillcrm'
					),
				});
				navigate(getToLink(`campaigns/${campaign.id}/template`));
				return;
			}
		}

		await saveCampaign();
		navigate(getToLink(`campaigns/${campaign.id}/review`));
	};

	return (
		<PanelLayout
			items={[]}
			totalSteps={1}
			currentStep={0}
			onNext={save}
			onBack={() => navigate(getToLink(`campaigns`))}
		>
			{campaign && (
				<>
					<div className="flex gap-6">
						<PanelSettings
							title={__('Recipients', 'quillcrm')}
							description={__(
								'Lorem ipsum contains the typefaces more in use, an aspect that allows you to have an overview.',
								'quillcrm'
							)}
							icon={<TeamIcon />}
							className="w-1/2"
						>
							<div className="space-y-6">
								<div>
									<p className="text-base font-bold mb-2">
										{__('Filter By', 'quillcrm')}
									</p>
									<RadioGroup
										value={filterBy}
										onValueChange={setFilterBy}
										className="flex gap-4"
									>
										<div className="flex items-center space-x-4 w-1/2 border border-gray-600 rounded-lg py-2 px-3 cursor-pointer">
											<RadioGroupItem
												value="list-tags"
												id="list-tags"
											/>
											<Label htmlFor="list-tags">
												{__(
													'List and Tags',
													'quillcrm'
												)}
											</Label>
										</div>
										<div className="flex items-center space-x-4 w-1/2">
											<RadioGroupItem
												value="advanced"
												id="advanced"
											/>
											<Label htmlFor="advanced">
												{__(
													'Advanced Filter',
													'quillcrm'
												)}
											</Label>
										</div>
									</RadioGroup>
								</div>
								{filterBy === 'list-tags' && <ListTagFilter />}
								{filterBy === 'advanced' && (
									<Filters
										filters={filters}
										onChange={setFilters}
										onApply={fetchContacts}
										isApplying={loading}
									/>
								)}
							</div>
						</PanelSettings>
					</div>

					{/* <Flex
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
					</div> */}
				</>
			)}
		</PanelLayout>
	);
};

export default Contacts;
