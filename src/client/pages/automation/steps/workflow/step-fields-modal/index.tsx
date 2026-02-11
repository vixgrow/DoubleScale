/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useState, useEffect, useLayoutEffect, useRef, useCallback } from '@wordpress/element';
import { useDispatch } from '@wordpress/data';

/**
 * External dependencies
 */
import { BarChart3, AlertTriangle, CheckCircle } from 'lucide-react';

/**
 * Internal dependencies
 */
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import './style.scss';
import type { OrganizedStep } from '@quillcrm/client';
import { Fields } from '@quillcrm/components';
import { getAction, getGoal } from '@quillcrm/utils';
import { getToLink, useNavigate } from '@quillcrm/navigation';
import ConfigAPI from '@quillcrm/config';
import { useAutomationContext } from '../../../state/context';
import { deleteStep } from '../reactflow-workflow/utils/step-utils';
import { useProviderStatus } from '@/hooks/use-provider-status';
import { ProviderNotConnectedWarning } from '@/client/pages/contact/components/provider-not-connected-warning';
import TwilioConfigModal from '@/client/pages/contact/components/twilio-config-modal';
import AnalyticsPopup from '../reactflow-workflow/components/analytics-popup';
import { useStepAnalytics } from '../reactflow-workflow/hooks/use-step-analytics';
import {
	supportsAnalytics,
	getChannelType,
} from '../reactflow-workflow/constants/action-types';
import { useSidebarLayout } from '../workflow-sidebar/sidebar-layout-context';

interface StepFieldsModalProps {
	step: OrganizedStep;
	setStep: (step: OrganizedStep | null) => void;
	saveStep: (step: Partial<OrganizedStep>) => void;
}

