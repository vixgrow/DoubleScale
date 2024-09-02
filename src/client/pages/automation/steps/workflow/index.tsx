/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useState } from '@wordpress/element';
import apiFetch from '@wordpress/api-fetch';
import { useDispatch } from '@wordpress/data';

/**
 * External dependencies
 */
import {
	Button,
	Card,
	Flex,
	Popover,
	Spin,
	Typography,
	Tabs,
	Modal,
	Tag,
	Input,
} from 'antd';
import {
	TrophyOutlined,
	BranchesOutlined,
	DisconnectOutlined,
	RocketOutlined,
	ThunderboltOutlined,
	PlusCircleOutlined,
} from '@ant-design/icons';
import { map, keys, find } from 'lodash';
import Select from 'react-select';

/**
 * Internal dependencies
 */
import './style.scss';
import { useAutomationContext } from '../../state/context';
import ConfigAPI from '@quillcrm/config';
import type { Trigger } from '@quillcrm/config';
import type { AutomationStep } from '../../../types';
import type { ActionsGroup } from '@quillcrm/config';
import ListField from '../../components/list-field';
import TagField from '../../components/tag-field';
import ApiSelectField from '../../components/api-select';

const getAction = (action: string) => {
	const actions = ConfigAPI.getAutomationActions();
	const actionGroups = keys(actions);
	for (let i = 0; i < actionGroups.length; i++) {
		const groups = actions[actionGroups[i]].groups;
		const actionGroup = find(groups, (group) => {
			return group.actions[action];
		});

		if (actionGroup) {
			return actionGroup.actions[action];
		}
	}

	return {
		label: '',
		description: '',
		fields: {},
	};
};

const getGoal = (goal: string) => {
	const goals = ConfigAPI.getAutomationGoals();
	const goalGroups = keys(goals);
	for (let i = 0; i < goalGroups.length; i++) {
		const groups = goals[goalGroups[i]].groups;
		const goalGroup = find(groups, (group) => {
			return group.goals[goal];
		});

		if (goalGroup) {
			return goalGroup.goals[goal];
		}
	}

	return {
		label: '',
		description: '',
		fields: {},
	};
};

const Workflow: React.FC = () => {
	const { automation, steps, isLoading, updateAutomation } =
		useAutomationContext();
	const automationTriggers = ConfigAPI.getAutomationTriggers();
	const [currentStep, setCurrentStep] = useState<AutomationStep | null>(null);
	const [visible, setVisible] = useState<boolean>(false);
	const [isSaving, setIsSaving] = useState<boolean>(false);
	const { createNotice } = useDispatch('quillcrm/core');

	const save = async () => {
		if (!automation) {
			return;
		}

		setIsSaving(true);

		try {
			const response = (await apiFetch({
				path: `/qc/v1/automations/${automation.id}`,
				method: 'POST',
				data: automation,
			})) as any;

			updateAutomation(response);
		} catch (error) {
			createNotice({
				type: 'error',
				message: __('Failed to save automation', 'quillcrm'),
			});
		} finally {
			setIsSaving(false);
			setVisible(false);
		}
	};

	const getTrigger = (trigger: string): Trigger => {
		const triggerGroups = keys(automationTriggers);
		for (let i = 0; i < triggerGroups.length; i++) {
			const groups = automationTriggers[triggerGroups[i]].groups;
			const triggerGroup = find(groups, (group) => {
				return group.triggers[trigger];
			});

			if (triggerGroup) {
				return triggerGroup.triggers[trigger];
			}
		}

		return {
			label: '',
			description: '',
			fields: {},
		};
	};

	const trigger = automation ? getTrigger(automation.trigger) : null;
	const typesOptions = {
		action: {
			label: __('Action', 'quillcrm'),
			icon: <ThunderboltOutlined />,
		},
		condition: {
			label: __('Condition', 'quillcrm'),
			icon: <BranchesOutlined />,
		},
		goal: {
			label: __('Goal', 'quillcrm'),
			icon: <TrophyOutlined />,
		},
		end_automation: {
			label: __('End Automation', 'quillcrm'),
			icon: <DisconnectOutlined />,
		},
	};

	const getStep = (step: AutomationStep) => {
		switch (step.type) {
			case 'goal':
				return getGoal(step.action);
			case 'action':
				return getAction(step.action);
			default:
				return {
					label: '',
					description: '',
					fields: {},
				};
		}
	};

	return (
		<Card loading={isLoading}>
			{automation && (
				<>
					<Flex
						style={{ width: 'auto' }}
						gap={20}
						justify="center"
						align="center"
						vertical={true}
					>
						<Flex
							className="qcrm-automation-workflow"
							vertical={true}
							gap={20}
						>
							<div className="qcrm-automation-workflow__item">
								<Card
									className="qcrm-automation-workflow__card"
									hoverable
									onClick={() =>
										trigger?.fields && setVisible(true)
									}
								>
									<Flex gap={10}>
										<div className="qcrm-automation-workflow__card-icon">
											<RocketOutlined />
										</div>
										<div className="qcrm-automation-workflow__card-title">
											{trigger?.label}
										</div>
									</Flex>
								</Card>
							</div>
							{map(steps, (step, key) => {
								return (
									<div
										key={key}
										className="qcrm-automation-workflow__item"
									>
										<Card
											className="qcrm-automation-workflow__card"
											hoverable
											onClick={() => setCurrentStep(step)}
										>
											<Flex gap={10}>
												<div className="qcrm-automation-workflow__card-icon">
													{
														typesOptions[step.type]
															.icon
													}
												</div>
												<div className="qcrm-automation-workflow__card-title">
													{step.action
														? getStep(step).label
														: typesOptions[
																step.type
															].label}
													{!step.action &&
														step.type !==
															'end_automation' && (
															<Tag
																color="warning"
																style={{
																	display:
																		'block',
																	marginTop:
																		'5px',
																}}
															>
																{__(
																	'Action not set',
																	'quillcrm'
																)}
															</Tag>
														)}
												</div>
											</Flex>
										</Card>
									</div>
								);
							})}
						</Flex>
						<AddStep setStep={setCurrentStep} />
					</Flex>
				</>
			)}
			{currentStep && (
				<StepModal step={currentStep} setStep={setCurrentStep} />
			)}
			<Modal
				title={__('Trigger', 'quillcrm')}
				open={visible}
				onOk={() => save()}
				onCancel={() => setVisible(false)}
				confirmLoading={isSaving}
				style={{ minWidth: '800px', minHeight: '500px' }}
				closable={false}
			>
				<Fields
					fields={trigger?.fields}
					values={automation?.settings || {}}
					onChange={(value) => {
						updateAutomation({
							...automation,
							settings: value,
						});
					}}
				/>
			</Modal>
		</Card>
	);
};

