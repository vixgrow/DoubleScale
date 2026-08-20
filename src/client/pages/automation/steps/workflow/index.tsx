/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useState, useMemo, useEffect, useRef, useCallback } from '@wordpress/element';
import apiFetch from '@wordpress/api-fetch';
import { useDispatch } from '@wordpress/data';

/**
 * External dependencies
 */
import { cn } from '@/lib/utils';
import { Power, Rocket } from 'lucide-react';
import { isEmpty } from 'lodash';

/**
 * Internal dependencies
 */
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
	automationAlertDialogContentClassName,
	automationModalOverlayClassName,
} from './automation-dialog-presets';
import './style.scss';
import { useAutomationContext } from '../../state/context';
import type {
	AutomationStep,
	OrganizedSteps,
	OrganizedStep,
	Automation,
} from '@doublescale/client';
import AddStep from './add-step';
import { getAction, getGoal, getTrigger } from '@doublescale/utils';
import ReactFlowWorkflow from './reactflow-workflow';
import WorkflowSidebar from './workflow-sidebar';
import {
	ActionIcon,
	ConditionsIcon,
	DeleteIcon,
	GoalIcon,
	TimerBlockIcon,
} from '@doublescale/components';

const Workflow: React.FC = () => {
	const { automation, steps, isLoading, setSteps } = useAutomationContext();
	const [currentStep, setCurrentStep] = useState<OrganizedStep | null>(null);
	const [visible, setVisible] = useState<boolean>(false);
	const useReactFlow = true;
	const suppressStepClickUntilRef = useRef(0);
	const { createNotice, setCurrentTrigger, setFormContext } =
		useDispatch('doublescale/core');

	const suppressWorkflowStepClick = useCallback(() => {
		suppressStepClickUntilRef.current = Date.now() + 800;
	}, []);

	const handleWorkflowStepClick = useCallback(
		(step: OrganizedStep) => {
			if (Date.now() < suppressStepClickUntilRef.current) {
				return;
			}
			setVisible(false);
			setCurrentStep(step);
		},
		[]
	);

	const handleClearWorkflowStep = useCallback(() => {
		suppressWorkflowStepClick();
		setVisible(false);
		setCurrentStep(null);
	}, [suppressWorkflowStepClick]);

	useEffect(() => {
		if (automation) {
			setCurrentTrigger(automation.trigger);

			// Set form context if automation has form data
			if (
				automation.settings?.form_id &&
				automation.settings?.form_type
			) {
				setFormContext({
					formId: automation.settings.form_id,
					triggerId: automation.settings.form_type,
					automationId: automation.id,
					postId: automation.settings.post_id, // For Elementor forms
				});
			}
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

	const trigger = automation ? getTrigger(automation.trigger) : null;
	const typesOptions = {
		action: {
			label: __('Action', 'doublescale'),
			icon: <ActionIcon width={23} height={23} />,
		},
		condition: {
			label: __('Condition', 'doublescale'),
			icon: <ConditionsIcon width={23} height={23} />,
		},
		delay: {
			label: __('Delay', 'doublescale'),
			icon: <TimerBlockIcon width={23} height={23} />,
		},
		goal: {
			label: __('Goal', 'doublescale'),
			icon: <GoalIcon width={23} height={23} />,
		},
		end_automation: {
			label: __('End Automation', 'doublescale'),
			icon: <Power className="w-6 h-6" />,
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
				path: `/doublescale/v1/automation-steps/${step.id}`,
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
			<div key={step.id} className="doublescale-automation-workflow__item">
				<Card className="doublescale-automation-workflow__card hover:bg-accent cursor-pointer transition-colors">
					<CardContent className="p-4">
						<div className="flex justify-between items-center">
							<div
								className="flex gap-2 items-center"
								onClick={() => setStepHandler(step)}
							>
								<div className="doublescale-automation-workflow__card-icon">
									{typesOptions[step.type].icon}
								</div>
								<div className="doublescale-automation-workflow__card-title">
									{label}
									{!step.action &&
										step.type !== 'end_automation' &&
										step.type !== 'condition' && (
											<Badge
												variant="destructive"
												className="mt-1 block"
											>
												{__(
													'Action not set',
													'doublescale'
												)}
											</Badge>
										)}
								</div>
							</div>
							<AlertDialog>
								<AlertDialogTrigger asChild>
									<Button
										variant="ghost"
										size="icon"
										className="text-destructive hover:text-destructive"
									>
										<DeleteIcon />
									</Button>
								</AlertDialogTrigger>
								<AlertDialogContent
									overlayClassName={automationModalOverlayClassName}
									className={cn(automationAlertDialogContentClassName)}
								>
									<AlertDialogHeader>
										<AlertDialogTitle>
											{__(
												'Are you sure?',
												'doublescale'
											)}
										</AlertDialogTitle>
										<AlertDialogDescription>
											{__(
												'This action cannot be undone.',
												'doublescale'
											)}
										</AlertDialogDescription>
									</AlertDialogHeader>
									<AlertDialogFooter>
										<AlertDialogCancel>
											{__('No', 'doublescale')}
										</AlertDialogCancel>
										<AlertDialogAction
											onClick={() => deleteStep(step)}
										>
											{__('Yes', 'doublescale')}
										</AlertDialogAction>
									</AlertDialogFooter>
								</AlertDialogContent>
							</AlertDialog>
						</div>
					</CardContent>
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
					<div className="flex gap-5 mt-2.5">
						<Card className="doublescale-automation-workflow__condition-yes flex-1">
							<CardContent className="p-4">
								<div className="flex flex-col gap-2.5">
									<h4 className="font-semibold">
										{__('Yes', 'doublescale')}
									</h4>
									<AddStep
										setStep={setCurrentStep}
										prevStep={null}
										parentId={step.id}
										condition="yes"
									/>
									{yesChildren.length > 0 &&
										yesChildren.map(renderStep)}
								</div>
							</CardContent>
						</Card>
						<Card className="doublescale-automation-workflow__condition-no flex-1">
							<CardContent className="p-4">
								<div className="flex flex-col gap-2.5">
									<h4 className="font-semibold">
										{__('No', 'doublescale')}
									</h4>
									<AddStep
										setStep={setCurrentStep}
										prevStep={null}
										parentId={step.id}
										condition="no"
									/>
									{noChildren.length > 0 &&
										noChildren.map(renderStep)}
								</div>
							</CardContent>
						</Card>
					</div>
				)}
				{step.type === 'condition' && (
					<AddStep setStep={setCurrentStep} prevStep={step ?? null} />
				)}
			</div>
		);
	};

	return (
		<>
			<div className="relative h-full min-h-0 flex flex-col">
				{isLoading ? (
					<div>
						<div className="animate-pulse space-y-4">
							<div className="h-10 w-full bg-muted rounded"></div>
							<div className="h-32 w-full bg-muted rounded"></div>
						</div>
					</div>
				) : (
					automation && (
						<div
							className={cn(
								'doublescale-automation-workflow flex-1 min-h-0 flex flex-col',
								currentStep || visible ? 'has-sidebar' : ''
							)}
						>
							{useReactFlow ? (
								<ReactFlowWorkflow
									currentStep={currentStep}
									isTriggerVisible={visible}
									isSidebarOpen={
										visible ||
										(currentStep !== null &&
											currentStep.type !==
											'end_automation' &&
											currentStep.type !== 'condition' &&
											(!!currentStep.action ||
												currentStep.type === 'goal' ||
												currentStep.type === 'delay'))
									}
									onStepClick={handleWorkflowStepClick}
									onClearStep={handleClearWorkflowStep}
									onTriggerClick={() => {
										setCurrentStep(null); // Close step sidebar if open
										setVisible(true);
									}}
								/>
							) : (
								<div className="flex flex-col items-center justify-center gap-5 w-full mx-5 mt-5">
									<div className="doublescale-automation-workflow flex flex-col gap-5 w-full">
										<div className="doublescale-automation-workflow__item">
											<Card
												className="doublescale-automation-workflow__card hover:bg-accent cursor-pointer transition-colors"
												onClick={() => setVisible(true)}
											>
												<CardContent className="p-4">
													<div className="flex gap-2 items-center">
														<div className="doublescale-automation-workflow__card-icon">
															<Rocket className="h-4 w-4" />
														</div>
														<div className="doublescale-automation-workflow__card-title">
															{trigger?.label}
														</div>
													</div>
												</CardContent>
											</Card>
										</div>
										<AddStep setStep={setCurrentStep} />
										{organizedSteps.map(renderStep)}
									</div>
								</div>
							)}
						</div>
					)
				)}
				<WorkflowSidebar
					currentStep={currentStep}
					setCurrentStep={setCurrentStep}
					isTriggerVisible={visible}
					setTriggerVisible={setVisible}
				/>
			</div>
		</>
	);
};

export default Workflow;
