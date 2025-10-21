/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useState } from '@wordpress/element';

/**
 * External dependencies
 */
import { Button, Flex, Typography, Tabs, Modal, Tooltip } from 'antd';
import { map } from 'lodash';

/**
 * Internal dependencies
 */
import './style.scss';
import ConfigAPI from '@quillcrm/config';
import type { ActionsGroup } from '@quillcrm/config';
import { useAutomationContext } from '../../../state/context';
import { getTrigger } from '@quillcrm/utils';

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
	const { automation } = useAutomationContext();

	const automationActionsTabs = map(automationActions, (trigger, index) => ({
		key: index,
		label: trigger.label,
		children: (
			<ActionsGroupRender
				groups={trigger.groups}
				onChange={(value) => onChange(value)}
				value={value}
				currentTrigger={automation?.trigger}
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
	currentTrigger?: string;
}> = ({ groups, onChange, value, currentTrigger }) => {
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
							// Check if action is compatible with current trigger
							const requiredTriggers =
								(action as any).required_triggers || [];
							const isCompatible =
								requiredTriggers.length === 0 ||
								(currentTrigger &&
									requiredTriggers.includes(currentTrigger));

							// Create tooltip content for incompatible actions
							const tooltipContent =
								!isCompatible && requiredTriggers.length > 0 ? (
									<div>
										<div>
											{__(
												'This action requires one of these triggers:',
												'quillcrm'
											)}
										</div>
										<ul
											style={{
												margin: '5px 0',
												paddingLeft: '20px',
											}}
										>
											{requiredTriggers.map(
												(trigger, index) => {
													const triggerData =
														getTrigger(trigger);
													const triggerLabel =
														triggerData?.label ||
														trigger;
													return (
														<li key={index}>
															{triggerLabel}
														</li>
													);
												}
											)}
										</ul>
									</div>
								) : null;

							const button = (
								<Button
									key={key}
									onClick={() =>
										isCompatible ? onChange(key) : null
									}
									type={value === key ? 'primary' : 'default'}
									disabled={
										group.is_disabled || !isCompatible
									}
									style={{
										opacity: !isCompatible ? 0.6 : 1,
										cursor: !isCompatible
											? 'not-allowed'
											: 'pointer',
									}}
								>
									{action.label}
								</Button>
							);

							// Wrap with tooltip if action is not compatible
							return !isCompatible && tooltipContent ? (
								<Tooltip
									key={key}
									title={tooltipContent}
									placement="top"
								>
									{button}
								</Tooltip>
							) : (
								button
							);
						})}
					</Flex>
				</div>
			))}
		</Flex>
	);
};

export default ActionSelector;
