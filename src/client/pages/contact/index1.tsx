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
import { useReducer, useRef } from 'react';
import { useNavigate, useParams, getToLink } from '@quillcrm/navigation';
import {
	Tabs,
	Button,
	Card,
	Typography,
	Modal,
	Avatar,
	Tag as AntTag,
	Popconfirm,
	Flex,
} from 'antd';
import {
	UserOutlined,
	PlusSquareFilled,
} from '@ant-design/icons';
import { isEmpty } from 'lodash';
import AsyncSelect from 'react-select/async';

/**
 * Internal dependencies
 */
import './style.scss';
import {
	Contact as ContactType,
	Tag,
	List as ContactList,
	ListsResponse,
	TagsResponse,
} from '@quillcrm/client';
import NotesTab from './notes';
import ProfileTab from './profile';
import Automation from './automation';
import Emails from './emails';
import SMS from './sms';
import WhatsApp from './whatsapp';
import PurchaseHistory from './purchase-history';
import Courses from './courses';
import { Provider } from './state/context';
import reducer, { State } from './state/reducer';
import actions from './state/actions';
import ConfigAPI from '@quillcrm/config';

const Contact: React.FC = () => {
	const { id, tab } = useParams<{ id: string; tab: string }>();
	const navigate = useNavigate();
	const [loading, setLoading] = useState(true);
	const [isUpdating, setIsUpdating] = useState(false);
	const [lists, setLists] = useState<ContactList[]>([]);
	const [tags, setTags] = useState<Tag[]>([]);
	const [showAddTag, setShowAddTag] = useState(false);
	const [showAddList, setShowAddList] = useState(false);
	const [selectedLists, setSelectedLists] = useState<number[]>([]);
	const [selectedTags, setSelectedTags] = useState<number[]>([]);
	const [isSavingTags, setIsSavingTags] = useState(false);
	const [isSavingLists, setIsSavingLists] = useState(false);
	const [state, dispatch] = useReducer(reducer, {
		contact: null,
		notes: [],
		automationContacts: [],
		emailAnalytics: null,
		purchaseHistory: null,
		courses: [],
	} as State);
	const stateRef = useRef<State>(state);
	stateRef.current = state;
	const $actions = actions(dispatch);
	const { setContact } = $actions;
	const { contact } = state;
	const isEddActive = ConfigAPI.isEddActive();
	const isWooActive = ConfigAPI.isWoocommerceActive();
	const lmsActive = ConfigAPI.isLmsActive();
	const { createNotice } = useDispatch('quillcrm/core');

	const fetchLists = async (keyword = '') => {
		try {
			const response = (await apiFetch({
				path: addQueryArgs('/qc/v1/lists', {
					keyword: keyword,
					contact_id: id,
				}),
			})) as ListsResponse;

			setLists([...lists, ...response.data]);

			return response.data.map((list) => ({
				label: list.name,
				value: list.id,
			}));
		} catch (error: any) {
			createNotice({
				type: 'error',
				message: error.message,
			});

			return [];
		}
	};

	const fetchTags = async (keyword = '') => {
		try {
			const response = (await apiFetch({
				path: addQueryArgs('/qc/v1/tags', {
					keyword: keyword,
					contact_id: id,
				}),
			})) as TagsResponse;

			setTags([...tags, ...response.data]);

			return response.data.map((tag) => ({
				label: tag.name,
				value: tag.id,
			}));
		} catch (error: any) {
			createNotice({
				type: 'error',
				message: error.message,
			});
			return [];
		}
	};

	const deleteList = async (listId: number) => {
		if (!contact) {
			return;
		}

		try {
			await apiFetch({
				path: `/qc/v1/contacts/${contact.id}`,
				method: 'POST',
				data: {
					lists: contact.lists.filter((list) => list.id !== listId),
				},
			});

			setContact({
				...contact,
				lists: contact.lists.filter((list) => list.id !== listId),
			});
		} catch (error: any) {
			createNotice({
				type: 'error',
				message: error.message,
			});
		}
	};

	const addLists = async () => {
		if (!contact || isEmpty(selectedLists)) {
			return;
		}

		// Check if the selected lists are already added to the contact
		if (
			selectedLists.every((list) =>
				contact.lists.some((l) => l.id === list)
			)
		) {
			return;
		}

		const newLists = lists.filter((list) =>
			selectedLists.includes(list.id)
		);
		if (isEmpty(newLists)) {
			return;
		}

		setIsSavingLists(true);
		try {
			await apiFetch({
				path: `/qc/v1/contacts/${contact.id}`,
				method: 'POST',
				data: {
					lists: [...contact.lists, ...newLists].filter(
						(list, index, self) =>
							index === self.findIndex((t) => t.id === list.id)
					),
				},
			});

			setContact({
				...contact,
				lists: [...contact.lists, ...newLists].filter(
					(list, index, self) =>
						index === self.findIndex((t) => t.id === list.id)
				),
			});
		} catch (error: any) {
			createNotice({
				type: 'error',
				message: error.message,
			});
		} finally {
			setIsSavingLists(false);
			setShowAddList(false);
			setSelectedLists([]);
		}
	};

	const deleteTag = async (tagId: number) => {
		if (!contact) {
			return;
		}

		try {
			await apiFetch({
				path: `/qc/v1/contacts/${contact.id}`,
				method: 'POST',
				data: {
					tags: contact.tags.filter((tag) => tag.id !== tagId),
				},
			});

			setContact({
				...contact,
				tags: contact.tags.filter((tag) => tag.id !== tagId),
			});
		} catch (error: any) {
			createNotice({
				type: 'error',
				message: error.message,
			});
		}
	};

	const addTags = async () => {
		if (!contact) {
			return;
		}

		const newTags = tags.filter((tag) => selectedTags.includes(tag.id));
		if (isEmpty(newTags)) {
			return;
		}

		setIsSavingTags(true);

		try {
			await apiFetch({
				path: `/qc/v1/contacts/${contact.id}`,
				method: 'POST',
				data: {
					tags: [...contact.tags, ...newTags],
				},
			});

			setContact({
				...contact,
				tags: [...contact.tags, ...newTags],
			});
		} catch (error: any) {
			createNotice({
				type: 'error',
				message: error.message,
			});
		} finally {
			setIsSavingTags(false);
			setShowAddTag(false);
			setSelectedTags([]);
		}
	};

	const fetchContact = async () => {
		setLoading(true);
		try {
			const response = await apiFetch({
				path: `/qc/v1/contacts/${id}`,
				method: 'GET',
			});

			setContact(response as ContactType);
		} catch (error: any) {
			createNotice({
				type: 'error',
				message: error.message,
			});
		} finally {
			setLoading(false);
		}
	};

	const updateContact = async () => {
		if (!contact) {
			return;
		}

		setIsUpdating(true);
		try {
			// Prepare the data with properly formatted custom fields
			const contactData = {
				...contact,
				custom_fields:
					contact.custom_fields?.map((customField) => ({
						id: customField.id,
						value: customField.pivot?.value || '', // Send only id and value
					})) || [],
			};

			const response = await apiFetch({
				path: `/qc/v1/contacts/${id}`,
				method: 'POST',
				data: contactData,
			});

			setContact(response as ContactType);
			createNotice({
				type: 'success',
				message: __('Contact updated successfully', 'quillcrm'),
			});
		} catch (error: any) {
			console.error('Update contact error:', error);
			createNotice({
				type: 'error',
				message: error.message,
			});
		} finally {
			setIsUpdating(false);
		}
	};

	const sendOptInEmail = async () => {
		if (!contact) {
			return;
		}

		createNotice({
			type: 'info',
			message: __('Sending opt-in email', 'quillcrm'),
		});

		try {
			const response = await apiFetch({
				path: `/qc/v1/contacts/${contact.id}/send-opt-in`,
				method: 'POST',
			});
			console.log(response);

			createNotice({
				type: 'success',
				message: __('Opt-in email sent successfully', 'quillcrm'),
			});
		} catch (error: any) {
			createNotice({
				type: 'error',
				message: error.message,
			});
		}
	};

	useEffect(() => {
		fetchContact();
	}, [id]);

	// Switch to the new tab items
	const tabItems = [
		{
			key: 'profile',
			label: __('Profile', 'quillcrm'),
			children: <ProfileTab />,
		},
		{
			key: 'emails',
			label: __('Emails', 'quillcrm'),
			children: contact && <Emails contact_id={contact.id} />,
		},
		{
			key: 'sms',
			label: __('SMS', 'quillcrm'),
			children: contact && <SMS contact_id={contact.id} />,
		},
		{
			key: 'whatsapp',
			label: __('WhatsApp', 'quillcrm'),
			children: contact && <WhatsApp contact_id={contact.id} />,
		},
		{
			key: 'notes',
			label: __('Notes', 'quillcrm'),
			children: contact && <NotesTab contact_id={contact.id} />,
		},
		{
			key: 'automation',
			label: __('Automation', 'quillcrm'),
			children: contact && <Automation contact_id={contact.id} />,
		},
	];

	if (isWooActive || isEddActive) {
		tabItems.push({
			key: 'purchase-history',
			label: __('Purchase History', 'quillcrm'),
			children: contact && <PurchaseHistory contact_id={contact.id} />,
		});
	}

	if (lmsActive) {
		tabItems.push({
			key: 'courses',
			label: __('Courses', 'quillcrm'),
			children: contact && <Courses contact_id={contact.id} />,
		});
	}

	return (
		<Provider
			value={{
				...state,
				...$actions,
				updateContact,
				isUpdating,
				isLoading: loading,
			}}
		>
			<div className="qcrm-contact">
				<Card
					loading={loading}
					className="qcrm-contact-overview-card"
					style={{ width: '100%' }}
				>
					{contact && (
						<div className="qcrm-contact-overview">
							<div className="qcrm-contact-overview-avatar">
								<div className="qcrm-contact-overview-avatar">
									<Avatar
										size={64}
										icon={<UserOutlined />}
										style={{
											backgroundColor: '#0073aa',
											color: '#fff',
										}}
									/>
								</div>
								<div className="qcrm-contact-overview-details">
									<Typography.Title level={4}>
										{contact.first_name || '-'}{' '}
										{contact.last_name || '-'}
									</Typography.Title>
									<Flex vertical gap={10}>
										<Typography.Text>
											{contact.email}
										</Typography.Text>
										{contact.status === 'unverified' && (
											<Popconfirm
												title={__(
													'Are you sure you want to send an opt-in email?',
													'quillcrm'
												)}
												onConfirm={sendOptInEmail}
											>
												<Button size="small">
													{__(
														'Send Opt-in Email',
														'quillcrm'
													)}
												</Button>
											</Popconfirm>
										)}
									</Flex>
								</div>
							</div>
							<div className="qcrm-contact-overview-lists-tags">
								<div className="qcrm-contact-overview-lists">
									<Typography.Title level={5}>
										{__('Lists', 'quillcrm')}
										{':'}
									</Typography.Title>
									{!isEmpty(contact.lists) ? (
										<div>
											{contact.lists.map((list) => (
												<AntTag
													key={list.id}
													closeIcon
													onClose={() =>
														deleteList(list.id)
													}
												>
													{list.name}
												</AntTag>
											))}
										</div>
									) : (
										<Typography.Text>
											{__('No lists found.', 'quillcrm')}
										</Typography.Text>
									)}
									<Button
										onClick={() => {
											setShowAddList(true);
											fetchLists();
										}}
										type="link"
										icon={<PlusSquareFilled />}
										size="small"
									>
										{__('Add List', 'quillcrm')}
									</Button>
								</div>
								<div className="qcrm-contact-overview-tags">
									<Typography.Title level={5}>
										{__('Tags', 'quillcrm')}
										{':'}
									</Typography.Title>
									{!isEmpty(contact.tags) ? (
										<div>
											{contact.tags.map((tag) => (
												<AntTag
													key={tag.id}
													closeIcon
													onClose={() =>
														deleteTag(tag.id)
													}
												>
													{tag.name}
												</AntTag>
											))}
										</div>
									) : (
										<Typography.Text>
											{__('No tags found.', 'quillcrm')}
										</Typography.Text>
									)}
									<Button
										onClick={() => {
											setShowAddTag(true);
											fetchTags();
										}}
										type="link"
										icon={<PlusSquareFilled />}
										size="small"
									>
										{__('Add Tag', 'quillcrm')}
									</Button>
								</div>
							</div>
						</div>
					)}
				</Card>
				<Tabs
					defaultActiveKey="profile"
					activeKey={tab}
					tabPosition="left"
					tabBarStyle={{ width: 200 }}
					items={tabItems}
					onChange={(key) => {
						navigate(getToLink(`contacts/${id}/${key}`));
					}}
				/>
				<Modal
					title={__('Add Tag', 'quillcrm')}
					open={showAddTag}
					onOk={() => addTags()}
					onCancel={() => setShowAddTag(false)}
					confirmLoading={isSavingTags}
				>
					<div className="qcrm-fields">
						<div className="qcrm-field">
							<AsyncSelect
								className="react-select-container"
								classNamePrefix="react-select"
								isMulti
								value={selectedTags.map((tag) => ({
									label: tags.find((t) => t.id === tag)?.name,
									value: tag,
								}))}
								onChange={(value) => {
									if (!value || !Array.isArray(value)) {
										return;
									}

									const selected = value.map(
										(val) => val.value
									);

									setSelectedTags(selected);
								}}
								defaultOptions
								loadOptions={(inputValue, callback) => {
									fetchTags(inputValue).then((data) => {
										callback(data);
									});
								}}
								isClearable
								cacheOptions={false}
							/>
						</div>
					</div>
				</Modal>
				<Modal
					title={__('Add Lists', 'quillcrm')}
					open={showAddList}
					onOk={() => addLists()}
					onCancel={() => setShowAddList(false)}
					confirmLoading={isSavingLists}
				>
					<div className="qcrm-fields">
						<div className="qcrm-field">
							<AsyncSelect
								isMulti
								value={selectedLists.map((list) => ({
									label: lists.find((t) => t.id === list)
										?.name,
									value: list,
								}))}
								onChange={(value) => {
									if (!Array.isArray(value)) {
										return;
									}

									const selected = value.map(
										(val) => val.value
									);

									setSelectedLists(selected);
								}}
								defaultOptions
								loadOptions={(inputValue, callback) => {
									fetchLists(inputValue).then((data) => {
										callback(data);
									});
								}}
								isClearable
								cacheOptions={false}
							/>
						</div>
					</div>
				</Modal>
			</div>
		</Provider>
	);
};

export default Contact;
