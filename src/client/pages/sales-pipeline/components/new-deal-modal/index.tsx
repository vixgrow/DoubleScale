/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useState, useMemo, useEffect, useCallback } from '@wordpress/element';
import apiFetch from '@wordpress/api-fetch';

/**
 * External dependencies
 */
import {
	Modal,
	Form,
	Input,
	Select,
	InputNumber,
	DatePicker,
	message,
} from 'antd';
import {
	UserOutlined,
	DollarOutlined,
	CalendarOutlined,
} from '@ant-design/icons';
import { debounce } from 'lodash';

/**
 * Internal dependencies
 */
import { useDealOperations } from '../../hooks/use-deal-operations';
import { useUsers } from '../../hooks/use-users';
import { UserService } from '../../../../../services/user-service';
import { SOURCE_OPTIONS } from '../../../../../config/types/config-data';
import './style.scss';

const { Option } = Select;

export interface NewDealModalProps {
	visible: boolean;
	onClose: () => void;
	onSuccess: () => void;
	pipeline: any;
}

interface DealFormData {
	title: string;
	contact_id: number;
	stage_id: number;
	value?: number;
	expected_close_date?: string;
	probability?: number;
	source?: string;
	owner_id?: number;
}

interface Contact {
	id: number;
	first_name: string;
	last_name: string;
	email: string;
}

