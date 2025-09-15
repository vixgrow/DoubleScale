/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useState, useMemo, useEffect, useCallback } from '@wordpress/element';
import { useDispatch } from '@wordpress/data';
import apiFetch from '@wordpress/api-fetch';

/**
 * External dependencies
 */
import { Modal, Form, Input, Select, InputNumber, DatePicker } from 'antd';
import {
	UserOutlined,
	DollarOutlined,
	CalendarOutlined,
	EditOutlined,
} from '@ant-design/icons';
import { debounce } from 'lodash';
import dayjs from 'dayjs';

/**
 * Internal dependencies
 */
import { useDealOperations } from '../../hooks/use-deal-operations';
import { useUsers } from '../../hooks/use-users';
import { Deal } from '../../types';
import './style.scss';

const { Option } = Select;

export interface EditDealModalProps {
	visible: boolean;
	onClose: () => void;
	onSuccess: () => void;
	deal: Deal | null;
	pipelines: any[];
}

interface DealFormData {
	title: string;
	contact_id: number;
	pipeline_id: number;
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

export const EditDealModal: React.FC<EditDealModalProps> = ({
	visible,
	onClose,
	onSuccess,
	deal,
	pipelines,
}) => {
	const [form] = Form.useForm();
	const [loading, setLoading] = useState(false);
	const [contacts, setContacts] = useState<Contact[]>([]);
	const [contactSearchLoading, setContactSearchLoading] = useState(false);

	// Use shared users hook
	const {
		users: owners,
		loading: ownersLoading,
		loadUsers: loadOwners,
		searchUsers: searchOwners,
		ensureUserIncluded,
	} = useUsers();
	const [selectedPipelineId, setSelectedPipelineId] = useState<number | null>(
		null
	);

	const { updateDeal } = useDealOperations();
	const dispatch = useDispatch('quillcrm/core');
	const createNotice = dispatch?.createNotice;

	// Get stages for selected pipeline
	const availableStages = useMemo(() => {
		if (!selectedPipelineId) return [];
		const pipeline = pipelines.find((p) => p.id === selectedPipelineId);
		return pipeline?.stages || [];
	}, [selectedPipelineId, pipelines]);

	// Load initial contacts when modal opens
	useEffect(() => {
		if (visible) {
			fetchInitialContacts();
		}
	}, [visible]);

	// Initialize form when deal changes - with proper timing
	useEffect(() => {
		if (deal && visible && pipelines.length > 0) {
			// Set selectedPipelineId first
			setSelectedPipelineId(deal.pipeline_id);

			// Set form values with proper data types
			form.setFieldsValue({
				title: deal.title,
				contact_id: deal.contact?.id,
				pipeline_id: Number(deal.pipeline_id), // Ensure number type
				stage_id: Number(deal.stage_id), // Ensure number type
				value: deal.value,
				expected_close_date: deal.expected_close_date
					? dayjs(deal.expected_close_date)
					: null,
				probability: deal.probability,
				source: deal.source,
				owner_id: deal.owner?.id ? Number(deal.owner.id) : undefined,
			});

			// Load initial owners list
			fetchInitialOwners();
		}
	}, [deal, visible, form, pipelines]);

	// Reset state when modal closes
	useEffect(() => {
		if (!visible) {
			setContacts([]);
			setSelectedPipelineId(null);
			form.resetFields();
		}
	}, [visible, form]);

	// Fetch initial contacts (recent contacts + current contact)
	const fetchInitialContacts = useCallback(async () => {
		setContactSearchLoading(true);
		try {
			const response = await apiFetch({
				path: '/qc/v1/contacts?per_page=20&sort_by=updated_at&sort_order=desc',
			});

			const contactsData = Array.isArray(response)
				? response
				: (response as any)?.data || (response as any)?.items || [];

			// Ensure current deal's contact is included if not in recent list
			let finalContacts = [...contactsData];
			if (
				deal?.contact &&
				!finalContacts.find((c) => c.id === deal.contact?.id)
			) {
				finalContacts.unshift(deal.contact);
			}

			setContacts(finalContacts);
		} catch (error) {
			console.error('Failed to fetch initial contacts:', error);
			// Fallback to current contact only
			if (deal?.contact) {
				setContacts([deal.contact]);
			}
		} finally {
			setContactSearchLoading(false);
		}
	}, [deal?.contact]);

	// Fetch contacts with search
	const fetchContacts = useCallback(
		debounce(async (searchTerm: string) => {
			if (!searchTerm || searchTerm.length < 2) {
				// Reload initial contacts when search is cleared
				fetchInitialContacts();
				return;
			}

			setContactSearchLoading(true);
			try {
				const response = await apiFetch({
					path: `/qc/v1/contacts?search=${encodeURIComponent(searchTerm)}&per_page=20`,
				});

				const contactsData = Array.isArray(response)
					? response
					: (response as any)?.data || (response as any)?.items || [];

				setContacts(contactsData);
			} catch (error) {
				console.error('Failed to fetch contacts:', error);
				if (createNotice) {
					createNotice({
						type: 'error',
						message: __('Failed to load contacts', 'quillcrm'),
					});
				}
			} finally {
				setContactSearchLoading(false);
			}
		}, 300),
		[fetchInitialContacts, createNotice]
	);

	// Fetch initial owners using our custom users endpoint
	const fetchInitialOwners = useCallback(async () => {
		await loadOwners();

		// Ensure current deal's owner is included
		if (deal?.owner) {
			ensureUserIncluded(deal.owner);
		}
	}, [deal?.owner, loadOwners, ensureUserIncluded]);

	const handleSubmit = async (values: DealFormData) => {
		if (!deal) return;

		setLoading(true);
		try {
			// Prepare update data
			const updateData: any = {
				title: values.title,
				contact_id: values.contact_id,
				pipeline_id: values.pipeline_id,
				stage_id: values.stage_id,
				value: values.value || 0,
				currency: 'USD',
				expected_close_date: values.expected_close_date
					? dayjs(values.expected_close_date).format('YYYY-MM-DD')
					: null,
				probability: values.probability,
				source: values.source,
				owner_id: values.owner_id,
			};

			await updateDeal(deal.id, updateData);

			if (createNotice) {
				createNotice({
					type: 'success',
					message: __(
						`Deal "${values.title}" updated successfully!`,
						'quillcrm'
					),
				});
			}

			onSuccess();
			onClose();
		} catch (error) {
			if (createNotice) {
				createNotice({
					type: 'error',
					message:
						error instanceof Error
							? error.message
							: __('Failed to update deal', 'quillcrm'),
				});
			}
		} finally {
			setLoading(false);
		}
	};

	const handleCancel = () => {
		onClose();
	};

	const handlePipelineChange = (pipelineId: number) => {
		setSelectedPipelineId(pipelineId);
		// Clear stage selection when pipeline changes
		form.setFieldValue('stage_id', undefined);
	};

	return (
		<Modal
			title={
				<div className="modal-title">
					<EditOutlined />
					<span>{__('Edit Deal', 'quillcrm')}</span>
				</div>
			}
			open={visible}
			onCancel={handleCancel}
			onOk={() => form.submit()}
			confirmLoading={loading}
			width={600}
			className="edit-deal-modal"
			okText={__('Update Deal', 'quillcrm')}
			cancelText={__('Cancel', 'quillcrm')}
			destroyOnClose={true}
		>
			<Form
				form={form}
				layout="vertical"
				onFinish={handleSubmit}
				className="edit-deal-form"
			>
				{/* Deal Title */}
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
							max: 255,
							message: __(
								'Title must not exceed 255 characters',
								'quillcrm'
							),
						},
					]}
				>
					<Input
						placeholder={__('Enter deal title', 'quillcrm')}
						maxLength={255}
					/>
				</Form.Item>

				{/* Contact Selection */}
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
						showSearch
						placeholder={__(
							'Select or search contacts',
							'quillcrm'
						)}
						notFoundContent={
							contactSearchLoading
								? __('Loading...', 'quillcrm')
								: __(
										'No contacts found - try searching',
										'quillcrm'
									)
						}
						filterOption={false}
						onSearch={fetchContacts}
						loading={contactSearchLoading}
						suffixIcon={<UserOutlined />}
						onDropdownVisibleChange={(open) => {
							if (open && contacts.length === 0) {
								fetchInitialContacts();
							}
						}}
					>
						{contacts.map((contact) => (
							<Option key={contact.id} value={contact.id}>
								{contact.first_name} {contact.last_name} (
								{contact.email})
							</Option>
						))}
					</Select>
				</Form.Item>

				{/* Pipeline & Stage */}
				<div className="form-row">
					<Form.Item
						name="pipeline_id"
						label={__('Pipeline', 'quillcrm')}
						rules={[
							{
								required: true,
								message: __(
									'Please select a pipeline',
									'quillcrm'
								),
							},
						]}
						className="form-item-half"
					>
						<Select
							placeholder={__('Select pipeline', 'quillcrm')}
							onChange={handlePipelineChange}
						>
							{pipelines.map((pipeline) => (
								<Option key={pipeline.id} value={pipeline.id}>
									{pipeline.name}
								</Option>
							))}
						</Select>
					</Form.Item>

					<Form.Item
						name="stage_id"
						label={__('Stage', 'quillcrm')}
						rules={[
							{
								required: true,
								message: __(
									'Please select a stage',
									'quillcrm'
								),
							},
						]}
						className="form-item-half"
					>
						<Select
							placeholder={__('Select stage', 'quillcrm')}
							disabled={
								!selectedPipelineId ||
								availableStages.length === 0
							}
						>
							{availableStages.map((stage) => (
								<Option key={stage.id} value={stage.id}>
									<div className="stage-option">
										<span
											className="stage-color"
											style={{
												backgroundColor: stage.color,
											}}
										/>
										{stage.name} ({stage.win_probability}%)
									</div>
								</Option>
							))}
						</Select>
					</Form.Item>
				</div>

				{/* Value & Currency */}
				<div className="form-row">
					<Form.Item
						name="value"
						label={__('Deal Value', 'quillcrm')}
						className="form-item-half"
					>
						<InputNumber
							placeholder={__('0.00', 'quillcrm')}
							min={0}
							step={0.01}
							style={{ width: '100%' }}
							prefix={<DollarOutlined />}
						/>
					</Form.Item>
				</div>

				{/* Expected Close Date & Probability */}
				<div className="form-row">
					<Form.Item
						name="expected_close_date"
						label={__('Expected Close Date', 'quillcrm')}
						className="form-item-half"
					>
						<DatePicker
							style={{ width: '100%' }}
							placeholder={__('Select date', 'quillcrm')}
							suffixIcon={<CalendarOutlined />}
						/>
					</Form.Item>

					<Form.Item
						name="probability"
						label={__('Win Probability (%)', 'quillcrm')}
						className="form-item-half"
					>
						<InputNumber
							min={0}
							max={100}
							style={{ width: '100%' }}
							placeholder={__('Auto from stage', 'quillcrm')}
						/>
					</Form.Item>
				</div>

				{/* Source & Owner */}
				<div className="form-row">
					<Form.Item
						name="source"
						label={__('Source', 'quillcrm')}
						className="form-item-half"
					>
						<Input
							placeholder={__(
								'e.g., Website, Referral',
								'quillcrm'
							)}
						/>
					</Form.Item>

					<Form.Item
						name="owner_id"
						label={__('Deal Owner', 'quillcrm')}
						className="form-item-half"
					>
						<Select
							showSearch
							placeholder={__(
								'Select or search users',
								'quillcrm'
							)}
							notFoundContent={__(
								'No users found - try searching',
								'quillcrm'
							)}
							filterOption={false}
							onSearch={searchOwners}
							loading={ownersLoading}
							allowClear
							onDropdownVisibleChange={(open) => {
								if (open && owners.length === 0) {
									fetchInitialOwners();
								}
							}}
						>
							{owners.map((owner) => (
								<Option key={owner.id} value={Number(owner.id)}>
									{owner.display_name} ({owner.email})
								</Option>
							))}
						</Select>
					</Form.Item>
				</div>
			</Form>
		</Modal>
	);
};
