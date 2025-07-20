/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useState } from '@wordpress/element';

/**
 * External dependencies
 */
import { Button, Tooltip } from 'antd';
import {
	NodeIndexOutlined,
	ApartmentOutlined,
	ArrowUpOutlined,
	ArrowDownOutlined,
	ArrowLeftOutlined,
	ArrowRightOutlined,
} from '@ant-design/icons';

/**
 * Internal dependencies
 */
import {
	useAutoLayout,
	LayoutAlgorithm,
	LayoutDirection,
} from '../hooks/useAutoLayout';

interface LayoutButtonProps {
	algorithm: LayoutAlgorithm;
	direction: LayoutDirection;
	size?: 'small' | 'middle' | 'large';
	type?: 'default' | 'primary' | 'dashed' | 'link' | 'text';
	className?: string;
	iconOnly?: boolean;
}

const LayoutButton: React.FC<LayoutButtonProps> = ({
	algorithm,
	direction,
	size = 'middle',
	type = 'default',
	className = '',
	iconOnly = false,
}) => {
	const { layout } = useAutoLayout();
	const [isLoading, setIsLoading] = useState(false);

	// Get algorithm icon
	const getAlgorithmIcon = () => {
		switch (algorithm) {
			case 'elk':
				return <ApartmentOutlined />;
			case 'dagre':
			default:
				return <NodeIndexOutlined />;
		}
	};

	// Get direction icon
	const getDirectionIcon = () => {
		switch (direction) {
			case 'BT':
				return <ArrowUpOutlined />;
			case 'LR':
				return <ArrowRightOutlined />;
			case 'RL':
				return <ArrowLeftOutlined />;
			case 'TB':
			default:
				return <ArrowDownOutlined />;
		}
	};

	// Get algorithm name
	const getAlgorithmName = () => {
		switch (algorithm) {
			case 'elk':
				return 'ELK';
			case 'dagre':
			default:
				return 'Dagre';
		}
	};

	// Get direction name
	const getDirectionName = () => {
		switch (direction) {
			case 'BT':
				return __('Bottom to Top', 'quillcrm');
			case 'LR':
				return __('Left to Right', 'quillcrm');
			case 'RL':
				return __('Right to Left', 'quillcrm');
			case 'TB':
			default:
				return __('Top to Bottom', 'quillcrm');
		}
	};

	// Handle layout
	const handleLayout = async () => {
		setIsLoading(true);
		try {
			await layout({
				algorithm,
				direction,
				nodeSpacing: 100,
				rankSpacing: 150,
				edgeSpacing: 50,
			});
		} catch (error) {
			console.error('Layout failed:', error);
		} finally {
			setIsLoading(false);
		}
	};

	const buttonText = iconOnly ? '' : `${getAlgorithmName()} ${direction}`;

	const tooltipTitle = `${getAlgorithmName()} - ${getDirectionName()}`;

	return (
		<Tooltip title={tooltipTitle}>
			<Button
				icon={iconOnly ? getAlgorithmIcon() : getDirectionIcon()}
				size={size}
				type={type}
				loading={isLoading}
				onClick={handleLayout}
				className={className}
			>
				{buttonText}
			</Button>
		</Tooltip>
	);
};

export default LayoutButton;
