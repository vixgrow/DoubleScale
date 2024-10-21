/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useState, useMemo } from '@wordpress/element';
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
import { isEmpty, filter } from 'lodash';

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
import { Fields } from '@quillcrm/components';
import StepModal from './step-modal';
import AddStep from './add-step';
import { getAction, getGoal, getTrigger } from '@quillcrm/utils';
import WebhookFields from './webhook-fields';
import FormFields from './form-fields';

const Workflow: React.FC = () => {
	const {
		automation,
		steps,
		isLoading,
		updateAutomation,
		saveAutomation,
		isSaving: isSavingAutomation,
		setSteps,
		updatedSteps,
	} = useAutomationContext();
	const [currentStep, setCurrentStep] = useState<OrganizedStep | null>(null);
	const [visible, setVisible] = useState<boolean>(false);
	const [isSaving, setIsSaving] = useState<boolean>(false);
	const { createNotice } = useDispatch('quillcrm/core');
	console.log('updatedSteps', updatedSteps);

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
				const children = filter(newSteps, {
					parent_id: step.parent_id,
				});

				children.forEach((child) => {
					if (child.order > step.order) {
						child.order -= 1;
						updatedOrdersSteps[child.id] = {
							order: child.order - 1,
						};
					}
				});
			} else {
				newSteps.forEach((child) => {
					if (child.order > step.order) {
						child.order -= 1;
						updatedOrdersSteps[child.id] = {
							order: child.order - 1,
						};
					}
				});
			}

			return { updatedOrdersSteps, newSteps };
		};

		const { newSteps, updatedOrdersSteps } = getNewSteps();
		if (step.status === 'draft') {
			const updatedSteps = newSteps.filter((s) => s.id !== step.id);
			setSteps(updatedSteps);
			return;
		}

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
				{step.type !== 'condition' && step.type !== 'end_automation' && (
					<AddStep setStep={setCurrentStep} prevStep={step ?? null} condition={step.condition} parentId={step.parent_id} />
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
			</Card>
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
								style={{ width: '100%' }}
							>
								<div className="qcrm-automation-workflow__item">
									<Card
										className="qcrm-automation-workflow__card"
										hoverable
										onClick={() =>
											!isEmpty(trigger?.fields) &&
											setVisible(true)
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
								<AddStep setStep={setCurrentStep} />
								{organizedSteps.map(renderStep)}
							</Flex>
						</Flex>
					</>
				)}
				{currentStep && (
					<StepModal step={currentStep} setStep={setCurrentStep} />
				)}
				{trigger?.fields && (
					<Modal
						title={__('Trigger', 'quillcrm')}
						open={visible}
						onOk={() => save()}
						onCancel={() => setVisible(false)}
						confirmLoading={isSaving}
						style={{ minWidth: '800px', minHeight: '500px' }}
						closable={false}
					>
						{automation?.trigger !== 'webhook_received' && !trigger?.is_form &&
							automation && (
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
							)}
						{automation?.trigger !== 'webhook_received' && trigger?.is_form && (
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
						{automation?.trigger === 'webhook_received' && (
							<WebhookFields
								values={automation?.settings || {}}
								onChange={(value) => {
									updateAutomation({
										...automation,
										settings: value,
									});
								}}
							/>
						)}
					</Modal>
				)}
			</Card>
		</>
	);
};

export default Workflow;
