/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useState } from '@wordpress/element';

/**
 * External dependencies
 */
import { Dropdown, Menu, Button, Modal, Input, message } from 'antd';
import { MoreHorizontal, Copy, Settings, Trash2 } from 'lucide-react';

/**
 * Internal dependencies
 */
import { usePipelineOperations } from '../../hooks/use-pipeline-operations';
import './style.scss';

interface PipelineActionsProps {
	pipeline: any;
	onUpdate: () => void;
	onEdit: () => void;
	disabled?: boolean;
}

export const PipelineActions: React.FC<PipelineActionsProps> = ({
	pipeline,
	onUpdate,
	onEdit,
	disabled = false,
}) => {
	const [duplicateModalVisible, setDuplicateModalVisible] = useState(false);
	const [duplicateName, setDuplicateName] = useState('');
	const [loading, setLoading] = useState(false);

	const { duplicatePipeline, deletePipeline } = usePipelineOperations();

	const handleDuplicate = async () => {
		if (!duplicateName.trim()) {
			message.error(__('Please enter a name for the duplicated pipeline', 'quillcrm'));
			return;
		}

		setLoading(true);
		try {
			await duplicatePipeline(pipeline.id, duplicateName.trim());
			message.success(__('Pipeline duplicated successfully!', 'quillcrm'));
			setDuplicateModalVisible(false);
			setDuplicateName('');
			onUpdate();
		} catch (error) {
			message.error(
				error instanceof Error 
					? error.message 
					: __('Failed to duplicate pipeline', 'quillcrm')
			);
		} finally {
			setLoading(false);
		}
	};

	const handleDelete = () => {
		Modal.confirm({
			title: __('Delete Pipeline?', 'quillcrm'),
			content: __('This action cannot be undone. All deals in this pipeline will be moved to another pipeline.', 'quillcrm'),
			okText: __('Delete', 'quillcrm'),
			okType: 'danger',
			cancelText: __('Cancel', 'quillcrm'),
			onOk: async () => {
				try {
					await deletePipeline(pipeline.id);
					message.success(__('Pipeline deleted successfully', 'quillcrm'));
					onUpdate();
				} catch (error) {
					message.error(__('Failed to delete pipeline', 'quillcrm'));
				}
			},
		});
	};

	const openDuplicateModal = () => {
		setDuplicateName(`Copy of ${pipeline.name}`);
		setDuplicateModalVisible(true);
	};

	const menuItems = [
		{
			key: 'duplicate',
			label: __('Duplicate Pipeline', 'quillcrm'),
			icon: <Copy size={16} />,
			onClick: openDuplicateModal,
		},
		{
			key: 'edit',
			label: __('Edit Pipeline', 'quillcrm'),
			icon: <Settings size={16} />,
			onClick: onEdit,
		},
		{
			type: 'divider' as const,
		},
		{
			key: 'delete',
			label: __('Delete Pipeline', 'quillcrm'),
			icon: <Trash2 size={16} />,
			onClick: handleDelete,
			danger: true,
		},
	];

	return (
		<>
			<Dropdown
				menu={{ items: menuItems }}
				trigger={['click']}
				disabled={disabled}
				placement="bottomRight"
			>
				<Button
					type="text"
					icon={<MoreHorizontal size={16} />}
					className="pipeline-actions-button"
					disabled={disabled}
				/>
			</Dropdown>

			<Modal
				title={__('Duplicate Pipeline', 'quillcrm')}
				open={duplicateModalVisible}
				onCancel={() => {
					setDuplicateModalVisible(false);
					setDuplicateName('');
				}}
				onOk={handleDuplicate}
				confirmLoading={loading}
				okText={__('Duplicate', 'quillcrm')}
				cancelText={__('Cancel', 'quillcrm')}
			>
				<div className="duplicate-modal-content">
					<p>{__('Enter a name for the duplicated pipeline:', 'quillcrm')}</p>
					<Input
						value={duplicateName}
						onChange={(e) => setDuplicateName(e.target.value)}
						placeholder={__('Pipeline name', 'quillcrm')}
						maxLength={255}
						onPressEnter={handleDuplicate}
						autoFocus
					/>
					<div className="duplicate-info">
						<p>
							{__('The duplicated pipeline will include:', 'quillcrm')}
						</p>
						<ul>
							<li>{__('All stages with their colors and probabilities', 'quillcrm')}</li>
							<li>{__('Pipeline description and settings', 'quillcrm')}</li>
							<li>{__('Stage order and configuration', 'quillcrm')}</li>
						</ul>
						<p className="note">
							{__('Note: Deals will not be copied to the new pipeline.', 'quillcrm')}
						</p>
					</div>
				</div>
			</Modal>
		</>
	);
};
