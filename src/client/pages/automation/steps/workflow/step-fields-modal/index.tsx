/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useState, useEffect } from '@wordpress/element';
import { useDispatch } from '@wordpress/data';

/**
 * External dependencies
 */
import { BarChart3 } from 'lucide-react';

/**
 * Internal dependencies
 */
import { Button } from '@/components/ui/button';
import './style.scss';
import type { OrganizedStep } from '@quillcrm/client';
import { Fields } from '@quillcrm/components';
import { getAction, getGoal } from '@quillcrm/utils';
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
	const [isSaving, setIsSaving] = useState(false);
	const [isDeleting, setIsDeleting] = useState(false);
	const [settings, setSettings] = useState(step.settings);
	const [showTwilioConfig, setShowTwilioConfig] = useState(false);
	const { setMergeTagsVisible, setMergeTagCallback, createNotice } =
		useDispatch('quillcrm/core');
	const { steps, setSteps } = useAutomationContext();

	// Determine if this is a messaging action that requires provider
	const actionKey = step.type === 'delay' ? 'delay' : step.action;
	const isSmsAction = actionKey === 'send_sms';
	const isWhatsAppAction = actionKey === 'send_whatsapp';
	const requiresProvider = isSmsAction || isWhatsAppAction;
	const channel = isSmsAction ? 'sms' : isWhatsAppAction ? 'whatsapp' : null;

	// Check provider status for SMS/WhatsApp actions (non-blocking)
	const { isConnected, isLoading: providerLoading, checkStatus } = useProviderStatus(
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

	const handleSave = async () => {
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
	};

	const handleDelete = async () => {
		setIsDeleting(true);
		await deleteStep(step.id.toString(), steps, setSteps, createNotice);
		setIsDeleting(false);
		setStep(null); // Close the modal after deletion
	};

	const handleMergeTagsClick = () => {
		setMergeTagCallback((tagValue: string) => {
			navigator.clipboard.writeText(tagValue);
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

	return (
		<div className="qcrm-step-fields-content flex flex-col">
			{/* Provider not configured warning for SMS/WhatsApp actions (non-blocking) */}
			{requiresProvider && !isConnected && !providerLoading && channel && (
				<div className="mb-4">
					<ProviderNotConnectedWarning
						channel={channel}
						onConfigureClick={() => setShowTwilioConfig(true)}
					/>
				</div>
			)}

			<Button
				onClick={handleMergeTagsClick}
				disabled={isSaving || isDeleting}
				variant="secondaryDeepBlue"
				className="w-full mb-4"
				size="lg"
			>
				{__('Merge Tags', 'quillcrm')}
			</Button>

			<div className="mb-4">
				<Fields
					fields={action.fields}
					values={settings}
					onChange={(value) => {
						setSettings(value);
					}}
				/>
			</div>

			<div className="space-y-4">
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