export const NewDealModal: React.FC<NewDealModalProps> = ({
	visible,
	onClose,
	onSuccess,
	pipeline,
}) => {
	const [form] = Form.useForm();
	const [loading, setLoading] = useState(false);
	const [contacts, setContacts] = useState<Contact[]>([]);
	const [contactsLoading, setContactsLoading] = useState(false);

	// Use shared users hook
	const {
		users: owners,
		loading: ownersLoading,
		loadUsers: loadOwners,
		searchUsers: searchOwners,
		ensureUserIncluded,
	} = useUsers();
	const { createDeal } = useDealOperations();

	const handleSubmit = async (values: DealFormData) => {
		if (!pipeline) {
			message.error(__('Please select a pipeline first.', 'quillcrm'));
			return;
		}

		// Ensure owner_id is set as fallback
		if (!values.owner_id && defaultOwnerId) {
			values.owner_id = defaultOwnerId;
		}

		setLoading(true);
		try {
			const dealData = {
				...values,
				pipeline_id: pipeline.id,
				currency: 'USD',
				expected_close_date: values.expected_close_date
					? new Date(values.expected_close_date)
							.toISOString()
							.split('T')[0]
					: null,
			};

			await createDeal(dealData);

			message.success(__('Deal created successfully!', 'quillcrm'));

			form.resetFields();
			onClose();
			onSuccess();
		} catch (error: any) {
			message.error(
				error?.message ||
					__('Failed to create deal. Please try again.', 'quillcrm')
			);
		} finally {
			setLoading(false);
		}
	};

	const handleCancel = () => {
		form.resetFields();
		onClose();
	};

	// Get the first stage as default if available (sorted by sort_order)
	const defaultStageId = useMemo(() => {
		if (!pipeline?.stages?.length) return undefined;
		const sortedStages = [...pipeline.stages].sort(
			(a, b) => a.sort_order - b.sort_order
		);
		return sortedStages[0].id;
	}, [pipeline?.stages]);

	// Get current user as default owner
	const [currentUserId, setCurrentUserId] = useState<number | undefined>(
		undefined
	);

	// Get current user ID from WordPress using centralized service
	useEffect(() => {
		const fetchCurrentUser = async () => {
			try {
				// Try global object first
				const globalUserId = (window as any)?.qcData?.currentUser?.id;
				if (globalUserId) {
					setCurrentUserId(Number(globalUserId));
					return;
				}

				// Use centralized UserService
				const currentUser = await UserService.getCurrentUser();
				if (currentUser) {
					setCurrentUserId(currentUser.id);
				}
			} catch (error) {
				console.error('Failed to get current user:', error);
				// Final fallback - will be handled by backend
				setCurrentUserId(undefined);
			}
		};

		fetchCurrentUser();
	}, []);

	const defaultOwnerId = useMemo(() => {
		return currentUserId;
	}, [currentUserId]);

	// Update form values when pipeline changes or current user is loaded
	useEffect(() => {
		if (defaultStageId && visible) {
			const values: any = {
				stage_id: defaultStageId,
			};

			// Only set owner_id if we have a valid current user
			if (defaultOwnerId) {
				values.owner_id = defaultOwnerId;
			}

			form.setFieldsValue(values);
		}
	}, [defaultStageId, defaultOwnerId, visible, form]);

	// Load initial contacts
	const loadContacts = useCallback(async (searchTerm = '') => {
		setContactsLoading(true);
		try {
			const params = new URLSearchParams();
			if (searchTerm) {
				params.append('search', searchTerm);
			}
			params.append('per_page', '20');
			params.append('page', '1');

			const response = await apiFetch({
				path: `/qc/v1/contacts?${params.toString()}`,
				method: 'GET',
			});

			// Handle both array and paginated response
			const contactsData = Array.isArray(response)
				? response
				: (response as any)?.data || [];
			setContacts(contactsData);
		} catch (error) {
			console.error('Failed to load contacts:', error);
			setContacts([]);
		} finally {
			setContactsLoading(false);
		}
	}, []);

	// Debounced search function
	const debouncedLoadContacts = useMemo(
		() => debounce(loadContacts, 300),
		[loadContacts]
	);

	// Load contacts and owners when modal opens
	useEffect(() => {
		if (visible) {
			loadContacts();
			loadOwners();
		}
	}, [visible, loadContacts, loadOwners]);

	// Ensure current user is in the owners list when loaded
	useEffect(() => {
		if (currentUserId && owners.length > 0) {
			const currentUserExists = owners.find(
				(owner) => Number(owner.id) === Number(currentUserId)
			);

			if (!currentUserExists) {
				// If current user not in list, we need to fetch it using centralized service
				const ensureCurrentUser = async () => {
					try {
						const currentUser =
							await UserService.getUserById(currentUserId);
						if (currentUser) {
							// Use the hook's method to ensure user is included
							ensureUserIncluded(currentUser);
						}
					} catch (error) {
						console.error(
							'Failed to fetch current user details:',
							error
						);
					}
				};

				ensureCurrentUser();
			}
		}
	}, [currentUserId, owners, ensureUserIncluded]);

	return (
		<Modal
			title={
				<div className="new-deal-modal-title">
					<DollarOutlined />
					<span>{__('Create New Deal', 'quillcrm')}</span>
				</div>
			}
			open={visible}
			onCancel={handleCancel}
			onOk={() => form.submit()}
			okText={__('Create Deal', 'quillcrm')}
			cancelText={__('Cancel', 'quillcrm')}
			confirmLoading={loading}
			width={600}
			className="new-deal-modal"
			destroyOnClose
		>
			<Form
				form={form}
				layout="vertical"
				onFinish={handleSubmit}
				key={visible ? 'deal-form' : 'hidden'}
				initialValues={{
					stage_id: defaultStageId,
					owner_id: defaultOwnerId,
				}}
			>
				<Form.Item
					name="title"
					label={__('Deal Title', 'quillcrm')}
					rules={[
						{
							required: true,
							message: __(
								'Please enter a deal title',
								'quillcrm'
							),
						},
						{
							min: 3,
							message: __(
								'Deal title must be at least 3 characters',
								'quillcrm'
							),
						},
					]}
				>
					<Input
						placeholder={__('Enter deal title', 'quillcrm')}
						prefix={<UserOutlined />}
					/>
				</Form.Item>

				<Form.Item
					name="contact_id"
					label={__('Contact', 'quillcrm')}
					rules={[
						{
							required: true,
							message: __('Please select a contact', 'quillcrm'),
						},
					]}
				>
					<Select
						placeholder={__(
							'Search and select a contact',
							'quillcrm'
						)}
						showSearch
						filterOption={false}
						loading={contactsLoading}
						notFoundContent={
							contactsLoading
								? __('Searching...', 'quillcrm')
								: __('No contacts found', 'quillcrm')
						}
						onSearch={debouncedLoadContacts}
						optionLabelProp="label"
					>
						{contacts.map((contact) => (
							<Option
								key={contact.id}
								value={contact.id}
								label={`${contact.first_name} ${contact.last_name}`.trim()}
							>
								<div className="contact-option">
									<span className="contact-name">
										{contact.first_name} {contact.last_name}
									</span>
									<span className="contact-email">
										{contact.email}
									</span>
								</div>
							</Option>
						))}
					</Select>
				</Form.Item>

				<Form.Item
					name="owner_id"
					label={__('Deal Owner', 'quillcrm')}
					rules={[
						{
							required: true,
							message: __(
								'Please select a deal owner',
								'quillcrm'
							),
						},
					]}
				>
					<Select
						placeholder={__(
							'Search and select a deal owner',
							'quillcrm'
						)}
						showSearch
						filterOption={false}
						notFoundContent={__('No users found', 'quillcrm')}
						onSearch={searchOwners}
						loading={ownersLoading}
						allowClear
					>
						{owners.map((owner) => (
							<Option key={owner.id} value={Number(owner.id)}>
								{owner.display_name} ({owner.email})
							</Option>
						))}
					</Select>
				</Form.Item>

				<div className="form-row">
					<Form.Item
						name="value"
						label={__('Deal Value', 'quillcrm')}
						className="form-item-half"
					>
						<InputNumber
							style={{ width: '100%' }}
							placeholder={__('Enter amount', 'quillcrm')}
							prefix={<DollarOutlined />}
							min={0}
							step={0.01}
							formatter={(value) =>
								`${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
							}
							parser={(value) => {
								const parsed = value
									? value.replace(/\$\s?|(,*)/g, '')
									: '';
								return parsed as any;
							}}
						/>
					</Form.Item>
				</div>

				<Form.Item
					name="probability"
					label={__('Win Probability (%)', 'quillcrm')}
					help={__(
						'Override the default stage probability. Leave empty to use stage default.',
						'quillcrm'
					)}
				>
					<InputNumber
						style={{ width: '100%' }}
						placeholder={__(
							'Enter win probability (0-100)',
							'quillcrm'
						)}
						min={0}
						max={100}
						step={5}
						formatter={(value) => `${value}%`}
						parser={(value) => {
							const parsed = value ? value.replace('%', '') : '';
							const result = parseFloat(parsed) || 0;
							return Math.min(Math.max(result, 0), 100) as any;
						}}
					/>
				</Form.Item>

				{pipeline?.stages && pipeline.stages.length > 0 && (
					<Form.Item
						name="stage_id"
						label={__('Pipeline Stage', 'quillcrm')}
						rules={[
							{
								required: true,
								message: __(
									'Please select a stage',
									'quillcrm'
								),
							},
						]}
					>
						<Select placeholder={__('Select stage', 'quillcrm')}>
							{[...pipeline.stages]
								.sort((a, b) => a.sort_order - b.sort_order)
								.map((stage: any) => (
									<Option key={stage.id} value={stage.id}>
										<div className="stage-option">
											<span
												className="stage-color"
												style={{
													backgroundColor:
														stage.color,
												}}
											/>
											<span>{stage.name}</span>
											<span className="stage-probability">
												({stage.win_probability}%{' '}
												{__('win rate', 'quillcrm')})
											</span>
										</div>
									</Option>
								))}
						</Select>
					</Form.Item>
				)}

				<Form.Item
					name="expected_close_date"
					label={__('Expected Close Date', 'quillcrm')}
				>
					<DatePicker
						style={{ width: '100%' }}
						placeholder={__(
							'Select expected close date',
							'quillcrm'
						)}
						suffixIcon={<CalendarOutlined />}
						format="YYYY-MM-DD"
					/>
				</Form.Item>

				<Form.Item name="source" label={__('Deal Source', 'quillcrm')}>
					<Select
						placeholder={__(
							'Select deal source (optional)',
							'quillcrm'
						)}
						allowClear
					>
						{SOURCE_OPTIONS.map((source) => (
							<Option key={source.value} value={source.value}>
								{source.label}
							</Option>
						))}
					</Select>
				</Form.Item>
			</Form>

			{pipeline && (
				<div className="pipeline-info">
					<span className="pipeline-label">
						{__('Pipeline:', 'quillcrm')}
					</span>
					<span className="pipeline-name">{pipeline.name}</span>
				</div>
			)}
		</Modal>
	);
};
