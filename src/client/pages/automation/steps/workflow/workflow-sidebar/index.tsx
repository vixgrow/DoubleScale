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
import { cn } from '@/lib/utils';

/**
 * Internal dependencies
 */
import './style.scss';
import { useAutomationContext } from '../../../state/context';
import type { OrganizedStep, AutomationStep } from '@quillcrm/client';
import { getTitle } from './titles';
import SidebarHeader from './sidebar-header';
import TriggerContent from './trigger-content';
import ConditionsModal from '../conditions-modal';
import StepFieldsModal from '../step-fields-modal';
import ActionSelector from '../action-selector';
import GoalSelector from '../goal-selector';

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

	// Generic save handler to reduce code duplication
	const handleSave = async (
		updates: Partial<AutomationStep>,
		successMessage: string,
		options: { clearTempAction?: boolean; stepId?: number } = {}
	) => {
		const { clearTempAction = false, stepId } = options;
		const id = stepId || currentStep?.id;

		if (!id) {
			createNotice({
				type: 'error',
				message: __('Invalid step data', 'quillcrm'),
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

			createNotice({
				type: 'success',
				message: successMessage,
			});
		} catch (error: any) {
			createNotice({
				type: 'error',
				message: error.message || __('Failed to save', 'quillcrm'),
			});
		}
	};

	const handleGoalSave = async (goalKey: string) => {
		if (!currentStep || !goalKey) {
			createNotice({
				type: 'error',
				message: __('Please select a goal', 'quillcrm'),
			});
			return;
		}

		await handleSave(
			{ action: goalKey },
			__('Goal saved', 'quillcrm'),
			{ clearTempAction: true }
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

		await handleSave(
			{ action: tempAction },
			__('Action saved', 'quillcrm'),
			{ clearTempAction: true }
		);
	};

	const handleStepSave = async (stepData: Partial<OrganizedStep>) => {
		if (!stepData.id) {
			createNotice({
				type: 'error',
				message: __('Invalid step data', 'quillcrm'),
			});
			return;
		}

		await handleSave(
			stepData,
			__('Step saved', 'quillcrm'),
			{ stepId: stepData.id }
		);
	};

	const handleConditionSave = async (data: Partial<AutomationStep>) => {
		if (!currentStep) return;

		await handleSave(
			{ settings: data.settings },
			__('Conditions saved', 'quillcrm')
		);
	};

	const renderContent = () => {
		// Close any other open sidebars first
		isTriggerVisible && currentStep && setCurrentStep(null);
		!isTriggerVisible && currentStep?.type === 'trigger' && setTriggerVisible(false);

		// Content renderers configuration map
		const contentRenderers = {
			// Trigger content
			trigger: () => automation && (
				<TriggerContent
					automation={automation}
					onSettingsChange={(value) => updateAutomation({ ...automation, settings: value })}
					onMultipleRunsChange={(value) => updateSettings('multiple_runs', value)}
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
				default: () => null,
			},

			// Configured steps (action already selected)
			configured: {
				condition: () => (
					<ConditionsModal
						step={currentStep!}
						onSave={handleConditionSave}
						visible={true}
						onClose={() => setCurrentStep(null)}
					/>
				),
				default: () => (
					<StepFieldsModal
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
		const hasAction = currentStep.action || currentStep.type === 'delay';
		const category = hasAction ? 'configured' : 'unconfigured';
		const renderer = contentRenderers[category][currentStep.type] ||
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
		<div
			className={cn(
				'qcrm-workflow-sidebar absolute top-1 right-0 h-screen w-80 rounded-l-lg z-[150400] overflow-y-auto',
				isVisible ? 'is-visible' : ''
			)}
		>
			<SidebarHeader
				title={getTitle(isTriggerVisible, currentStep)}
				onClose={handleClose}
			/>

			<div className="space-y-4 p-4 h-[calc(100vh-4rem)] overflow-y-auto">
				{renderContent()}
			</div>
		</div>
	);
};

export default WorkflowSidebar;