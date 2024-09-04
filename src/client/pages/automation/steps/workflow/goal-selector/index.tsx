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

interface GoalSelectorProps {
	value: string;
	visible: boolean;
	onClose: () => void;
	onChange: (value: string) => void;
	onSave: () => void;
}

const GoalSelector: React.FC<GoalSelectorProps> = ({
	onChange,
	value,
	onSave,
	visible,
	onClose,
}) => {
	const [isSaving, setIsSaving] = useState(false);
	const automationGoals = ConfigAPI.getAutomationGoals();
	const automationGoalsTabs = map(automationGoals, (goal, index) => ({
		key: index,
		label: goal.label,
		children: (
			<GoalsGroupRender
				groups={goal.groups}
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
			title={__('Select Goal', 'quillcrm')}
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
							items={automationGoalsTabs}
						/>
					</div>
				</div>
			</div>
		</Modal>
	);
};

const GoalsGroupRender: React.FC<{
	groups: ActionsGroup[];
	onChange: (value: string) => void;
	value: string;
}> = ({ groups, onChange, value }) => {
	return (
		<Flex gap={20} wrap vertical={true}>
			{map(groups, (group, key) => (
				<div key={key} className="qcrm-automation-goals-group">
					<Typography.Paragraph
						strong
						className="qcrm-automation-goals-group__label"
						style={{ marginBottom: '10px' }}
					>
						{group.label}
					</Typography.Paragraph>
					<Flex
						className="qcrm-automation-goals-group__goals"
						gap={10}
						wrap
					>
						{map(group.goals, (action, key) => {
							return (
								<Button
									key={key}
									onClick={() => onChange(key)}
									type={value === key ? 'primary' : 'default'}
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

export default GoalSelector;
