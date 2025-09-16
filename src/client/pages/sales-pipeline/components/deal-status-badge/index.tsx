/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * External dependencies
 */
import { Tag, Tooltip } from 'antd';
import { CheckCircle, XCircle, Clock, RotateCcw } from 'lucide-react';

/**
 * Internal dependencies
 */
import './style.scss';

interface DealStatusBadgeProps {
	status: 'open' | 'won' | 'lost';
	showIcon?: boolean;
	size?: 'small' | 'default' | 'large';
	showTooltip?: boolean;
	className?: string;
}

export const DealStatusBadge: React.FC<DealStatusBadgeProps> = ({
	status,
	showIcon = true,
	size = 'default',
	showTooltip = true,
	className = '',
}) => {
	const getStatusConfig = (status: string) => {
		switch (status) {
			case 'won':
				return {
					color: 'success',
					icon: <CheckCircle size={size === 'small' ? 12 : 16} />,
					label: __('Won', 'quillcrm'),
					tooltip: __('Deal successfully closed', 'quillcrm'),
				};
			case 'lost':
				return {
					color: 'error',
					icon: <XCircle size={size === 'small' ? 12 : 16} />,
					label: __('Lost', 'quillcrm'),
					tooltip: __('Deal was lost', 'quillcrm'),
				};
			case 'open':
			default:
				return {
					color: 'processing',
					icon: <Clock size={size === 'small' ? 12 : 16} />,
					label: __('Open', 'quillcrm'),
					tooltip: __('Deal is active and in progress', 'quillcrm'),
				};
		}
	};

	const config = getStatusConfig(status);

	const badge = (
		<Tag
			color={config.color}
			className={`deal-status-badge deal-status-${status} deal-status-${size} ${className}`}
		>
			{showIcon && <span className="status-icon">{config.icon}</span>}
			<span className="status-label">{config.label}</span>
		</Tag>
	);

	if (showTooltip) {
		return (
			<Tooltip title={config.tooltip} placement="top">
				{badge}
			</Tooltip>
		);
	}

	return badge;
};
