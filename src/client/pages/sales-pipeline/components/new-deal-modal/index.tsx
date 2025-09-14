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
} from '@ant-design/icons';
import { debounce } from 'lodash';

/**
 * Internal dependencies
 */
import { useDealOperations } from '../../hooks/use-deal-operations';
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
	currency: string;
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
	const { createDeal } = useDealOperations();
	const { createNotice } = useDispatch('quillcrm/core');

	const handleSubmit = async (values: DealFormData) => {
		if (!pipeline) {
			createNotice({
				type: 'error',
				message: __('Please select a pipeline first.', 'quillcrm'),
			});
			return;
		}

		setLoading(true);
		try {
			const dealData = {
				...values,
				pipeline_id: pipeline.id,
				currency: values.currency || 'USD',
				expected_close_date: values.expected_close_date
					? new Date(values.expected_close_date)
							.toISOString()
							.split('T')[0]
					: null,
			};

			await createDeal(dealData);

			createNotice({
				type: 'success',
				message: __('Deal created successfully!', 'quillcrm'),
			});

			form.resetFields();
			onClose();
			onSuccess();
		} catch (error: any) {
			createNotice({
				type: 'error',
				message:
					error?.message ||
					__('Failed to create deal. Please try again.', 'quillcrm'),
			});
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

	// Update form values when pipeline changes
	useEffect(() => {
		if (defaultStageId && visible) {
			form.setFieldsValue({
				stage_id: defaultStageId,
				currency: 'USD',
			});
		}
	}, [defaultStageId, visible]);

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

	// Load contacts when modal opens
	useEffect(() => {
		if (visible) {
			loadContacts();
		}
	}, [visible, loadContacts]);

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
					currency: 'USD',
					stage_id: defaultStageId,
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
					>
						{contacts.map((contact) => (
							<Option key={contact.id} value={contact.id}>
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
								const parsed = value ? value.replace(/\$\s?|(,*)/g, '') : '';
								return parsed as any;
							}}
						/>
					</Form.Item>

					<Form.Item
						name="currency"
						label={__('Currency', 'quillcrm')}
						className="form-item-half"
					>
						<Select placeholder={__('Select currency', 'quillcrm')}>
							<Option value="USD">USD ($)</Option>
							<Option value="EUR">EUR (€)</Option>
							<Option value="GBP">GBP (£)</Option>
							<Option value="CAD">CAD (C$)</Option>
							<Option value="AUD">AUD (A$)</Option>
						</Select>
					</Form.Item>
				</div>

				<Form.Item
					name="probability"
					label={__('Win Probability (%)', 'quillcrm')}
					help={__('Override the default stage probability. Leave empty to use stage default.', 'quillcrm')}
				>
					<InputNumber
						style={{ width: '100%' }}
						placeholder={__('Enter win probability (0-100)', 'quillcrm')}
						min={0}
						max={100}
						step={5}
						formatter={(value) => `${value}%`}
						parser={(value) => {
							const parsed = value ? value.replace('%', '') : '';
							const result = parseFloat(parsed) || 0;
							return Math.min(Math.max(result, 0), 100);
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
						<Option value="website">
							{__('Website', 'quillcrm')}
						</Option>
						<Option value="referral">
							{__('Referral', 'quillcrm')}
						</Option>
						<Option value="social_media">
							{__('Social Media', 'quillcrm')}
						</Option>
						<Option value="email_campaign">
							{__('Email Campaign', 'quillcrm')}
						</Option>
						<Option value="cold_call">
							{__('Cold Call', 'quillcrm')}
						</Option>
						<Option value="trade_show">
							{__('Trade Show', 'quillcrm')}
						</Option>
						<Option value="partner">
							{__('Partner', 'quillcrm')}
						</Option>
						<Option value="other">{__('Other', 'quillcrm')}</Option>
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
