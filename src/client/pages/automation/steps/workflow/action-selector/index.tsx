/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useState } from '@wordpress/element';

/**
 * External dependencies
 */
import { Button, Flex, Typography, Tabs, Modal } from 'antd';
import { map } from 'lodash';

/**
 * Internal dependencies
 */
import './style.scss';
import ConfigAPI from '@quillcrm/config';
import type { ActionsGroup } from '@quillcrm/config';

interface ActionSelectorProps {
	value: string;
	visible: boolean;
	onClose: () => void;
	onChange: (value: string) => void;
	onSave: () => void;
}

const ActionSelector: React.FC<ActionSelectorProps> = ({
	onChange,
	value,
	onSave,
	visible,
	onClose,
}) => {
	const [isSaving, setIsSaving] = useState(false);
	const automationActions = ConfigAPI.getAutomationActions();
	const automationActionsTabs = map(automationActions, (trigger, index) => ({
		key: index,
		label: trigger.label,
		children: (
			<ActionsGroupRender
				groups={trigger.groups}
				onChange={(value) => onChange(value)}
				value={value}
			/>
		),
	}));

	const saveStep = async () => {
		setIsSaving(true);

		try {
			// Save the step
			await onSave();
		} catch (error) {
			console.error(error);
		} finally {
			setIsSaving(false);
		}
	};

	return (
		<Modal
			title={__('Select Action', 'quillcrm')}
			open={visible}
			onOk={saveStep}
			onCancel={() => onClose()}
			confirmLoading={isSaving}
			style={{ minWidth: '800px' }}
			closable={false}
		>
			<div className="qcrm-fields" style={{ marginBottom: '20px' }}>
				<div className="qcrm-field">
					<div className="qcrm-field-input">
						<Tabs
							defaultActiveKey="0"
							tabPosition="left"
							items={automationActionsTabs}
						/>
					</div>
				</div>
			</div>
		</Modal>
	);
};

const ActionsGroupRender: React.FC<{
	groups: ActionsGroup[];
	onChange: (value: string) => void;
	value: string;
}> = ({ groups, onChange, value }) => {
	return (
		<Flex gap={20} wrap vertical={true}>
			{map(groups, (group, key) => (
				<div key={key} className="qcrm-automation-actions-group">
					<Typography.Paragraph
						strong
						className="qcrm-automation-actions-group__label"
						style={{ marginBottom: '10px' }}
					>
						{group.label}
					</Typography.Paragraph>
					<Flex
						className="qcrm-automation-actions-group__actions"
						gap={10}
						wrap
					>
						{map(group.actions, (action, key) => {
							return (
								<Button
									key={key}
									onClick={() => onChange(key)}
									type={value === key ? 'primary' : 'default'}
									disabled={group.is_disabled}
								>
									{action.label}
								</Button>
							);
						})}
					</Flex>
				</div>
			))}
		</Flex>
	);
};

export default ActionSelector;
