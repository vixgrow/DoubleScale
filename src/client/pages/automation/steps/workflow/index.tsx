/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useState, useMemo, useEffect, useCallback } from '@wordpress/element';
import apiFetch from '@wordpress/api-fetch';
import { useDispatch } from '@wordpress/data';

/**
 * External dependencies
 */
import {
	Card,
	Flex,
	Modal,
	Switch,
	Tag,
	Typography,
	Popconfirm,
	Button,
} from 'antd';
import {
	TrophyOutlined,
	BranchesOutlined,
	DisconnectOutlined,
	RocketOutlined,
	ThunderboltOutlined,
	DeleteOutlined,
} from '@ant-design/icons';
import { isEmpty } from 'lodash';
import { ChartLineIcon } from 'lucide-react';

/**
 * Internal dependencies
 */
import './style.scss';
import { useAutomationContext } from '../../state/context';
import type {
	AutomationStep,
	OrganizedSteps,
	OrganizedStep,
	Automation,
} from '@quillcrm/client';
import { Field, Fields } from '@quillcrm/components';
import StepModal from './step-modal';
import AddStep from './add-step';
import { getAction, getGoal, getTrigger } from '@quillcrm/utils';
import WebhookFields from './webhook-fields';
import FormFields from './form-fields';
import ReactFlowWorkflow from './reactflow-workflow';
import { NavLink } from '@quillcrm/navigation';

