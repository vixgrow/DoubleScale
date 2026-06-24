/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
import { useState, useEffect, useLayoutEffect, useRef, useCallback, useMemo } from '@wordpress/element';
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
import type { OrganizedStep } from '@doublescale/client';
import { Fields } from '@doublescale/components';
import { getAction, getGoal } from '@doublescale/utils';
import { getToLink, useNavigate } from '@doublescale/navigation';
import ConfigAPI from '@doublescale/config';
import { useAutomationContext } from '../../../state/context';
import { deleteStep } from '../reactflow-workflow/utils/step-utils';
import { useProviderStatus } from '@/hooks/use-provider-status';
import { ProviderNotConnectedWarning } from '@/client/pages/contact/components/provider-not-connected-warning';
import { getProSmsCampaignBridge } from '@doublescale/shared/sms-pro-bridge';
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
	const ProTwilioModal =
		getProSmsCampaignBridge()?.TwilioConfigModal ?? (() => null);
	const navigate = useNavigate();
	const { setMergeTagsVisible, setMergeTagCallback, createNotice } =
		useDispatch('doublescale/core');
	const { steps, setSteps } = useAutomationContext();

	// Determine if this is a messaging action that requires provider
	const actionKey =
		step.type === 'delay'
			? step.action || 'delay'
			: step.action;
	const action =
		step.type === 'action' || step.type === 'delay'
			? getAction(actionKey)
			: getGoal(step.action);
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

	// Keys of fields the action declares as required (data-driven from get_fields()).
	// Memoized so the reference stays stable across renders — an unstable array
	// here would cascade into handleSave -> the footer effect -> an infinite
	// setState loop (React #185).
	const requiredFieldKeys = useMemo(
		() =>
			Object.entries(action?.fields || {})
				.filter(([, field]: [string, any]) => field?.required)
				.map(([key]) => key),
		// Keyed on the action slug (a stable string) rather than the action
		// object, whose reference can change between renders.
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[actionKey]
	);

	const handleSave = useCallback(async () => {
		// Block save when any required field is empty, and surface which one.
		const missing = requiredFieldKeys.filter((key) => {
			const value = settings?.[key];
			return (
				value === undefined ||
				value === null ||
				(typeof value === 'string' && value.trim() === '')
			);
		});
		if (missing.length > 0) {
			const firstLabel =
				(action?.fields?.[missing[0]]?.label as string) || missing[0];
			createNotice({
				type: 'error',
				/* translators: %s: field label */
				message: sprintf(
					__('%s is required.', 'doublescale'),
					__(firstLabel, 'doublescale')
				),
			});
			return;
		}

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
		// `action` is read for the error label only and is intentionally omitted
		// to keep handleSave's identity stable (it feeds the footer effect).
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [step, settings, saveStep, requiredFieldKeys, createNotice]);

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
			<div className="flex items-center justify-end gap-6">
				<Button
					onClick={handleDelete}
					disabled={isSaving || isDeleting}
					variant="destructive"

				>
					{isDeleting
						? __('Deleting...', 'doublescale')
						: __('Delete', 'doublescale')}
				</Button>
				<Button
					onClick={handleSave}
					disabled={isSaving || isDeleting}
					variant="default"

				>
					{isSaving
						? __('Saving...', 'doublescale')
						: __('Save Changes', 'doublescale')}
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
					'doublescale'
				),
			});
		});
		setMergeTagsVisible(true);
	};

	// Check if this step supports analytics
	const hasAnalytics = supportsAnalytics(step.action);
	// Check if this is a delay step
	const isDelayStep = step.type === 'delay';

	// Check if this is a CRM contact action
	const isContactInCrmAction = (() => {
		if (step.type !== 'action') {
			return false;
		}
		// The "Update Contact" action lives in the CRM/contact group but maps
		// merge tags into contact fields, so it must keep the Merge Tags button.
		if (actionKey === 'update_contact_fields') {
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
					'doublescale'
				)
				: step.settings?._action_warning_message ||
				__(
					'Action requires a plugin that is not currently active.',
					'doublescale'
				);
		const labelText =
			step.type === 'goal'
				? __('Goal:', 'doublescale')
				: __('Action:', 'doublescale');

		return (
			<div className="doublescale-step-fields-content flex flex-col">
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
						variant="destructive"
						className="w-full"
						size="lg"
					>
						{isDeleting
							? __('Deleting...', 'doublescale')
							: __('Delete', 'doublescale')}
					</Button>
				</div>
			</div>
		);
	}

	return (
		<div className="doublescale-step-fields-content flex flex-col min-h-0">
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
						{__('Merge Tags', 'doublescale')}
					</Button>
					{showMergeTagNotice && (
						<Alert className="mb-4 border-green-500 bg-green-50">
							<CheckCircle className="h-4 w-4 text-green-600" />
							<AlertDescription className="text-sm text-green-800">
								{__(
									'Merge tag copied to clipboard. You can now paste it in any field.',
									'doublescale'
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
					requiredFields={requiredFieldKeys}
				/>
			</div>

			{/* Twilio Configuration Modal */}
			{requiresProvider && channel && (
				<ProTwilioModal
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
