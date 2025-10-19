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
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Internal dependencies
 */
import './style.scss';
import { useAutomationContext } from '../../../state/context';
import type { OrganizedStep, AutomationStep } from '@quillcrm/client';
import StepFieldsModal from '../step-fields-modal';
import ActionSelector from '../action-selector';
import ConditionsModal from '../conditions-modal';
import ConfigAPI from '@quillcrm/config';
import type { GoalsGroup } from '@quillcrm/config';
import { map } from 'lodash';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import WebhookFields from '../webhook-fields';
import FormFields from '../form-fields';
import Fields from '@/components/fields';
import { Field } from '@quillcrm/components';
import { getTrigger } from '@quillcrm/utils';

interface WorkflowSidebarProps {
	currentStep: OrganizedStep | null;
	setCurrentStep: (step: OrganizedStep | null) => void;
	isTriggerVisible: boolean;
	setTriggerVisible: (visible: boolean) => void;
}

const WorkflowSidebar: React.FC<WorkflowSidebarProps> = ({
	currentStep,
	setCurrentStep,
	isTriggerVisible,
	setTriggerVisible,
}) => {
	const { automation, updateAutomation, updateSettings, updateStep } =
		useAutomationContext();
	const trigger = automation ? getTrigger(automation.trigger) : null;
	console.log(automation);
	const [tempAction, setTempAction] = useState<string>('');
	const { createNotice } = useDispatch('quillcrm/core');

	// Only show sidebar for trigger, configured steps, unconfigured goals, or delay steps
	// Exclude conditions and end_automation (they don't need configuration)
	const isVisible =
		isTriggerVisible ||
		(currentStep !== null &&
			currentStep.type !== 'end_automation' &&
			(currentStep.action ||
				currentStep.type === 'goal' ||
				currentStep.type === 'delay'));

	const findActionLabel = (actionKey: string): string | null => {
		const automationActions = ConfigAPI.getAutomationActions();
		for (const category of Object.values(automationActions)) {
			for (const group of Object.values(category.groups)) {
				if (group.actions?.[actionKey]) {
					return group.actions[actionKey].label;
				}
			}
		}
		return null;
	};

	const findGoalLabel = (goalKey: string): string | null => {
		const automationGoals = ConfigAPI.getAutomationGoals();
		for (const category of Object.values(automationGoals)) {
			if (category.groups) {
				for (const group of Object.values(category.groups)) {
					if (group.goals?.[goalKey]) {
						return group.goals[goalKey].label;
					}
				}
			}
		}
		return null;
	};

	const titleMap: Record<string, () => string> = {
		action: () =>
			currentStep?.action
				? findActionLabel(currentStep.action) ||
					__('Action Settings', 'quillcrm')
				: __('Action Settings', 'quillcrm'),
		goal: () =>
			currentStep?.action
				? findGoalLabel(currentStep.action) ||
					__('Goal Settings', 'quillcrm')
				: __('Goal Settings', 'quillcrm'),
		condition: () => __('Condition Settings', 'quillcrm'),
		delay: () => __('Delay', 'quillcrm'),
	};

	const getTitle = () => {
		if (isTriggerVisible) return __('Trigger Settings', 'quillcrm');
		if (!currentStep) return '';

		const getTitleFn = titleMap[currentStep.type];
		return getTitleFn ? getTitleFn() : '';
	};

	const handleClose = () => {
		if (isTriggerVisible) {
			setTriggerVisible(false);
		} else {
			setCurrentStep(null);
		}
		setTempAction('');
	};

	const handleActionChange = (value: string) => {
		setTempAction(value);
	};

	const handleGoalChange = (value: string) => {
		setTempAction(value);
	};

	const handleGoalSave = async () => {
		if (!currentStep || !tempAction) {
			createNotice({
				type: 'error',
				message: __('Please select a goal', 'quillcrm'),
			});
			return;
		}

		try {
			const response = (await apiFetch({
				path: `/qc/v1/automation-steps/${currentStep.id}`,
				method: 'POST',
				data: {
					...currentStep,
					action: tempAction,
					status: 'active',
				},
			})) as AutomationStep;

			const organizedStep = {
				...response,
				children: currentStep.children,
			} as OrganizedStep;

			updateStep(response.id, response);
			setCurrentStep(organizedStep);
			setTempAction('');

			createNotice({
				type: 'success',
				message: __('Goal saved', 'quillcrm'),
			});
		} catch (error: any) {
			createNotice({
				type: 'error',
				message: error.message || __('Failed to save goal', 'quillcrm'),
			});
		}
	};

	const renderGoalSelector = () => {
		const automationGoals = ConfigAPI.getAutomationGoals();

		console.log(automationGoals);

		const GoalsGroupRender: React.FC<{
			groups: GoalsGroup[];
		}> = ({ groups }) => {
			return (
				<div className="flex flex-col gap-5">
					{map(groups, (group, key) => (
						<div key={key} className="qcrm-automation-goals-group">
							<p className="qcrm-automation-goals-group__label font-semibold mb-3">
								{group.label}
							</p>
							<div className="qcrm-automation-goals-group__goals flex flex-wrap gap-2.5">
								{map(group.goals, (action, actionKey) => {
									return (
										<Button
											key={actionKey}
											onClick={() =>
												handleGoalChange(actionKey)
											}
											variant={
												tempAction === actionKey
													? 'default'
													: 'outline'
											}
										>
											{action.label}
										</Button>
									);
								})}
							</div>
						</div>
					))}
				</div>
			);
		};

		return (
			<div className="py-4">
				<Tabs defaultValue="0" orientation="vertical">
					{map(automationGoals, (goal, index) => (
						<div key={index}>
							<TabsList>
								<TabsTrigger value={index.toString()}>
									{goal.label}
								</TabsTrigger>
							</TabsList>
							<TabsContent value={index.toString()}>
								<GoalsGroupRender groups={goal.groups} />
							</TabsContent>
						</div>
					))}
				</Tabs>
				<div className="mt-4">
					<Button
						onClick={handleGoalSave}
						disabled={!tempAction}
						className="w-full"
					>
						{__('Save Goal', 'quillcrm')}
					</Button>
				</div>
			</div>
		);
	};

	const handleActionSave = async () => {
		if (!currentStep || !tempAction) {
			createNotice({
				type: 'error',
				message: __('Please select an action', 'quillcrm'),
			});
			return;
		}

		try {
			const response = (await apiFetch({
				path: `/qc/v1/automation-steps/${currentStep.id}`,
				method: 'POST',
				data: {
					...currentStep,
					action: tempAction,
					status: 'active',
				},
			})) as AutomationStep;

			const organizedStep = {
				...response,
				children: currentStep.children,
			} as OrganizedStep;

			updateStep(response.id, response);
			setCurrentStep(organizedStep);
			setTempAction('');

			createNotice({
				type: 'success',
				message: __('Action saved', 'quillcrm'),
			});
		} catch (error: any) {
			createNotice({
				type: 'error',
				message:
					error.message || __('Failed to save action', 'quillcrm'),
			});
		}
	};

	const handleStepSave = async (stepData: Partial<OrganizedStep>) => {
		if (!stepData.id) {
			createNotice({
				type: 'error',
				message: __('Invalid step data', 'quillcrm'),
			});
			return;
		}

		try {
			const response = (await apiFetch({
				path: `/qc/v1/automation-steps/${stepData.id}`,
				method: 'POST',
				data: {
					...stepData,
					status: 'active',
				},
			})) as AutomationStep;

			const organizedStep = {
				...response,
				children: currentStep?.children,
			} as OrganizedStep;

			updateStep(response.id, response);
			setCurrentStep(organizedStep);

			createNotice({
				type: 'success',
				message: __('Step saved', 'quillcrm'),
			});
		} catch (error: any) {
			createNotice({
				type: 'error',
				message: error.message || __('Failed to save step', 'quillcrm'),
			});
		}
	};

	const getTriggerFieldsComponent = () => {
		const triggerFieldTypeMap: Record<string, JSX.Element> = {
			webhook_received: (
				<WebhookFields
					values={automation?.settings || {}}
					onChange={(value) => {
						updateAutomation({
							...automation!,
							settings: value,
						});
					}}
				/>
			),
		};

		if (automation?.trigger && triggerFieldTypeMap[automation.trigger]) {
			return triggerFieldTypeMap[automation.trigger];
		}

		return trigger?.is_form ? (
			<FormFields
				values={automation?.settings || {}}
				onChange={(value) => {
					updateAutomation({
						...automation!,
						settings: value,
					});
				}}
			/>
		) : (
			<Fields
				fields={trigger!.fields!}
				values={automation?.settings || {}}
				onChange={(value) => {
					updateAutomation({
						...automation!,
						settings: value,
					});
				}}
			/>
		);
	};

	const renderTriggerContent = () => {
		if (!automation || !trigger) return null;

		return (
			<div className="flex flex-col h-full">
				<div className="qcrm-workflow-sidebar__fields-container max-h-[55vh] overflow-y-auto">
					{trigger.fields && getTriggerFieldsComponent()}
				</div>
				<div className="mt-5 pt-5 border-t bg-white">
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
			</div>
		);
	};

	const renderActionSelector = () => (
		<ActionSelector
			value={tempAction}
			visible={true}
			onClose={() => {
				setCurrentStep(null);
				setTempAction('');
			}}
			onChange={handleActionChange}
			onSave={handleActionSave}
		/>
	);

	const renderStepFieldsModal = () => (
		<StepFieldsModal
			step={currentStep!}
			setStep={setCurrentStep}
			saveStep={handleStepSave}
		/>
	);

	const renderConditionModal = () => (
		<ConditionsModal
			step={currentStep!}
			onSave={() => {}}
			visible={true}
			onClose={() => setCurrentStep(null)}
		/>
	);

	// Component map for unconfigured steps (no action selected)
	const unconfiguredStepRenderers: Record<string, () => JSX.Element | null> =
		{
			action: renderActionSelector,
			goal: renderGoalSelector,
		};

	// Component map for configured steps (action already selected)
	const configuredStepRenderers: Record<string, () => JSX.Element | null> = {
		action: renderStepFieldsModal,
		goal: renderStepFieldsModal,
		delay: renderStepFieldsModal,
		condition: renderConditionModal,
	};

	const renderContent = () => {
		// Close any other open sidebars first
		if (isTriggerVisible && currentStep) {
			setCurrentStep(null);
		} else if (!isTriggerVisible && currentStep?.type === 'trigger') {
			setTriggerVisible(false);
		}

		// Render trigger content
		if (isTriggerVisible) {
			return renderTriggerContent();
		}

		// Early returns for edge cases
		if (!currentStep) return null;
		if (currentStep.type === 'end_automation') return null;

		// Render based on whether step has action configured
		const hasAction = currentStep.action || currentStep.type === 'delay';
		const rendererMap = hasAction
			? configuredStepRenderers
			: unconfiguredStepRenderers;
		const renderer = rendererMap[currentStep.type];

		return renderer ? renderer() : null;
	};

	// Determine rendering mode: modal, action-selector, or sidebar
	const shouldRenderAsModal = currentStep?.type === 'condition';
	const shouldRenderAsActionSelector =
		currentStep && !currentStep.action && currentStep.type === 'action';

	// Render condition as standalone modal (no sidebar)
	if (shouldRenderAsModal) {
		return renderConditionModal();
	}

	// Render unconfigured action as standalone action selector (no sidebar)
	if (shouldRenderAsActionSelector) {
		return renderActionSelector();
	}

	// Render sidebar for trigger and configured steps
	return (
		<div
			className={cn(
				'qcrm-workflow-sidebar absolute top-1 right-0 h-screen w-80 rounded-l-lg z-[150400] overflow-y-auto',
				isVisible ? 'is-visible' : ''
			)}
		>
			<div className="flex items-center justify-between border-b-2 px-4 pt-5 pb-4">
				<h3 className="text-base font-semibold text-[#333333]">
					{getTitle()}
				</h3>
				<Button variant="ghost" size="sm" onClick={handleClose}>
					<X className="h-4 w-4" />
				</Button>
			</div>

			<div className="space-y-4 p-4 h-[calc(100vh-4rem)] overflow-y-auto">
				{renderContent()}
			</div>
		</div>
	);
};

export default WorkflowSidebar;