const Workflow: React.FC = () => {
	const {
		automation,
		steps,
		isLoading,
		updateAutomation,
		saveAutomation,
		isSaving: isSavingAutomation,
		setSteps,
		updateSettings,
	} = useAutomationContext();
	const [currentStep, setCurrentStep] = useState<OrganizedStep | null>(null);
	const [visible, setVisible] = useState<boolean>(false);
	const [isSaving, setIsSaving] = useState<boolean>(false);
	const [useReactFlow, setUseReactFlow] = useState<boolean>(true);
	const { createNotice, setCurrentTrigger } = useDispatch('quillcrm/core');

	useEffect(() => {
		if (automation) {
			setCurrentTrigger(automation.trigger);
		}
	}, [automation]);

	const processSteps = (
		parentId: number,
		steps: AutomationStep[]
	): AutomationStep[] => {
		const newSteps = steps
			.filter((step) => step.parent_id == parentId)
			.map((step) => ({
				...step,
				children: processSteps(step.id, steps),
			}));

		newSteps.sort((a, b) => a.order - b.order);
		return newSteps;
	};

	const organizedSteps = useMemo(() => {
		return processSteps(0, steps);
	}, [steps]) as OrganizedSteps;

	const organizeChildrenByCondition = (children: OrganizedStep[]) => {
		const yesChildren = children.filter(
			(child) => child.condition === 'yes'
		);
		const noChildren = children.filter((child) => child.condition === 'no');

		return { yesChildren, noChildren };
	};

	const save = async (data = {}) => {
		if (!automation) {
			return;
		}

		setIsSaving(true);

		try {
			const response = (await apiFetch({
				path: `/qc/v1/automations/${automation.id}`,
				method: 'POST',
				data: {
					...automation,
					...data,
				},
			})) as Automation;

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

	const deleteStep = async (step: OrganizedStep) => {
		if (!automation) {
			return;
		}

		const getNewSteps = () => {
			const updatedOrdersSteps = {};
			const newSteps = [...steps];

			if (step.parent_id) {
				newSteps
					.filter(
						(child) =>
							child.parent_id === step.parent_id &&
							child.condition === step.condition
					)
					.filter((s) => s.id !== step.id)
					.sort((a, b) => a.order - b.order)
					.forEach((child, index) => {
						const newOrder = index + 1;
						if (newOrder !== child.order) {
							updatedOrdersSteps[child.id] = { order: newOrder };
						}
					});
			} else {
				newSteps
					.sort((a, b) => a.order - b.order)
					.filter((s) => s.id !== step.id)
					.forEach((step, index) => {
						const newOrder = index + 1;
						if (newOrder !== step.order) {
							updatedOrdersSteps[step.id] = { order: newOrder };
						}
					});
			}

			return { updatedOrdersSteps, newSteps };
		};

		const { newSteps, updatedOrdersSteps } = getNewSteps();

		try {
			// @ts-ignore
			const response = (await apiFetch({
				path: `/qc/v1/automation-steps/${step.id}`,
				method: 'DELETE',
				data: {
					updated_steps: updatedOrdersSteps,
				},
			})) as Automation;

			const updatedSteps = newSteps.filter((s) => s.id !== step.id);
			setSteps(updatedSteps);
		} catch (error: any) {
			createNotice({
				type: 'error',
				message: error.message,
			});
		}
	};

	const renderStep = (step: OrganizedStep) => {
		const { yesChildren, noChildren } = organizeChildrenByCondition(
			step.children || []
		);

		let label = typesOptions[step.type].label;
		const stepData = getStep(step);
		if (
			step.type !== 'condition' &&
			step.type !== 'end_automation' &&
			step.action
		) {
			label = stepData.label;
		}

		const setStepHandler = (step: OrganizedStep) => {
			if (!step.action) {
				setCurrentStep(step);
				return;
			}
			if (
				(step.type !== 'end_automation' && !isEmpty(stepData.fields)) ||
				step.type === 'condition'
			) {
				setCurrentStep(step);
			}
		};

		return (
			<div key={step.id} className="qcrm-automation-workflow__item">
				<Card
					className="qcrm-automation-workflow__card"
					hoverable
					actions={[
						<Popconfirm
							title={__('Are you sure?', 'quillcrm')}
							onConfirm={() => deleteStep(step)}
							okText={__('Yes', 'quillcrm')}
							cancelText={__('No', 'quillcrm')}
						>
							<Button
								type="text"
								icon={<DeleteOutlined />}
								danger
							/>
						</Popconfirm>,
					]}
				>
					<Flex gap={10} onClick={() => setStepHandler(step)}>
						<div className="qcrm-automation-workflow__card-icon">
							{typesOptions[step.type].icon}
						</div>
						<div className="qcrm-automation-workflow__card-title">
							{label}
							{!step.action &&
								step.type !== 'end_automation' &&
								step.type !== 'condition' && (
									<Tag
										color="warning"
										style={{
											display: 'block',
											marginTop: '5px',
										}}
									>
										{__('Action not set', 'quillcrm')}
									</Tag>
								)}
						</div>
					</Flex>
				</Card>
				{step.type !== 'condition' &&
					step.type !== 'end_automation' && (
						<AddStep
							setStep={setCurrentStep}
							prevStep={step ?? null}
							condition={step.condition}
							parentId={step.parent_id}
						/>
					)}
				{step.type === 'condition' && (
					<Flex gap={20} style={{ marginTop: 10 }}>
						<Card
							className="qcrm-automation-workflow__condition-yes"
							style={{ flex: 1 }}
						>
							<Flex vertical gap={10}>
								<h4>{__('Yes', 'quillcrm')}</h4>
								<AddStep
									setStep={setCurrentStep}
									prevStep={null}
									parentId={step.id}
									condition="yes"
								/>
								{yesChildren.length > 0 &&
									yesChildren.map(renderStep)}
							</Flex>
						</Card>
						<Card
							className="qcrm-automation-workflow__condition-no"
							style={{ flex: 1 }}
						>
							<Flex vertical gap={10}>
								<h4>{__('No', 'quillcrm')}</h4>
								<AddStep
									setStep={setCurrentStep}
									prevStep={null}
									parentId={step.id}
									condition="no"
								/>
								{noChildren.length > 0 &&
									noChildren.map(renderStep)}
							</Flex>
						</Card>
					</Flex>
				)}
				{step.type === 'condition' && (
					<AddStep setStep={setCurrentStep} prevStep={step ?? null} />
				)}
			</div>
		);
	};

	return (
		<>
			<Card style={{ marginBottom: 20 }} loading={isLoading}>
				<Flex justify="space-between">
					<Typography.Title level={4} style={{ margin: 0 }}>
						{automation?.name || __('New Automation', 'quillcrm')}
					</Typography.Title>
					<Flex gap={20} align="center">
						{/* <Flex gap={10} align="center">
							<Typography.Text>
								{__('Workflow View:', 'quillcrm')}
							</Typography.Text>
							<Switch
								checked={useReactFlow}
								onChange={setUseReactFlow}
								checkedChildren={__('Flow', 'quillcrm')}
								unCheckedChildren={__('List', 'quillcrm')}
							/>
						</Flex> */}
						<Flex gap={10} align="center">
							<ChartLineIcon size={16} />
							<NavLink
								to={`automations/${automation?.id}/reports`}
							>
								{__('View Reports', 'quillcrm')}
							</NavLink>
						</Flex>
						<Flex gap={10} align="center">
							<Typography.Text>
								{__('Status:', 'quillcrm')}
							</Typography.Text>
							<Switch
								checked={automation?.status === 'active'}
								onChange={(value) =>
									saveAutomation({
										status: value ? 'active' : 'inactive',
									})
								}
								loading={isSavingAutomation}
							/>
						</Flex>
					</Flex>
				</Flex>
			</Card>
			<Card loading={isLoading}>
				{automation && (
					<>
						{useReactFlow ? (
							<ReactFlowWorkflow
								onStepClick={(step) => setCurrentStep(step)}
								onTriggerClick={() => setVisible(true)}
							/>
						) : (
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
									style={{ width: '100%' }}
								>
									<div className="qcrm-automation-workflow__item">
										<Card
											className="qcrm-automation-workflow__card"
											hoverable
											onClick={() => setVisible(true)}
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
									<AddStep setStep={setCurrentStep} />
									{organizedSteps.map(renderStep)}
								</Flex>
							</Flex>
						)}
					</>
				)}
				{currentStep && (
					<StepModal step={currentStep} setStep={setCurrentStep} />
				)}
				{automation && trigger && (
					<Modal
						title={__('Trigger', 'quillcrm')}
						open={visible}
						onOk={() => save()}
						onCancel={() => setVisible(false)}
						confirmLoading={isSaving}
						style={{ minWidth: '800px', minHeight: '500px' }}
						closable={false}
					>
						{trigger.fields && (
							<>
								{automation.trigger === 'webhook_received' ? (
									<WebhookFields
										values={automation?.settings || {}}
										onChange={(value) => {
											updateAutomation({
												...automation,
												settings: value,
											});
										}}
									/>
								) : !trigger?.is_form ? (
									<Fields
										fields={trigger.fields}
										values={automation.settings || {}}
										onChange={(value) => {
											updateAutomation({
												...automation,
												settings: value,
											});
										}}
									/>
								) : (
									<FormFields
										values={automation?.settings || {}}
										onChange={(value) => {
											updateAutomation({
												...automation,
												settings: value,
											});
										}}
									/>
								)}
							</>
						)}
						<div style={{ marginTop: 20 }}>
							<Field
								type="switch"
								label={__(
									'Run Multiple Times (If you want to restart the automation for the same contact)',
									'quillcrm'
								)}
								value={automation?.settings?.multiple_runs}
								onChange={(value) => {
									updateSettings('multiple_runs', value);
								}}
							/>
						</div>
					</Modal>
				)}
			</Card>
		</>
	);
};

export default Workflow;
