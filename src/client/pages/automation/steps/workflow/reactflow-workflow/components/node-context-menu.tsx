/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * External dependencies
 */
import { Dropdown, Modal } from 'antd';
import { EditOutlined, DeleteOutlined } from '@ant-design/icons';
import type { MenuProps } from 'antd';

interface NodeContextMenuProps {
	onEdit?: () => void;
	onDelete?: () => void;
	children: React.ReactNode;
	disabled?: boolean;
	showDelete?: boolean;
}

const NodeContextMenu: React.FC<NodeContextMenuProps> = ({
	onEdit,
	onDelete,
	children,
	disabled = false,
	showDelete = true,
}) => {
	const handleDelete = () => {
		Modal.confirm({
			title: __('Are you sure?', 'quillcrm'),
			content: __('This action cannot be undone.', 'quillcrm'),
			okText: __('Yes', 'quillcrm'),
			cancelText: __('No', 'quillcrm'),
			okType: 'danger',
			onOk() {
				if (onDelete) {
					onDelete();
				}
			},
		});
	};

	const menuItems: MenuProps['items'] = [
		{
			key: 'edit',
			icon: <EditOutlined />,
			label: __('Edit', 'quillcrm'),
			onClick: ({ domEvent }) => {
				domEvent.stopPropagation();
				if (onEdit) {
					onEdit();
				}
			},
		},
		...(showDelete
			? [
					{
						type: 'divider' as const,
					},
					{
						key: 'delete',
						icon: <DeleteOutlined />,
						label: __('Delete', 'quillcrm'),
						danger: true,
						onClick: ({ domEvent }) => {
							domEvent.stopPropagation();
							handleDelete();
						},
					},
				]
			: []),
	];

	if (disabled) {
		return <>{children}</>;
	}

	return (
		<Dropdown
			menu={{ items: menuItems }}
			trigger={['contextMenu']}
			placement="bottomLeft"
			overlayClassName="qcrm-reactflow-context-menu"
		>
			<div onContextMenu={(e) => e.stopPropagation()}>{children}</div>
		</Dropdown>
	);
};

export default NodeContextMenu;
