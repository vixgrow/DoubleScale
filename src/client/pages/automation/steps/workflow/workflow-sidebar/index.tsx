/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useState, useEffect, useRef } from '@wordpress/element';
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
	const noticeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	const closeNotice = () => {
		if (noticeTimeoutRef.current) {
			clearTimeout(noticeTimeoutRef.current);
			noticeTimeoutRef.current = null;
		}
		setNotice(null);
	};

	const showNotice = (nextNotice: NoticeMessage) => {
		if (noticeTimeoutRef.current) {
			clearTimeout(noticeTimeoutRef.current);
			noticeTimeoutRef.current = null;
		}
		setNotice(nextNotice);
		if (nextNotice.type === 'success') {
			noticeTimeoutRef.current = setTimeout(() => {
				setNotice(null);
				noticeTimeoutRef.current = null;
			}, 4000);
		}
	};

	// A save notice belongs to the step that produced it. Switching
	// actions (or to the trigger) must not keep the previous banner.
	useEffect(() => {
		closeNotice();
		// eslint-disable-next-line react-hooks/exhaustive-deps -- only reset on context change
	}, [currentStep?.id, isTriggerVisible]);

	useEffect(() => {
		return () => {
			if (noticeTimeoutRef.current) {
				clearTimeout(noticeTimeoutRef.current);
			}
		};
	}, []);

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
		closeNotice();
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
			const message = __('Invalid step data', 'doublescale');
			showNotice({
				type: 'error',
				message,
			});
			throw new Error(message);
		}

		try {
			const response = (await apiFetch({
				path: `/doublescale/v1/automation-steps/${id}`,
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

			showNotice({ type: 'success', message: successMessage });
		} catch (error: any) {
			// Use utility to extract detailed error message from WordPress REST API
			// This handles validation errors (rest_invalid_param) with detailed params
			const errorMessage = getApiErrorMessage(error, __('Failed to save', 'doublescale'));

			showNotice({
				type: 'error',
				message: errorMessage,
			});

			// Debug log to help troubleshoot error format
			console.error('Save error:', { error, errorMessage });
			throw new Error(errorMessage);
		}
	};

	const handleGoalSave = async (goalKey: string) => {
		if (!currentStep || !goalKey) {
			showNotice({
				type: 'error',
				message: __('Please select a goal', 'doublescale'),
			});
			return;
		}

		try {
			await handleSave({ action: goalKey }, __('Goal saved', 'doublescale'), {
				clearTempAction: true,
			});
		} catch {
			// Notice already shown by handleSave.
		}
	};

	const handleActionSave = async (actionKey: string) => {
		if (!currentStep || !actionKey) {
			showNotice({
				type: 'error',
				message: __('Please select an action', 'doublescale'),
			});
			return;
		}

		try {
			await handleSave(
				{ action: actionKey },
				__('Action saved', 'doublescale'),
				{ clearTempAction: true }
			);
		} catch {
			// Notice already shown by handleSave.
		}
	};

	const handleDelaySave = async (delayKey: string) => {
		if (!currentStep || !delayKey) {
			showNotice({
				type: 'error',
				message: __('Please select a delay type', 'doublescale'),
			});
			return;
		}

		try {
			await handleSave({ action: delayKey }, __('Delay saved', 'doublescale'), {
				clearTempAction: true,
			});
		} catch {
			// Notice already shown by handleSave.
		}
	};

	const handleStepSave = async (stepData: Partial<OrganizedStep>) => {
		if (!stepData.id) {
			const message = __('Invalid step data', 'doublescale');
			showNotice({
				type: 'error',
				message,
			});
			throw new Error(message);
		}

		await handleSave(stepData, __('Step saved', 'doublescale'), {
			stepId: stepData.id,
		});
	};

	const handleConditionSave = async (data: Partial<AutomationStep>) => {
		if (!currentStep) return;

		try {
			await handleSave(
				{ settings: data.settings },
				__('Conditions saved', 'doublescale')
			);
		} catch {
			// Notice already shown by handleSave.
		}
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
						'doublescale-workflow-sidebar absolute left-0 top-0 bottom-0 z-[150400] flex min-h-0 w-[min(100%,26rem)] max-w-[26rem] flex-col rounded-r-2xl border-r border-border/50 bg-card/95 shadow-[16px_0_48px_-20px_rgba(15,23,42,0.18)] backdrop-blur-md',
						isVisible ? 'is-visible' : ''
					)}
				>
					<SidebarHeader
						title={getTitle(isTriggerVisible, currentStep)}
						onClose={handleClose}
					/>

					<div className="flex-1 min-h-0 space-y-4 overflow-y-auto px-6 py-5">
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