interface AddStepProps {
	setStep: (step: AutomationStep) => void;
}

const AddStep: React.FC<AddStepProps> = ({ setStep }) => {
	const { automation, addStep } = useAutomationContext();
	const [loading, setLoading] = useState(false);
	const { createNotice } = useDispatch('quillcrm/core');

	if (!automation) {
		return null;
	}

	const saveStep = async (type: string) => {
		setLoading(true);

		try {
			const response = (await apiFetch({
				path: `/qc/v1/automation-steps`,
				method: 'POST',
				data: {
					automation_id: automation.id,
					type,
					status: 'active',
				},
			})) as AutomationStep;

			addStep(response);
			setStep(response);
			createNotice({
				type: 'success',
				message: __('Step added', 'quillcrm'),
			});
		} catch (error) {
			createNotice({
				type: 'error',
				message: __('Failed to add step', 'quillcrm'),
			});
		} finally {
			setLoading(false);
		}
	};

	const typesOptions = {
		action: {
			label: __('Action', 'quillcrm'),
			icon: <ThunderboltOutlined />,
		},
		condition: {
			label: __('Condition', 'quillcrm'),
			icon: <BranchesOutlined />,
		},
		goal: {
			label: __('Goal', 'quillcrm'),
			icon: <TrophyOutlined />,
		},
		end_automation: {
			label: __('End Automation', 'quillcrm'),
			icon: <DisconnectOutlined />,
		},
	};

	return (
		<Popover
			placement="top"
			trigger="click"
			content={
				<>
					{loading && <Spin />}
					{!loading && (
						<Flex gap={10} wrap>
							{map(typesOptions, (type, key) => (
								<Button
									key={key}
									icon={type.icon}
									onClick={() => saveStep(key)}
								>
									{type.label}
								</Button>
							))}
						</Flex>
					)}
				</>
			}
		>
			<Button
				type="primary"
				icon={<PlusCircleOutlined />}
				style={{
					borderRadius: '50%',
				}}
			/>
		</Popover>
	);
};

interface StepModalProps {
	step: AutomationStep;
	setStep: (step: AutomationStep | null) => void;
}

const StepModal: React.FC<StepModalProps> = ({ step, setStep }) => {
	const { updateStep } = useAutomationContext();
	const [actionModalVisible, setActionModalVisible] = useState(!step.action);
	const [value, setValue] = useState('');
	const { createNotice } = useDispatch('quillcrm/core');

	const saveStep = async () => {
		try {
			const response = (await apiFetch({
				path: `/qc/v1/automation-steps/${step.id}`,
				method: 'POST',
				data: {
					...step,
					action: value,
				},
			})) as AutomationStep;

			updateStep(response.id, response);
			setStep(null);
			createNotice({
				type: 'success',
				message: __('Automation updated', 'quillcrm'),
			});
		} catch (error) {
			createNotice({
				type: 'error',
				message: __('Failed to update automation', 'quillcrm'),
			});
		}
	};

	switch (step.type) {
		case 'action':
			if (!step.action) {
				return (
					<ActionSelector
						value={value}
						visible={actionModalVisible}
						onClose={() => {
							setActionModalVisible(false);
							setStep(null);
						}}
						onChange={(value) => setValue(value)}
						onSave={() => saveStep()}
					/>
				);
			} else {
				return <StepFieldsModal step={step} setStep={setStep} />;
			}
		case 'goal':
			if (!step.action) {
				return (
					<GoalSelector
						value={value}
						visible={actionModalVisible}
						onClose={() => {
							setActionModalVisible(false);
							setStep(null);
						}}
						onChange={(value) => setValue(value)}
						onSave={() => saveStep()}
					/>
				);
			} else {
				return <StepFieldsModal step={step} setStep={setStep} />;
			}
		default:
			return null;
	}
};

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

