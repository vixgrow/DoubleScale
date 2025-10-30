/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useState, useEffect } from '@wordpress/element';
import { useDispatch } from '@wordpress/data';
import apiFetch from '@wordpress/api-fetch';

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
import AnalyticsPopup from '../reactflow-workflow/components/analytics-popup';

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
	const [analyticsVisible, setAnalyticsVisible] = useState(false);
	const [analyticsData, setAnalyticsData] = useState<any>(null);
	const [isLoadingAnalytics, setIsLoadingAnalytics] = useState(false);
	const { setMergeTagsVisible, setMergeTagCallback, createNotice } =
		useDispatch('quillcrm/core');
	const { steps, setSteps } = useAutomationContext();

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

	const handleViewAnalytics = async () => {
		setIsLoadingAnalytics(true);
		try {
			const response = await apiFetch({
				path: `/qc/v1/automation-steps/${step.id}/analytics`,
				method: 'GET',
			});

			setAnalyticsData(response);
			setAnalyticsVisible(true);
		} catch (error) {
			createNotice({
				type: 'error',
				message: __(
					'Failed to load analytics. Please try again.',
					'quillcrm'
				),
			});
			console.error('Analytics fetch error:', error);
		} finally {
			setIsLoadingAnalytics(false);
		}
	};

	// Determine if this step supports analytics
	const supportsAnalytics = ['send_email', 'send_sms', 'send_whatsapp'].includes(
		step.action
	);

	// Determine action type for analytics popup
	const getActionType = (): 'email' | 'sms' | 'whatsapp' => {
		if (step.action === 'send_email') return 'email';
		if (step.action === 'send_sms') return 'sms';
		if (step.action === 'send_whatsapp') return 'whatsapp';
		return 'email'; // fallback
	};

	// For delay steps, the action should be 'delay'
	const actionKey = step.type === 'delay' ? 'delay' : step.action;

	const action =
		step.type === 'action' || step.type === 'delay'
			? getAction(actionKey)
			: getGoal(step.action);

	return (
		<div className="qcrm-step-fields-content flex flex-col">
			<Button
				onClick={handleMergeTagsClick}
				disabled={isSaving || isDeleting}
				variant="secondaryDeepBlue"
				className="w-full mb-4"
				size="lg"
			>
				{__('Merge Tags', 'quillcrm')}
			</Button>

			{supportsAnalytics && step.id && (
				<Button
					onClick={handleViewAnalytics}
					disabled={isSaving || isDeleting || isLoadingAnalytics}
					variant="outline"
					className="w-full mb-4"
					size="lg"
				>
					<BarChart3 className="w-4 h-4 mr-2" />
					{isLoadingAnalytics
						? __('Loading...', 'quillcrm')
						: __('View Analytics', 'quillcrm')}
				</Button>
			)}

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

			{supportsAnalytics && analyticsData && (
				<AnalyticsPopup
					visible={analyticsVisible}
					onClose={() => setAnalyticsVisible(false)}
					actionType={getActionType()}
					analytics={{
						sent: analyticsData.sent,
						clickRate: analyticsData.clickRate,
						unsubscribed: analyticsData.unsubscribedRate,
						openRate: analyticsData.openRate,
						clickToOpenRate:
							analyticsData.openRate > 0
								? (analyticsData.clickRate /
										analyticsData.openRate) *
								  100
								: 0,
					}}
				/>
			)}
		</div>
	);
};

export default StepFieldsModal;
