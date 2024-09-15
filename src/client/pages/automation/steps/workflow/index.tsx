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
import { Card, Flex, Modal, Switch, Tag, Typography } from 'antd';
import {
	TrophyOutlined,
	BranchesOutlined,
	DisconnectOutlined,
	RocketOutlined,
	ThunderboltOutlined,
} from '@ant-design/icons';
import { isEmpty } from 'lodash';

/**
 * Internal dependencies
 */
import './style.scss';
import { useAutomationContext } from '../../state/context';
import type { AutomationStep } from '@quillcrm/client';
import { Fields } from '@quillcrm/components';
import StepModal from './step-modal';
import AddStep from './add-step';
import { getAction, getGoal, getTrigger } from '@quillcrm/utils';

const Workflow: React.FC = () => {
	const {
		automation,
		steps,
		isLoading,
		updateAutomation,
		saveAutomation,
		isSaving: isSavingAutomation,
	} = useAutomationContext();
	const [currentStep, setCurrentStep] = useState<AutomationStep | null>(null);
	const [visible, setVisible] = useState<boolean>(false);
	const [isSaving, setIsSaving] = useState<boolean>(false);
	const { createNotice } = useDispatch('quillcrm/core');

	const processSteps = (
		parentId: number | string,
		steps: AutomationStep[]
	): AutomationStep[] => {
		return steps
			.filter((step) => step.parent_id == parentId)
			.map((step) => ({
				...step,
				children: processSteps(step.id, steps),
			}));
	};

	const organizedSteps = useMemo(() => {
		return processSteps('0', steps);
	}, [steps]);

	const organizeChildrenByCondition = (children: AutomationStep[]) => {
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

	const renderStep = (step: any) => {
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

		const setStepHandler = (step: AutomationStep) => {
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
					onClick={() => setStepHandler(step)}
				>
					<Flex gap={10}>
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
				{step.type === 'condition' && (
					<Flex gap={20} style={{ marginTop: 10 }}>
						<Card
							className="qcrm-automation-workflow__condition-yes"
							style={{ flex: 1 }}
						>
							<Flex vertical gap={10}>
								<h4>{__('Yes', 'quillcrm')}</h4>
								{yesChildren.length > 0 &&
									yesChildren.map(renderStep)}
								<AddStep
									setStep={setCurrentStep}
									parentId={step.id}
									condition="yes"
								/>
							</Flex>
						</Card>
						<Card
							className="qcrm-automation-workflow__condition-no"
							style={{ flex: 1 }}
						>
							<Flex vertical gap={10}>
								<h4>{__('No', 'quillcrm')}</h4>
								{noChildren.length > 0 &&
									noChildren.map(renderStep)}
								<AddStep
									setStep={setCurrentStep}
									parentId={step.id}
									condition="no"
								/>
							</Flex>
						</Card>
					</Flex>
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
								{organizedSteps.map(renderStep)}
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
		</>
	);
};

export default Workflow;