interface StepFieldsModalProps {
	step: AutomationStep;
	setStep: (step: AutomationStep | null) => void;
}

const StepFieldsModal: React.FC<StepFieldsModalProps> = ({ step, setStep }) => {
	const { updateStep } = useAutomationContext();
	const [isSaving, setIsSaving] = useState(false);
	const [settings, setSettings] = useState(step.settings);
	const { createNotice } = useDispatch('quillcrm/core');

	const saveStep = async () => {
		setIsSaving(true);

		try {
			const response = (await apiFetch({
				path: `/qc/v1/automation-steps/${step.id}`,
				method: 'POST',
				data: {
					...step,
					settings,
				},
			})) as AutomationStep;

			updateStep(response.id, response);
			setStep(null);
			createNotice({
				type: 'success',
				message: __('Automation updated', 'quillcrm'),
			});
		} catch (error) {
			createNotice({
				type: 'error',
				message: __('Failed to update automation', 'quillcrm'),
			});
		} finally {
			setIsSaving(false);
		}
	};

	const action =
		step.type === 'action' ? getAction(step.action) : getGoal(step.action);

	return (
		<Modal
			title={
				step.type === 'action'
					? __('Action', 'quillcrm')
					: __('Goal', 'quillcrm')
			}
			open={true}
			onOk={saveStep}
			onCancel={() => setStep(null)}
			confirmLoading={isSaving}
			style={{ minWidth: '800px', minHeight: '500px' }}
			closable={false}
		>
			<Fields
				fields={action.fields}
				values={settings}
				onChange={(value) => {
					setSettings(value);
				}}
			/>
		</Modal>
	);
};

interface FieldsProps {
	fields: any;
	values: any;
	onChange: (value: any) => void;
}

const Fields: React.FC<FieldsProps> = ({
	fields,
	values: formValues,
	onChange,
}) => {
	const handleChange = (key: string, value: any) => {
		const newValues = {
			...formValues,
			[key]: value,
		};

		onChange(newValues);
	};

	return (
		<div className="qcrm-fields" style={{ marginBottom: '20px' }}>
			{map(fields, (field, key) => {
				return (
					<div key={key} className="qcrm-field">
						<div className="qcrm-field-label">
							<Typography.Text>{field.label}</Typography.Text>
						</div>
						<div className="qcrm-field-input">
							<Field
								field={field}
								id={key}
								value={formValues?.[key]}
								onChange={handleChange}
							/>
						</div>
					</div>
				);
			})}
		</div>
	);
};

interface FieldProps {
	field: any;
	id: string;
	onChange: (id: string, value: any) => void;
	value: any;
}

const Field: React.FC<FieldProps> = ({ field, id, onChange, value }) => {
	switch (field.type) {
		case 'lists':
			return (
				<ListField
					value={value || []}
					onChange={(value) => onChange(id, value)}
				/>
			);
		case 'tags':
			return (
				<TagField
					value={value || []}
					onChange={(value) => onChange(id, value)}
				/>
			);
		case 'api_select':
			return (
				<ApiSelectField
					value={value || []}
					onChange={(value) => onChange(id, value)}
					endpoint={field.endpoint}
				/>
			);
		case 'text':
		case 'number':
			return (
				<Input
					value={value || ''}
					onChange={(e) => onChange(id, e.target.value)}
					type={field.type}
				/>
			);
		case 'textarea':
			return (
				<Input.TextArea
					value={value || ''}
					onChange={(e) => onChange(id, e.target.value)}
				/>
			);
		case 'select':
			const options = map(field.options, (label, value) => ({
				label,
				value,
			}));
			return (
				<Select
					value={
						value
							? options.find((option) => option.value === value)
							: null
					}
					onChange={(value) => onChange(id, value.value)}
					options={options}
				/>
			);
		case 'multiselect':
			const multiOptions = map(field.options, (label, value) => ({
				label,
				value,
			}));
			return (
				<Select
					onChange={(value) => {
						const values = value.map((val: any) => val.value);
						onChange(id, values);
					}}
					options={multiOptions}
					value={multiOptions.filter((option) =>
						value?.includes(option.value)
					)}
					isMulti
				/>
			);
		default:
			return null;
	}
};

export default Workflow;
