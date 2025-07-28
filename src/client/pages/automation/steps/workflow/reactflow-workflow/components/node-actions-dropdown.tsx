/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * External dependencies
 */
import { Button, Dropdown, Modal, type MenuProps } from 'antd';
import {
	MoreOutlined,
	EditOutlined,
	DeleteOutlined,
	ExclamationCircleOutlined,
} from '@ant-design/icons';

interface NodeActionsDropdownProps {
	onEdit?: () => void;
	onDelete?: () => void;
	editLabel?: string;
	deleteLabel?: string;
	deleteTitle?: string;
	deleteDescription?: string;
	showEdit?: boolean;
	showDelete?: boolean;
	disabled?: boolean;
}

const NodeActionsDropdown: React.FC<NodeActionsDropdownProps> = ({
	onEdit,
	onDelete,
	editLabel = __('Edit', 'quillcrm'),
	deleteLabel = __('Delete', 'quillcrm'),
	deleteTitle = __('Delete this item?', 'quillcrm'),
	deleteDescription = __('This action cannot be undone.', 'quillcrm'),
	showEdit = true,
	showDelete = true,
	disabled = false,
}) => {
	const handleDelete = () => {
		Modal.confirm({
			title: deleteTitle,
			content: deleteDescription,
			icon: <ExclamationCircleOutlined />,
			okText: __('Delete', 'quillcrm'),
			cancelText: __('Cancel', 'quillcrm'),
			okButtonProps: { danger: true },
			onOk: onDelete,
		});
	};

	const handleMenuClick: MenuProps['onClick'] = ({ key, domEvent }) => {
		// Stop propagation to prevent any parent event handlers from firing
		domEvent?.stopPropagation();

		if (key === 'edit' && onEdit) {
			onEdit();
		} else if (key === 'delete') {
			handleDelete();
		}
	};

	// Build menu items based on props
	const menuItems: MenuProps['items'] = [];

	if (showEdit && onEdit) {
		menuItems.push({
			key: 'edit',
			label: editLabel,
			icon: <EditOutlined />,
		});
	}

	if (showDelete && onDelete) {
		menuItems.push({
			key: 'delete',
			label: (
				<span style={{ color: '#ff4d4f' }}>
					<DeleteOutlined style={{ marginRight: 8 }} />
					{deleteLabel}
				</span>
			),
			danger: true,
		});
	}

	if (disabled || menuItems.length === 0) {
		return null;
	}

	return (
		<div
			className="qcrm-reactflow-node__actions"
			onClick={(e) => {
				e.stopPropagation();
				e.preventDefault();
			}}
			onMouseDown={(e) => {
				e.stopPropagation();
			}}
			onMouseUp={(e) => {
				e.stopPropagation();
			}}
			style={{
				position: 'absolute',
				top: '50%',
				right: '16px',
				transform: 'translateY(-50%)',
				zIndex: 10,
				width: '40px',
				height: '40px',
				display: 'flex',
				alignItems: 'center',
				justifyContent: 'center',
			}}
		>
			<Dropdown
				menu={{
					items: menuItems,
					onClick: handleMenuClick,
				}}
				trigger={['click']}
				placement="bottomRight"
			>
				<Button
					type="text"
					size="small"
					icon={<MoreOutlined />}
					onClick={(e) => {
						e.stopPropagation();
						e.preventDefault();
					}}
					onMouseDown={(e) => {
						e.stopPropagation();
					}}
					style={{
						background: 'transparent',
						border: 'none',
						color: '#8c8c8c',
						padding: '6px',
						height: '32px',
						width: '32px',
						boxShadow: 'none',
						borderRadius: '6px',
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'center',
					}}
				/>
			</Dropdown>
		</div>
	);
};

export default NodeActionsDropdown;
