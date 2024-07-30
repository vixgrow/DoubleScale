/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import apiFetch from '@wordpress/api-fetch';
import { useEffect, useState } from '@wordpress/element';
import { addQueryArgs } from '@wordpress/url';

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
	Select,
	Avatar,
	Tag as AntTag,
	Popover,
} from 'antd';
import {
	UserOutlined,
	PlusSquareFilled,
	ArrowDownOutlined,
} from '@ant-design/icons';
import { isEmpty } from 'lodash';

/**
 * Internal dependencies
 */
import './style.scss';
import { Contact as ContactType, Tag, List as ContactList } from '../types';
import NotesTab from './notes';
import ProfileTab from './profile';
import Automation from './automation';
import { Provider } from './state/context';
import reducer, { State } from './state/reducer';
import actions from './state/actions';

const Contact: React.FC = () => {
	const { id, tab } = useParams<{ id: string; tab: string }>();
	const navigate = useNavigate();
	const [loading, setLoading] = useState(true);
	const [isUpdating, setIsUpdating] = useState(false);
	const [lists, setLists] = useState<ContactList[]>([]);
	const [tags, setTags] = useState<Tag[]>([]);
	const [fetchingTags, setFetchingTags] = useState(false);
	const [fetchingLists, setFetchingLists] = useState(false);
	const [showAddTag, setShowAddTag] = useState(false);
	const [showAddList, setShowAddList] = useState(false);
	const [selectedLists, setSelectedLists] = useState<ContactList[]>([]);
	const [selectedTags, setSelectedTags] = useState<Tag[]>([]);
	const [isSavingTags, setIsSavingTags] = useState(false);
	const [isSavingLists, setIsSavingLists] = useState(false);
	const [state, dispatch] = useReducer(reducer, {
		contact: null,
		notes: [],
		automationContacts: [],
	} as State);
	const stateRef = useRef<State>(state);
	stateRef.current = state;
	const $actions = actions(dispatch);
	const { setContact } = $actions;
	const { contact } = state;

	const fetchLists = async (keyword = '') => {
		setFetchingLists(true);
		try {
			const response = (await apiFetch({
				path: addQueryArgs('/qc/v1/lists', {
					keyword: keyword,
				}),
			})) as any;

			setLists(response.data as ContactList[]);
		} catch (error) {
			console.error(error);
		} finally {
			setFetchingLists(false);
		}
	};

	const fetchTags = async (keyword = '') => {
		setFetchingTags(true);
		try {
			const response = (await apiFetch({
				path: addQueryArgs('/qc/v1/tags', {
					keyword: keyword,
				}),
			})) as any;

			setTags(response.data as Tag[]);
		} catch (error) {
			console.error(error);
		} finally {
			setFetchingTags(false);
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
		} catch (error) {
			console.error(error);
		}
	};

	const addLists = async () => {
		if (!contact || isEmpty(selectedLists)) {
			return;
		}

		setIsSavingLists(true);
		try {
			await apiFetch({
				path: `/qc/v1/contacts/${contact.id}`,
				method: 'POST',
				data: {
					lists: [...contact.lists, ...selectedLists],
				},
			});

			setContact({
				...contact,
				lists: [...contact.lists, ...selectedLists],
			});
		} catch (error) {
			console.error(error);
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
		} catch (error) {
			console.error(error);
		}
	};

	const addTags = async () => {
		if (!contact || isEmpty(selectedTags)) {
			return;
		}

		setIsSavingTags(true);
		try {
			await apiFetch({
				path: `/qc/v1/contacts/${contact.id}`,
				method: 'POST',
				data: {
					tags: [...contact.tags, ...selectedTags],
				},
			});

			setContact({
				...contact,
				tags: [...contact.tags, ...selectedTags],
			});
		} catch (error) {
			console.error(error);
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
		} catch (error) {
			console.error(error);
		} finally {
			setLoading(false);
		}
	};

	const updateContact = async () => {
		setIsUpdating(true);
		try {
			const response = await apiFetch({
				path: `/qc/v1/contacts/${id}`,
				method: 'POST',
				data: contact,
			});

			setContact(response as ContactType);
		} catch (error) {
			console.error(error);
		} finally {
			setIsUpdating(false);
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
				<Button
					onClick={() => navigate(getToLink(`contacts`))}
					type="link"
				>
					{__('Back to Contacts', 'quillcrm')}
				</Button>
				<Typography.Title level={3}>
					{__('Contact', 'quillcrm')}
				</Typography.Title>
				<Card
					loading={loading}
					className="qcrm-contact-overview-card"
					style={{ width: '100%' }}
				>
					{contact && (
						<div className="qcrm-contact-overview">
							<div className="qcrm-contact-overview-avatar">
								<div className="qcrm-contact-overview-avatar">
									<Avatar size={64} icon={<UserOutlined />} />
								</div>
								<div className="qcrm-contact-overview-details">
									<Typography.Title level={4}>
										{contact.first_name || '-'}{' '}
										{contact.last_name || '-'}
									</Typography.Title>
									<Typography.Text>
										{contact.email}
										<Popover
											content={
												<div
													style={{
														display: 'flex',
														flexDirection: 'column',
														gap: 8,
													}}
												>
													<Select
														value={contact.status}
														style={{ width: 200 }}
														onChange={(value) => {
															setContact({
																...contact,
																status: value,
															});
														}}
													>
														<Select.Option value="subscribed">
															{__(
																'Subscribed',
																'quillcrm'
															)}
														</Select.Option>
														<Select.Option value="unsubscribed">
															{__(
																'Unsubscribed',
																'quillcrm'
															)}
														</Select.Option>
														<Select.Option value="bounced">
															{__(
																'Bounced',
																'quillcrm'
															)}
														</Select.Option>
													</Select>
													<Button
														onClick={updateContact}
														type="primary"
														loading={isUpdating}
													>
														{__(
															'Update',
															'quillcrm'
														)}
													</Button>
												</div>
											}
										>
											<AntTag
												color="processing"
												icon={<ArrowDownOutlined />}
												style={{
													marginLeft: 8,
													cursor: 'pointer',
												}}
											>
												{contact.status}
											</AntTag>
										</Popover>
									</Typography.Text>
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
							<Select
								mode="multiple"
								showSearch
								value={selectedTags.map((tag) => tag.id)}
								onChange={(value) => {
									const selected = tags.filter((tag) =>
										value.includes(tag.id)
									);

									setSelectedTags(selected);
								}}
								onSearch={(value) => {
									if (value?.length > 2) {
										fetchTags(value);
									}
								}}
								style={{ width: '100%' }}
								loading={fetchingTags}
								options={tags
									.filter(
										(tag) =>
											!contact?.tags
												.map((t) => t.id)
												.includes(tag.id)
									)
									.map((tag) => ({
										label: tag.name,
										value: tag.id,
									}))}
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
							<Select
								mode="multiple"
								showSearch
								value={selectedLists.map((list) => list.id)}
								onChange={(value) => {
									const selected = lists.filter((list) =>
										value.includes(list.id)
									);

									setSelectedLists(selected);
								}}
								onSearch={(value) => {
									if (value?.length > 2) {
										fetchLists(value);
									}
								}}
								style={{ width: '100%' }}
								loading={fetchingLists}
								options={lists
									.filter(
										(list) =>
											!contact?.lists
												.map((l) => l.id)
												.includes(list.id)
									)
									.map((list) => ({
										label: list.name,
										value: list.id,
									}))}
							/>
						</div>
					</div>
				</Modal>
			</div>
		</Provider>
	);
};

export default Contact;
