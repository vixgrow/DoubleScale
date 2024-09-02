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
import { Button, Card, List, Popover, Badge } from 'antd';
import {
	RightOutlined,
	LeftOutlined,
	PlusCircleOutlined,
} from '@ant-design/icons';
import { map } from 'lodash';

/**
 * Internal dependencies
 */
import './style.scss';
import { useNavigate, getToLink } from '@quillcrm/navigation';
import { useCampaignContext } from '../../state/context';
import type { Filter as FilterType } from '../../../types';
import Filter from './filter';
import ConfigAPI from '@quillcrm/config';

const Contacts: React.FC = () => {
	const { campaign, isLoading, saveCampaign, isSaving, updateSettings } =
		useCampaignContext();
	const navigate = useNavigate();
	const filtersGroups = ConfigAPI.getFiltersGroups();
	const [selectedGroup, setSelectedGroup] = useState<string>('');
	const filters = campaign?.settings.filters || [];
	const setFilters = (newFilters: FilterType[]) => {
		updateSettings('filters', newFilters);
	};

	const [isModalVisible, setIsModalVisible] = useState(false);
	const getFilterBySlug = (slug: string, group: string) => {
		return filtersGroups[group]['filters'][slug];
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
				}),
				method: 'GET',
				parse: true,
			})) as any;

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
					<div className="qcrm-filters">
						<Card title={__('Filters', 'quillcrm')}>
							{map(filters, (filter: FilterType, index) => {
								const filterSettings = getFilterBySlug(
									filter.filter,
									filter.group
								);
								return (
									<Filter
										key={index}
										filterSettings={filterSettings}
										filter={filter}
										onChange={(key, value) => {
											const newFilters = [...filters];
											newFilters[index] = {
												...newFilters[index],
												[key]: value,
											};
											setFilters(newFilters);
										}}
										onRemove={() => {
											const newFilters = [...filters];
											newFilters.splice(index, 1);
											setFilters(newFilters);
										}}
									/>
								);
							})}
							<div className="qcrm-filter-actions">
								<Popover
									className="qcrm-filter-popover"
									title={__('Select Group', 'quillcrm')}
									trigger="click"
									open={isModalVisible}
									onOpenChange={(visible) =>
										setIsModalVisible(visible)
									}
									content={
										<>
											{!selectedGroup && (
												<List
													className="qcrm-filter-groups"
													itemLayout="horizontal"
													dataSource={map(
														filtersGroups,
														(group, key) => {
															return {
																key,
																group,
															};
														}
													)}
													renderItem={(item: any) => (
														<List.Item
															style={{
																cursor: 'pointer',
																padding:
																	'5px 0',
															}}
														>
															<div
																className="qcrm-filter-item"
																onClick={() =>
																	setSelectedGroup(
																		item.key
																	)
																}
															>
																{
																	item.group
																		.name
																}
																<RightOutlined />
															</div>
														</List.Item>
													)}
												/>
											)}
											{selectedGroup && (
												<>
													<div
														className="qcrm-filter-back"
														onClick={() =>
															setSelectedGroup('')
														}
														style={{
															cursor: 'pointer',
															padding: '5px 0',
															borderBottom:
																'1px solid #f0f0f0',
														}}
													>
														<LeftOutlined
															size={10}
														/>
														{__('Back', 'quillcrm')}
													</div>
													<List
														className="qcrm-filter-groups"
														itemLayout="horizontal"
														dataSource={map(
															filtersGroups[
																selectedGroup
															].filters,
															(filter, key) => {
																return {
																	key,
																	filter,
																};
															}
														)}
														renderItem={(
															item: any
														) => (
															<List.Item
																style={{
																	cursor: 'pointer',
																	padding:
																		'5px 0',
																}}
															>
																<div
																	className="qcrm-filter-item"
																	onClick={() => {
																		const newFilters =
																			[
																				...filters,
																			];
																		newFilters.push(
																			{
																				group: selectedGroup,
																				filter: item.key,
																				operator:
																					'is',
																				value: '',
																			}
																		);
																		setFilters(
																			newFilters
																		);
																		setIsModalVisible(
																			false
																		);
																	}}
																>
																	{
																		item
																			.filter
																			.name
																	}
																</div>
															</List.Item>
														)}
													/>
												</>
											)}
										</>
									}
								>
									<Button
										type="text"
										onClick={() => setIsModalVisible(true)}
										icon={<PlusCircleOutlined />}
									/>
								</Popover>
								<Button
									type="primary"
									onClick={() => fetchContacts()}
									disabled={isSaving}
								>
									{__('Apply Filters', 'quillcrm')}
								</Button>
							</div>
						</Card>
					</div>
					<div className="qcrm-contacts">
						{!loading && (
							<div className="qcrm-contacts-total">
								{__(
									'Total Contacts based on filters',
									'quillcrm'
								)}
								:{' '}
								<Badge
									count={total}
									style={{
										backgroundColor: '#52c41a',
										color: '#fff',
										marginLeft: '10px',
									}}
								/>
							</div>
						)}
					</div>
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
