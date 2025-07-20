/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useState } from '@wordpress/element';

/**
 * External dependencies
 */
import {
	NodeIndexOutlined,
	ApartmentOutlined,
	ArrowDownOutlined,
	ThunderboltOutlined,
} from '@ant-design/icons';
import { Button, Dropdown, Space, Tooltip, Divider } from 'antd';
import type { MenuProps } from 'antd';

/**
 * Internal dependencies
 */
import {
	useAutoLayout,
	LayoutAlgorithm,
	LayoutDirection,
} from '../hooks/useAutoLayout';

interface LayoutControlsProps {
	className?: string;
	handleLayout: (
		algorithm?: LayoutAlgorithm,
		direction?: LayoutDirection,
		customOptions?: any
	) => void;
	currentAlgorithm: LayoutAlgorithm;
	setCurrentAlgorithm: (algorithm: LayoutAlgorithm) => void;
	currentDirection: LayoutDirection;
	setCurrentDirection: (direction: LayoutDirection) => void;
	isLoadingLayout: boolean;
}

const LayoutControls: React.FC<LayoutControlsProps> = ({
	className = '',
	handleLayout,
	currentAlgorithm,
	isLoadingLayout,
	setCurrentAlgorithm,
	currentDirection,
	setCurrentDirection,
}) => {
	// Algorithm selection
	const algorithmItems: MenuProps['items'] = [
		{
			key: 'dagre',
			icon: <NodeIndexOutlined />,
			label: (
				<div>
					<div style={{ fontWeight: 'bold' }}>
						{__('Dagre', 'quillcrm')}
					</div>
					<div style={{ fontSize: '12px', color: '#666' }}>
						{__('Fast, simple directed graph layout', 'quillcrm')}
					</div>
				</div>
			),
			onClick: () => setCurrentAlgorithm('dagre'),
		},
		{
			key: 'elk',
			icon: <ApartmentOutlined />,
			label: (
				<div>
					<div style={{ fontWeight: 'bold' }}>
						{__('ELK', 'quillcrm')}
					</div>
					<div style={{ fontSize: '12px', color: '#666' }}>
						{__('Advanced layout with edge routing', 'quillcrm')}
					</div>
				</div>
			),
			onClick: () => setCurrentAlgorithm('elk'),
		},
	];

	// Direction selection
	const directionItems: MenuProps['items'] = [
		{
			key: 'TB',
			icon: <ArrowDownOutlined />,
			label: __('Top to Bottom', 'quillcrm'),
			onClick: () => setCurrentDirection('TB'),
		},
	];

	// Get current algorithm icon
	const getAlgorithmIcon = () => {
		switch (currentAlgorithm) {
			case 'elk':
				return <ApartmentOutlined />;
			case 'dagre':
			default:
				return <NodeIndexOutlined />;
		}
	};

	// Get current direction icon
	const getDirectionIcon = () => {
		switch (currentDirection) {
			case 'TB':
			default:
				return <ArrowDownOutlined />;
		}
	};

	return (
		<div className={`qcrm-layout-controls ${className}`}>
			<Divider type="vertical" style={{ margin: '0 8px' }} />

			<Space.Compact>
				{/* Quick Auto-Layout Button */}
				<Tooltip
					title={__('Auto Layout with current settings', 'quillcrm')}
				>
					<Button
						type="primary"
						icon={<ThunderboltOutlined />}
						loading={isLoadingLayout}
						onClick={() => handleLayout()}
						style={{
							borderTopRightRadius: 0,
							borderBottomRightRadius: 0,
						}}
					>
						{__('Auto Layout', 'quillcrm')}
					</Button>
				</Tooltip>
			</Space.Compact>

			<Divider type="vertical" style={{ margin: '0 8px' }} />

			{/* Algorithm Selection */}
			<Dropdown
				menu={{ items: algorithmItems }}
				trigger={['click']}
				placement="bottomLeft"
			>
				<Tooltip title={__('Layout Algorithm', 'quillcrm')}>
					<Button
						icon={getAlgorithmIcon()}
						type={
							currentAlgorithm === 'dagre' ? 'default' : 'dashed'
						}
					>
						{currentAlgorithm.toUpperCase()}
					</Button>
				</Tooltip>
			</Dropdown>

			{/* Direction Selection */}
			<Dropdown
				menu={{ items: directionItems }}
				trigger={['click']}
				placement="bottomLeft"
			>
				<Tooltip title={__('Layout Direction', 'quillcrm')}>
					<Button icon={getDirectionIcon()} type="dashed">
						{currentDirection}
					</Button>
				</Tooltip>
			</Dropdown>
		</div>
	);
};

export default LayoutControls;
