/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useState } from '@wordpress/element';

/**
 * External dependencies
 */
import { Button, Space, Dropdown, Modal, Input, message } from 'antd';
import {
	CheckCircle,
	XCircle,
	RotateCcw,
	MoreHorizontal,
	Clock,
	TrendingUp,
	TrendingDown,
} from 'lucide-react';

/**
 * Internal dependencies
 */
import { useDealOperations } from '../../hooks/use-deal-operations';
import { DealStatusBadge } from '../deal-status-badge';
import { Deal } from '../../types';
import './style.scss';

interface DealStatusActionsProps {
	deal: Deal;
	onStatusChange?: () => void;
	showCurrentStatus?: boolean;
	layout?: 'horizontal' | 'vertical' | 'dropdown';
	size?: 'small' | 'default' | 'large';
}

export const DealStatusActions: React.FC<DealStatusActionsProps> = ({
	deal,
	onStatusChange,
	showCurrentStatus = true,
	layout = 'horizontal',
	size = 'default',
}) => {
	const [loading, setLoading] = useState(false);
	const { markDealAsWon, markDealAsLost, reopenDeal } = useDealOperations();

	const handleMarkAsWon = () => {
		Modal.confirm({
			title: __('Mark Deal as Won?', 'quillcrm'),
			content: __(
				'This will mark the deal as successfully closed. This action can be undone by reopening the deal.',
				'quillcrm'
			),
			okText: __('Mark as Won', 'quillcrm'),
			cancelText: __('Cancel', 'quillcrm'),
			icon: <CheckCircle size={24} style={{ color: '#52c41a' }} />,
			onOk: async () => {
				setLoading(true);
				try {
					await markDealAsWon(deal.id);
					message.success(__('Deal marked as won!', 'quillcrm'));
					onStatusChange?.();
				} catch (error) {
					message.error(__('Failed to mark deal as won', 'quillcrm'));
				} finally {
					setLoading(false);
				}
			},
		});
	};

	const handleMarkAsLost = () => {
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
			icon: <XCircle size={24} style={{ color: '#ff4d4f' }} />,
			onOk: async () => {
				setLoading(true);
				try {
					await markDealAsLost(
						deal.id,
						reasonInput.trim() || undefined
					);
					message.success(__('Deal marked as lost', 'quillcrm'));
					onStatusChange?.();
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
		Modal.confirm({
			title: __('Reopen Deal?', 'quillcrm'),
			content: __(
				'This will reopen the deal and move it back to an active status. You can continue working on this opportunity.',
				'quillcrm'
			),
			okText: __('Reopen Deal', 'quillcrm'),
			cancelText: __('Cancel', 'quillcrm'),
			icon: <RotateCcw size={24} style={{ color: '#1890ff' }} />,
			onOk: async () => {
				setLoading(true);
				try {
					await reopenDeal(deal.id);
					message.success(
						__('Deal reopened successfully!', 'quillcrm')
					);
					onStatusChange?.();
				} catch (error) {
					message.error(__('Failed to reopen deal', 'quillcrm'));
				} finally {
					setLoading(false);
				}
			},
		});
	};

	const getActionButtons = () => {
		const buttons = [];

		if (deal.status === 'open') {
			buttons.push(
				<Button
					key="won"
					type="primary"
					size={size}
					style={{
						backgroundColor: '#52c41a',
						borderColor: '#52c41a',
					}}
					icon={<CheckCircle size={size === 'small' ? 14 : 16} />}
					onClick={handleMarkAsWon}
					loading={loading}
					className="status-action-btn status-won-btn"
				>
					{size !== 'small' && __('Mark as Won', 'quillcrm')}
				</Button>
			);

			buttons.push(
				<Button
					key="lost"
					danger
					size={size}
					icon={<XCircle size={size === 'small' ? 14 : 16} />}
					onClick={handleMarkAsLost}
					loading={loading}
					className="status-action-btn status-lost-btn"
				>
					{size !== 'small' && __('Mark as Lost', 'quillcrm')}
				</Button>
			);
		}

		if (deal.status === 'won' || deal.status === 'lost') {
			buttons.push(
				<Button
					key="reopen"
					size={size}
					icon={<RotateCcw size={size === 'small' ? 14 : 16} />}
					onClick={handleReopen}
					loading={loading}
					className="status-action-btn status-reopen-btn"
				>
					{size !== 'small' && __('Reopen Deal', 'quillcrm')}
				</Button>
			);
		}

		return buttons;
	};

	const renderContent = () => {
		const buttons = getActionButtons();

		if (buttons.length === 0) {
			return null;
		}

		switch (layout) {
			case 'dropdown':
				const menuItems = buttons.map((button, index) => ({
					key: button.key,
					label: button.props.children,
					icon: button.props.icon,
					onClick: button.props.onClick,
					disabled: button.props.loading,
				}));

				return (
					<Dropdown
						menu={{ items: menuItems }}
						trigger={['click']}
						placement="bottomRight"
					>
						<Button size={size} icon={<MoreHorizontal size={16} />}>
							{__('Status Actions', 'quillcrm')}
						</Button>
					</Dropdown>
				);

			case 'vertical':
				return (
					<Space
						direction="vertical"
						size="small"
						className="deal-status-actions-vertical"
					>
						{buttons}
					</Space>
				);

			case 'horizontal':
			default:
				return (
					<Space
						size="small"
						className="deal-status-actions-horizontal"
					>
						{buttons}
					</Space>
				);
		}
	};

	return (
		<div className="deal-status-actions">
			{showCurrentStatus && (
				<div className="current-status">
					<DealStatusBadge
						status={deal.status}
						size={size}
						showTooltip={true}
					/>
				</div>
			)}

			<div className="status-actions">{renderContent()}</div>
		</div>
	);
};
