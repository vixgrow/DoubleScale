/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useState, useEffect } from '@wordpress/element';
import apiFetch from '@wordpress/api-fetch';

/**
 * External dependencies
 */
import { cn } from '@/lib/utils';

/**
 * Internal dependencies
 */
import './style.scss';
import { useAutomationContext } from '../../../state/context';
import type {
	OrganizedStep,
	AutomationStep,
	NoticeMessage,
} from '@doublescale/client';
import { getTitle } from './titles';
import SidebarHeader from './sidebar-header';
import TriggerContent from './trigger-content';
import ConditionsModal from '../conditions-modal';
import StepFieldsModal from '../step-fields-modal';
import ActionSelector from '../action-selector';
import GoalSelector from '../goal-selector';
import DelaySelector from '../delay-selector';
import { NoticeBanner } from '@doublescale/components';
import ProAutomationModal from '../../../../../../components/pro-automation-modal';
import {
	SidebarLayoutProvider,
	SidebarFooter,
} from './sidebar-layout-context';
import { applyFilters } from '@wordpress/hooks';
import { getApiErrorMessage } from '@doublescale/utils';

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
	const { automation, updateAutomation, updateSettings, updateStep, steps } =
		useAutomationContext();
	const [tempAction, setTempAction] = useState<string>('');
	const [notice, setNotice] = useState<NoticeMessage | null>(null);
	const closeNotice = () => setNotice(null);

	const isProActive = applyFilters(
		'doublescale_is_pro_active',
		false
	) as boolean;

	const [showProConditionModal, setShowProConditionModal] = useState(false);

	// Close sidebar if the current step has been deleted
	useEffect(() => {
		if (currentStep && currentStep.id) {
			// Check if the current step still exists in the steps array
			const stepExists = steps.some((step) => step.id === currentStep.id);
			if (!stepExists) {
				// Step was deleted, close the sidebar
				setCurrentStep(null);
			}
		}
	}, [steps, currentStep, setCurrentStep]);

	// Show Pro modal when condition step is clicked and it's locked
	useEffect(() => {
		if (currentStep && currentStep.type === 'condition' && !isProActive) {
			setShowProConditionModal(true);
			// Close the current step to prevent sidebar from showing
			setCurrentStep(null);
		}
	}, [currentStep, isProActive]);

	// Only show sidebar for trigger, configured steps, unconfigured goals, or delay steps
	// Exclude conditions and end_automation (they don't need configuration)
	const isVisible =
		isTriggerVisible ||
		(currentStep !== null &&
			currentStep.type !== 'end_automation' &&
			(currentStep.action ||
				currentStep.type === 'goal' ||
				currentStep.type === 'delay'));

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

	const handleDelayChange = (value: string) => {
		setTempAction(value);
	};

	// Generic save handler to reduce code duplication
	const handleSave = async (
		updates: Partial<AutomationStep>,
		successMessage: string,
		options: { clearTempAction?: boolean; stepId?: number } = {}
	) => {
		const { clearTempAction = false, stepId } = options;
		const id = stepId || currentStep?.id;

		if (!id) {
			setNotice({
				type: 'error',
				message: __('Invalid step data', 'doublescale'),
			});
			return;
		}

		try {
			const response = (await apiFetch({
				path: `/qc/v1/automation-steps/${id}`,
				method: 'POST',
				data: {
					...currentStep,
					...updates,
					status: 'active',
				},
			})) as AutomationStep;

			const organizedStep = {
				...response,
				children: currentStep?.children,
			} as OrganizedStep;

			updateStep(response.id, response);
			setCurrentStep(organizedStep);

			if (clearTempAction) {
				setTempAction('');
			}

			setNotice({ type: 'success', message: successMessage });
		} catch (error: any) {
			// Use utility to extract detailed error message from WordPress REST API
			// This handles validation errors (rest_invalid_param) with detailed params
			const errorMessage = getApiErrorMessage(error, __('Failed to save', 'doublescale'));

			setNotice({
				type: 'error',
				message: errorMessage,
			});

			// Debug log to help troubleshoot error format
			console.error('Save error:', { error, errorMessage });
		}
	};

	const handleGoalSave = async (goalKey: string) => {
		if (!currentStep || !goalKey) {
			setNotice({
				type: 'error',
				message: __('Please select a goal', 'doublescale'),
			});
			return;
		}

		await handleSave({ action: goalKey }, __('Goal saved', 'doublescale'), {
			clearTempAction: true,
		});
	};

	const handleActionSave = async (actionKey: string) => {
		if (!currentStep || !actionKey) {
			setNotice({
				type: 'error',
				message: __('Please select an action', 'doublescale'),
			});
			return;
		}

		await handleSave(
			{ action: actionKey },
			__('Action saved', 'doublescale'),
			{ clearTempAction: true }
		);
	};

	const handleDelaySave = async (delayKey: string) => {
		if (!currentStep || !delayKey) {
			setNotice({
				type: 'error',
				message: __('Please select a delay type', 'doublescale'),
			});
			return;
		}

		await handleSave({ action: delayKey }, __('Delay saved', 'doublescale'), {
			clearTempAction: true,
		});
	};

	const handleStepSave = async (stepData: Partial<OrganizedStep>) => {
		if (!stepData.id) {
			setNotice({
				type: 'error',
				message: __('Invalid step data', 'doublescale'),
			});
			return;
		}

		await handleSave(stepData, __('Step saved', 'doublescale'), {
			stepId: stepData.id,
		});
	};

	const handleConditionSave = async (data: Partial<AutomationStep>) => {
		if (!currentStep) return;

		await handleSave(
			{ settings: data.settings },
			__('Conditions saved', 'doublescale')
		);
	};

	const renderContent = () => {
		// Close any other open sidebars first
		isTriggerVisible && currentStep && setCurrentStep(null);
		!isTriggerVisible &&
			currentStep?.type === 'trigger' &&
			setTriggerVisible(false);

		// Content renderers configuration map
		const contentRenderers = {
			// Trigger content
			trigger: () =>
				automation && (
					<TriggerContent
						automation={automation}
						onSettingsChange={(value) =>
							updateAutomation({ ...automation, settings: value })
						}
						onMultipleRunsChange={(value) =>
							updateSettings('multiple_runs', value)
						}
					/>
				),

			// Unconfigured steps (no action selected)
			unconfigured: {
				action: () => (
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
				),
				goal: () => (
					<GoalSelector
						value={tempAction}
						onChange={handleGoalChange}
						onSave={handleGoalSave}
					/>
				),
				delay: () => (
					<DelaySelector
						value={tempAction}
						onChange={handleDelayChange}
						onSave={handleDelaySave}
					/>
				),
				default: () => null,
			},

			// Configured steps (action already selected)
			configured: {
				condition: () => (
					<ConditionsModal
						key={currentStep!.id}
						step={currentStep!}
						onSave={handleConditionSave}
						visible={isProActive}
						onClose={() => setCurrentStep(null)}
					/>
				),
				default: () => (
					<StepFieldsModal
						key={currentStep!.id}
						step={currentStep!}
						setStep={setCurrentStep}
						saveStep={handleStepSave}
					/>
				),
			},
		};

		// Render trigger content
		if (isTriggerVisible) return contentRenderers.trigger();

		// Early returns for edge cases
		if (!currentStep || currentStep.type === 'end_automation') return null;

		// Determine renderer based on step configuration
		const requiresSelection = ['action', 'goal', 'delay'];
		const hasAction =
			!requiresSelection.includes(currentStep.type) ||
			!!currentStep.action;
		const category = hasAction ? 'configured' : 'unconfigured';
		const renderer =
			contentRenderers[category][currentStep.type] ||
			contentRenderers[category].default;

		return renderer?.() || null;
	};

	// Render standalone modals/selectors without sidebar wrapper
	const isStandalone =
		currentStep?.type === 'condition' ||
		(currentStep && !currentStep.action && currentStep.type === 'action');

	if (isStandalone) return renderContent();

	// Render content within sidebar wrapper
	return (
		<>
			<SidebarLayoutProvider>
				<div
					className={cn(
						'doublescale-workflow-sidebar absolute top-0 right-0 bottom-0 w-96 rounded-l-lg z-[150400] flex flex-col min-h-0',
						isVisible ? 'is-visible' : ''
					)}
				>
					<SidebarHeader
						title={getTitle(isTriggerVisible, currentStep)}
						onClose={handleClose}
					/>

					<div className="flex-1 min-h-0 overflow-y-auto space-y-4 p-4">
						{notice && (
							<NoticeBanner
								notice={notice}
								closeNotice={closeNotice}
							/>
						)}
						{renderContent()}
					</div>

					<SidebarFooter />
				</div>
			</SidebarLayoutProvider>

			<ProAutomationModal
				visible={showProConditionModal}
				onClose={() => setShowProConditionModal(false)}
				featureName={__('Condition Step', 'doublescale')}
			/>
		</>
	);
};

export default WorkflowSidebar;