const StepFieldsModal: React.FC<StepFieldsModalProps> = ({
	step,
	setStep,
	saveStep,
}) => {
	const sidebarLayout = useSidebarLayout();
	const setFooterRef = useRef(sidebarLayout?.setFooter);
	setFooterRef.current = sidebarLayout?.setFooter;
	const [isSaving, setIsSaving] = useState(false);
	const [isDeleting, setIsDeleting] = useState(false);
	const [settings, setSettings] = useState(step.settings);
	const [showTwilioConfig, setShowTwilioConfig] = useState(false);
	const [showMergeTagNotice, setShowMergeTagNotice] = useState(false);
	const navigate = useNavigate();
	const { setMergeTagsVisible, setMergeTagCallback, createNotice } =
		useDispatch('quillcrm/core');
	const { steps, setSteps } = useAutomationContext();

	// Determine if this is a messaging action that requires provider
	const actionKey =
		step.type === 'delay'
			? step.action || 'delay'
			: step.action;
	const isSmsAction = actionKey === 'send_sms';
	const isWhatsAppAction = actionKey === 'send_whatsapp';
	const requiresProvider = isSmsAction || isWhatsAppAction;
	const channel = isSmsAction ? 'sms' : isWhatsAppAction ? 'whatsapp' : null;

	// Check provider status for SMS/WhatsApp actions (non-blocking)
	const {
		isConnected,
		isLoading: providerLoading,
		checkStatus,
	} = useProviderStatus(
		channel || 'sms' // Default to 'sms' if not a messaging action (hook always needs a value)
	);

	// Use custom analytics hook
	const {
		analyticsData,
		isLoading: isLoadingAnalytics,
		isVisible: analyticsVisible,
		fetchAnalytics,
		hideAnalytics,
	} = useStepAnalytics();

	// Sync settings when step.settings changes
	// This ensures we load the latest settings from the parent
	useEffect(() => {
		setSettings(step.settings || {});
	}, [step.settings]);

	const handleSave = useCallback(async () => {
		setIsSaving(true);

		const newStep = {
			...step,
			settings: {
				...step.settings, // Preserve existing settings (template_ids, etc.)
				...settings, // Merge with updated form values
			},
		};
		await saveStep(newStep);

		setIsSaving(false);
	}, [step, settings, saveStep]);

	const handleDelete = useCallback(async () => {
		setIsDeleting(true);
		await deleteStep(step.id.toString(), steps, setSteps, createNotice);
		setIsDeleting(false);
		setStep(null); // Close the modal after deletion
	}, [step.id, steps, setSteps, createNotice, setStep]);

	// Register footer in sidebar so scroll is between header and buttons (footer fixed at bottom)
	// Use ref for setFooter to avoid infinite loop (context value changes when footer updates)
	useLayoutEffect(() => {
		const setFooter = setFooterRef.current;
		if (!setFooter) return;
		setFooter(
			<div className="flex items-center justify-between gap-2">
				<Button
					onClick={handleSave}
					disabled={isSaving || isDeleting}
					variant="gradient"
					className="w-full"
					size="lg"
				>
					{isSaving
						? __('Saving...', 'quillcrm')
						: __('Save Changes', 'quillcrm')}
				</Button>
				<Button
					onClick={handleDelete}
					disabled={isSaving || isDeleting}
					variant="outline"
					className="w-full text-destructive border-destructive hover:text-destructive"
					size="lg"
				>
					{isDeleting
						? __('Deleting...', 'quillcrm')
						: __('Delete', 'quillcrm')}
				</Button>
			</div>
		);
		return () => setFooter(null);
	}, [isSaving, isDeleting, handleSave, handleDelete]);

	const handleMergeTagsClick = () => {
		setMergeTagCallback((tagValue: string) => {
			navigator.clipboard.writeText(tagValue);
			// Show local notice banner
			setShowMergeTagNotice(true);
			// Auto-hide after 3 seconds
			setTimeout(() => {
				setShowMergeTagNotice(false);
			}, 5000);
			// Also create global notice
			createNotice({
				type: 'success',
				message: __(
					'Merge tag copied to clipboard. You can now paste it in any field.',
					'quillcrm'
				),
			});
		});
		setMergeTagsVisible(true);
	};

	// Check if this step supports analytics
	const hasAnalytics = supportsAnalytics(step.action);
	const action =
		step.type === 'action' || step.type === 'delay'
			? getAction(actionKey)
			: getGoal(step.action);

	// Check if this is a delay step
	const isDelayStep = step.type === 'delay';

	// Check if this is a CRM contact action
	const isContactInCrmAction = (() => {
		if (step.type !== 'action') {
			return false;
		}
		const automationActions = ConfigAPI.getAutomationActions();
		return (
			automationActions?.crm?.groups?.contact?.actions?.[actionKey] !==
			undefined
		);
	})();

	// Hide merge tags button for delay steps or CRM contact actions
	const shouldHideMergeTags = isDelayStep || isContactInCrmAction;

	// Check if action/goal has plugin dependency warning
	const hasActionWarning =
		step.type === 'goal'
			? step.settings?._goal_warning
			: step.settings?._action_warning;
	const actionLabel =
		step.type === 'goal'
			? step.settings?._goal_label || step.action
			: step.settings?._action_label || step.action;

	// If there's an action/goal warning, show only the warning
	if (hasActionWarning) {
		const warningMessage =
			step.type === 'goal'
				? step.settings?._goal_warning_message ||
				__(
					'Goal requires a plugin that is not currently active.',
					'quillcrm'
				)
				: step.settings?._action_warning_message ||
				__(
					'Action requires a plugin that is not currently active.',
					'quillcrm'
				);
		const labelText =
			step.type === 'goal'
				? __('Goal:', 'quillcrm')
				: __('Action:', 'quillcrm');

		return (
			<div className="qcrm-step-fields-content flex flex-col">
				<Alert
					variant="destructive"
					className="border-orange-500 bg-orange-50"
				>
					<AlertTriangle className="h-4 w-4 text-orange-600" />
					<AlertDescription className="text-sm text-orange-800">
						{warningMessage}
						<span className="block mt-1 font-medium">
							{labelText} {actionLabel}
						</span>
					</AlertDescription>
				</Alert>

				<div className="space-y-4 mt-4">
					<Button
						onClick={handleDelete}
						disabled={isDeleting}
						variant="outline"
						className="w-full text-destructive border-destructive hover:text-destructive"
						size="lg"
					>
						{isDeleting
							? __('Deleting...', 'quillcrm')
							: __('Delete', 'quillcrm')}
					</Button>
				</div>
			</div>
		);
	}

	return (
		<div className="qcrm-step-fields-content flex flex-col min-h-0">
			{/* Provider not configured warning for SMS/WhatsApp actions (non-blocking) */}
			{/* SMS: Open quick Twilio config modal */}
			{/* WhatsApp: Navigate to integrations page (supports Twilio and Meta WhatsApp) */}
			{requiresProvider &&
				!isConnected &&
				!providerLoading &&
				channel && (
					<div className="mb-4">
						<ProviderNotConnectedWarning
							channel={channel}
							onConfigureClick={() => {
								if (channel === 'whatsapp') {
									navigate(getToLink('integrations/meta-whatsapp'));
								} else {
									setShowTwilioConfig(true);
								}
							}}
						/>
					</div>
				)}

			{!shouldHideMergeTags && (
				<>
					<Button
						onClick={handleMergeTagsClick}
						disabled={isSaving || isDeleting}
						variant="secondaryDeepBlue"
						className="w-full mb-4"
						size="lg"
					>
						{__('Merge Tags', 'quillcrm')}
					</Button>
					{showMergeTagNotice && (
						<Alert className="mb-4 border-green-500 bg-green-50">
							<CheckCircle className="h-4 w-4 text-green-600" />
							<AlertDescription className="text-sm text-green-800">
								{__(
									'Merge tag copied to clipboard. You can now paste it in any field.',
									'quillcrm'
								)}
							</AlertDescription>
						</Alert>
					)}
				</>
			)}

			<div className="mb-4">
				<Fields
					fields={action.fields}
					values={settings}
					onChange={(value) => {
						setSettings(value);
					}}
					stepId={step.id}
				/>
			</div>

			{/* Twilio Configuration Modal */}
			{requiresProvider && channel && (
				<TwilioConfigModal
					open={showTwilioConfig}
					onClose={() => setShowTwilioConfig(false)}
					onSuccess={() => {
						setShowTwilioConfig(false);
						checkStatus(); // Refresh provider status after configuration
					}}
				/>
			)}

			{hasAnalytics && analyticsData && (
				<AnalyticsPopup
					visible={analyticsVisible}
					onClose={hideAnalytics}
					actionType={getChannelType(step.action)}
					analytics={analyticsData}
				/>
			)}
		</div>
	);
};

export default StepFieldsModal;
