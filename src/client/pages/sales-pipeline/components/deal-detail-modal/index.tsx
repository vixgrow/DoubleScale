/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useState, useEffect } from '@wordpress/element';

/**
 * External dependencies
 */
import {
	Modal,
	Tabs,
	Spin,
	message,
	Button,
	Tag,
	Statistic,
	Row,
	Col,
	Card,
	Typography,
	Avatar,
	Badge,
	Input,
} from 'antd';
import {
	User,
	Calendar,
	DollarSign,
	Target,
	Clock,
	Building,
	Mail,
	Phone,
	Edit3,
	Archive,
	RotateCcw,
	CheckCircle,
	XCircle,
} from 'lucide-react';

/**
 * Internal dependencies
 */
import { useDealOperations } from '../../hooks/use-deal-operations';
import { DealActivities } from '../deal-activities';
import { Deal } from '../../types';
import './style.scss';

const { Title, Text, Paragraph } = Typography;

interface DealDetailModalProps {
	dealId: number | null;
	visible: boolean;
	onClose: () => void;
	onUpdate?: () => void;
	onEdit?: (deal: Deal) => void;
}

export const DealDetailModal: React.FC<DealDetailModalProps> = ({
	dealId,
	visible,
	onClose,
	onUpdate,
	onEdit,
}) => {
	const [deal, setDeal] = useState<Deal | null>(null);
	const [loading, setLoading] = useState(false);
	const [activeTab, setActiveTab] = useState('overview');

	const { getDeal, markDealAsWon, markDealAsLost, reopenDeal, deleteDeal } =
		useDealOperations();

	// Fetch deal data when modal opens
	useEffect(() => {
		if (visible && dealId) {
			fetchDealDetails();
		}
	}, [visible, dealId]);

	const fetchDealDetails = async () => {
		if (!dealId) return;

		setLoading(true);
		try {
			const dealData = await getDeal(dealId, true);
			setDeal(dealData);
		} catch (error) {
			message.error(__('Failed to load deal details', 'quillcrm'));
		} finally {
			setLoading(false);
		}
	};

	const handleMarkAsWon = async () => {
		if (!deal) return;

		Modal.confirm({
			title: __('Mark Deal as Won?', 'quillcrm'),
			content: __(
				'This will mark the deal as successfully closed. This action can be undone by reopening the deal.',
				'quillcrm'
			),
			okText: __('Mark as Won', 'quillcrm'),
			cancelText: __('Cancel', 'quillcrm'),
			onOk: async () => {
				setLoading(true);
				try {
					await markDealAsWon(deal.id);
					message.success(__('Deal marked as won!', 'quillcrm'));
					await fetchDealDetails();
					onUpdate?.();
				} catch (error) {
					message.error(__('Failed to mark deal as won', 'quillcrm'));
				} finally {
					setLoading(false);
				}
			},
		});
	};

	const handleMarkAsLost = () => {
		if (!deal) return;

		// Create a modal with reason input
		let reasonInput = '';

		Modal.confirm({
			title: __('Mark Deal as Lost?', 'quillcrm'),
			content: (
				<div style={{ marginTop: 16 }}>
					<p>
						{__(
							'This will mark the deal as lost. You can optionally provide a reason.',
							'quillcrm'
						)}
					</p>
					<Input.TextArea
						placeholder={__(
							'Reason for losing the deal (optional)',
							'quillcrm'
						)}
						rows={3}
						onChange={(e) => (reasonInput = e.target.value)}
						style={{ marginTop: 12 }}
					/>
				</div>
			),
			okText: __('Mark as Lost', 'quillcrm'),
			cancelText: __('Cancel', 'quillcrm'),
			okButtonProps: { danger: true },
			onOk: async () => {
				setLoading(true);
				try {
					await markDealAsLost(
						deal.id,
						reasonInput.trim() || undefined
					);
					message.success(__('Deal marked as lost', 'quillcrm'));
					await fetchDealDetails();
					onUpdate?.();
				} catch (error) {
					message.error(
						__('Failed to mark deal as lost', 'quillcrm')
					);
				} finally {
					setLoading(false);
				}
			},
		});
	};

	const handleReopen = () => {
		if (!deal) return;

		Modal.confirm({
			title: __('Reopen Deal?', 'quillcrm'),
			content: __(
				'This will reopen the deal and move it back to an active status. You can continue working on this opportunity.',
				'quillcrm'
			),
			okText: __('Reopen Deal', 'quillcrm'),
			cancelText: __('Cancel', 'quillcrm'),
			onOk: async () => {
				setLoading(true);
				try {
					await reopenDeal(deal.id);
					message.success(
						__('Deal reopened successfully!', 'quillcrm')
					);
					await fetchDealDetails();
					onUpdate?.();
				} catch (error) {
					message.error(__('Failed to reopen deal', 'quillcrm'));
				} finally {
					setLoading(false);
				}
			},
		});
	};

	const getStatusColor = (status: string) => {
		switch (status) {
			case 'open':
				return 'blue';
			case 'won':
				return 'green';
			case 'lost':
				return 'red';
			default:
				return 'default';
		}
	};

	const getStatusIcon = (status: string) => {
		switch (status) {
			case 'won':
				return <CheckCircle size={16} />;
			case 'lost':
				return <XCircle size={16} />;
			default:
				return <Clock size={16} />;
		}
	};

	const formatCurrency = (value: number, currency: string = 'USD') => {
		return new Intl.NumberFormat('en-US', {
			style: 'currency',
			currency: currency,
		}).format(value);
	};

	const formatDate = (dateString: string | null) => {
		if (!dateString) return __('Not set', 'quillcrm');
		return new Date(dateString).toLocaleDateString();
	};

	const renderOverviewTab = () => {
		if (!deal) return null;

		return (
			<div className="deal-overview">
				<Row gutter={[16, 16]}>
					{/* Deal Information */}
					<Col xs={24} lg={12}>
						<Card
							title={__('Deal Information', 'quillcrm')}
							size="small"
						>
							<div className="deal-info-grid">
								<div className="info-item">
									<Text type="secondary">
										{__('Value', 'quillcrm')}
									</Text>
									<Title level={4}>
										{formatCurrency(
											deal.value,
											deal.currency
										)}
									</Title>
								</div>

								<div className="info-item">
									<Text type="secondary">
										{__('Weighted Value', 'quillcrm')}
									</Text>
									<Title level={4}>
										{formatCurrency(
											deal.weighted_value,
											deal.currency
										)}
									</Title>
								</div>

								<div className="info-item">
									<Text type="secondary">
										{__('Probability', 'quillcrm')}
									</Text>
									<Text strong>
										{deal.probability
											? `${deal.probability}%`
											: __('Not set', 'quillcrm')}
									</Text>
								</div>

								<div className="info-item">
									<Text type="secondary">
										{__('Status', 'quillcrm')}
									</Text>
									<Tag
										color={getStatusColor(deal.status)}
										icon={getStatusIcon(deal.status)}
									>
										{deal.status.charAt(0).toUpperCase() +
											deal.status.slice(1)}
									</Tag>
								</div>

								<div className="info-item">
									<Text type="secondary">
										{__('Expected Close Date', 'quillcrm')}
									</Text>
									<div
										className={
											deal.is_overdue
												? 'overdue-date'
												: ''
										}
									>
										<Calendar size={16} />
										<Text
											strong
											className={
												deal.is_overdue
													? 'text-red-600'
													: ''
											}
										>
											{formatDate(
												deal.expected_close_date || null
											)}
										</Text>
										{deal.is_overdue && (
											<Badge
												count="OVERDUE"
												style={{
													backgroundColor: '#ef4444',
												}}
											/>
										)}
									</div>
								</div>

								{deal.days_until_close !== null && (
									<div className="info-item">
										<Text type="secondary">
											{__('Days Until Close', 'quillcrm')}
										</Text>
										<Text
											strong
											className={
												deal.days_until_close < 0
													? 'text-red-600'
													: ''
											}
										>
											{deal.days_until_close}{' '}
											{__('days', 'quillcrm')}
										</Text>
									</div>
								)}

								{deal.source && (
									<div className="info-item">
										<Text type="secondary">
											{__('Source', 'quillcrm')}
										</Text>
										<Text strong>{deal.source}</Text>
									</div>
								)}
							</div>
						</Card>
					</Col>

					{/* Contact & Pipeline Information */}
					<Col xs={24} lg={12}>
						<Card
							title={__('Contact & Pipeline', 'quillcrm')}
							size="small"
						>
							{deal.contact && (
								<div className="contact-section">
									<div className="contact-header">
										<Avatar size={40} icon={<User />} />
										<div>
											<Title level={5}>
												{deal.contact.first_name}{' '}
												{deal.contact.last_name}
											</Title>
											<Text type="secondary">
												{deal.contact.email}
											</Text>
										</div>
									</div>
								</div>
							)}

							{deal.pipeline && deal.stage && (
								<div className="pipeline-section">
									<div className="pipeline-info">
										<Building size={16} />
										<div>
											<Text strong>
												{deal.pipeline.name}
											</Text>
											<br />
											<Tag
												color={deal.stage.color}
												style={{ marginTop: 4 }}
											>
												{deal.stage.name} (
												{deal.stage.win_probability}%)
											</Tag>
										</div>
									</div>
								</div>
							)}

							{deal.owner && (
								<div className="owner-section">
									<div className="owner-info">
										<User size={16} />
										<div>
											<Text strong>
												{__('Owner:', 'quillcrm')}{' '}
												{deal.owner.display_name}
											</Text>
											<br />
											<Text type="secondary">
												{deal.owner.email}
											</Text>
										</div>
									</div>
								</div>
							)}
						</Card>
					</Col>
				</Row>

				{/* Deal Actions */}
				<div className="deal-actions">
					<Button
						type="primary"
						icon={<Edit3 size={16} />}
						onClick={() => {
							if (deal && onEdit) {
								onEdit(deal);
							}
						}}
					>
						{__('Edit Deal', 'quillcrm')}
					</Button>

					{deal.status === 'open' && (
						<>
							<Button
								type="primary"
								style={{ backgroundColor: '#52c41a' }}
								icon={<CheckCircle size={16} />}
								onClick={handleMarkAsWon}
								loading={loading}
							>
								{__('Mark as Won', 'quillcrm')}
							</Button>

							<Button
								danger
								icon={<XCircle size={16} />}
								onClick={handleMarkAsLost}
								loading={loading}
							>
								{__('Mark as Lost', 'quillcrm')}
							</Button>
						</>
					)}

					{(deal.status === 'won' || deal.status === 'lost') && (
						<Button
							icon={<RotateCcw size={16} />}
							onClick={handleReopen}
							loading={loading}
						>
							{__('Reopen Deal', 'quillcrm')}
						</Button>
					)}

					<Button
						danger
						type="text"
						icon={<Archive size={16} />}
						onClick={() => {
							// Handle delete - should show confirmation modal
							Modal.confirm({
								title: __('Delete Deal?', 'quillcrm'),
								content: __(
									'This action cannot be undone.',
									'quillcrm'
								),
								onOk: async () => {
									try {
										await deleteDeal(deal.id);
										message.success(
											__(
												'Deal deleted successfully',
												'quillcrm'
											)
										);
										onClose();
										onUpdate?.();
									} catch (error) {
										message.error(
											__(
												'Failed to delete deal',
												'quillcrm'
											)
										);
									}
								},
							});
						}}
					>
						{__('Delete', 'quillcrm')}
					</Button>
				</div>
			</div>
		);
	};

	return (
		<Modal
			title={deal ? deal.title : __('Deal Details', 'quillcrm')}
			open={visible}
			onCancel={onClose}
			width={900}
			footer={null}
			className="deal-detail-modal"
		>
			{loading ? (
				<div className="loading-container">
					<Spin size="large" />
				</div>
			) : deal ? (
				<Tabs
					activeKey={activeTab}
					onChange={setActiveTab}
					items={[
						{
							key: 'overview',
							label: __('Overview', 'quillcrm'),
							children: renderOverviewTab(),
						},
						{
							key: 'activities',
							label: __('Activities', 'quillcrm'),
							children: <DealActivities dealId={deal.id} />,
						},
					]}
				/>
			) : (
				<div className="no-data">
					<Text type="secondary">
						{__('No deal data available', 'quillcrm')}
					</Text>
				</div>
			)}
		</Modal>
	);
};
