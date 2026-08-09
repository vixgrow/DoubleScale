/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useDispatch } from '@wordpress/data';
import apiFetch from '@wordpress/api-fetch';

/**
 * External dependencies
 */
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { AlertTriangle, Zap } from 'lucide-react';
import { useState } from 'react';

/**
 * Internal dependencies
 */
import type { Automation } from '@doublescale/client';
import {
	getTriggerLabel,
	getTriggerWarningMessage,
	hasTriggerWarning,
} from '@doublescale/utils';
import NodeContextMenu from '../components/node-context-menu';
import NodeLayout from '../components/node-layout';
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from '@/components/ui/tooltip';
import CreateAutomationModal from '../../../../../automations/create-automation-modal';
import { useAutomationContext } from '../../../../state/context';
import { TriggerIcon } from '@doublescale/components';
import {
	getFreeformWhatsappSteps,
	resetFreeformWhatsappSettings,
} from '../../utils/whatsapp-automation';
import type { AutomationStep } from '@doublescale/client';

interface TriggerNodeData {
	automation: Automation;
	isTriggerVisible?: boolean;
	viewMode?: boolean;
	analytics?: { contacts: number; conversion_rate: number };
	onTriggerClick?: () => void;
	onDeleteTrigger?: (triggerId: string) => void;
}

const TriggerNode: React.FC<NodeProps> = ({ data }) => {
	const {
		automation,
		onTriggerClick,
		isTriggerVisible,
		viewMode = false,
		analytics,
	} = data as unknown as TriggerNodeData;

	const { saveAutomation, refetchAutomation, isSaving, steps, updateStep } =
		useAutomationContext();
	const { createNotice } = useDispatch('doublescale/core');
	const [showChangeTriggerModal, setShowChangeTriggerModal] = useState(false);
	const [tempAutomation, setTempAutomation] = useState({
		name: automation?.name || '',
		trigger: automation?.trigger || '',
	});

	const handleEdit = () => {
		if (!viewMode && onTriggerClick) {
			onTriggerClick();
		}
	};

	const handleChangeTrigger = () => {
		if (!viewMode) {
			setTempAutomation({
				name: automation?.name || '',
				trigger: automation?.trigger || '',
			});
			setShowChangeTriggerModal(true);
		}
	};

	const handleChangeTriggerSave = async () => {
		try {
			const nameTrimmed = tempAutomation.name.trim();
			const nameChanged =
				nameTrimmed !== (automation?.name || '').trim();
			const triggerChanged = tempAutomation.trigger !== automation?.trigger;

			if (!nameChanged && !triggerChanged) {
				setShowChangeTriggerModal(false);
				return;
			}

			// Rename only: skip trigger condition checks
			if (nameChanged && !triggerChanged) {
				if (!nameTrimmed) {
					createNotice({
						type: 'error',
						message: __(
							'Automation name is required',
							'doublescale'
						),
					});
					return;
				}
				await saveAutomation({ name: nameTrimmed });
				await refetchAutomation();
				setShowChangeTriggerModal(false);
				return;
			}

			if (triggerChanged) {
				const leavingWhatsappReceived =
					automation?.trigger === 'whatsapp_received' &&
					tempAutomation.trigger !== 'whatsapp_received';
				const hasFreeformWhatsappSteps =
					leavingWhatsappReceived &&
					getFreeformWhatsappSteps(steps).length > 0;

				if (hasFreeformWhatsappSteps) {
					const confirmed = window.confirm(
						__(
							'Changing the trigger will disable the free-form text option in existing WhatsApp actions and reset them to unconfigured. You will need to select a template for those steps.',
							'doublescale'
						)
					);

					if (!confirmed) {
						return;
					}
				}

				// check if you have any condtions is related with this trigger
				const response = await apiFetch({
					path: '/doublescale/v1/automations/check-conditions',
					method: 'POST',
					data: {
						automation_id: automation.id,
						is_check: true,
						is_delete: false,
					},
				});
				const responseData = response as { count: number };
				if (responseData.count > 0) {
					const confirm = window.confirm(
						__(
							'This trigger requires a plugin that is not currently active. Please activate the required plugin for this automation to work.',
							'doublescale'
						)
					);
					if (confirm) {
						await apiFetch({
							path: '/doublescale/v1/automations/check-conditions',
							method: 'POST',
							data: {
								automation_id: automation.id,
								is_check: false,
								is_delete: true,
							},
						});
						await handleChangeTriggerConfirm();
						setShowChangeTriggerModal(false);
					}
				} else {
					await handleChangeTriggerConfirm();
					setShowChangeTriggerModal(false);
				}
			}
		} catch (error) {
			console.error('Failed to change trigger:', error);
			createNotice({
				type: 'error',
				message: __('Failed to update trigger', 'doublescale'),
			});
		}
	};

	const resetFreeformWhatsappSteps = async () => {
		const affectedSteps = getFreeformWhatsappSteps(steps);

		for (const step of affectedSteps) {
			const response = (await apiFetch({
				path: `/doublescale/v1/automation-steps/${step.id}`,
				method: 'POST',
				data: {
					...step,
					settings: resetFreeformWhatsappSettings(
						step.settings || {}
					),
					status: 'active',
				},
			})) as AutomationStep;

			updateStep(response.id, response);
		}
	};

	const handleChangeTriggerConfirm = async () => {
		const nameTrimmed = tempAutomation.name.trim();
		if (!nameTrimmed) {
			createNotice({
				type: 'error',
				message: __('Automation name is required', 'doublescale'),
			});
			return;
		}

		const leavingWhatsappReceived =
			automation?.trigger === 'whatsapp_received' &&
			tempAutomation.trigger !== 'whatsapp_received';

		if (leavingWhatsappReceived && getFreeformWhatsappSteps(steps).length > 0) {
			await resetFreeformWhatsappSteps();
		}

		await saveAutomation({
			trigger: tempAutomation.trigger,
			name: nameTrimmed,
		});

		// Refetch the automation to get fresh data and trigger re-render
		await refetchAutomation();
	};

	const handleChangeTriggerCancel = () => {
		setShowChangeTriggerModal(false);
		setTempAutomation({
			name: automation?.name || '',
			trigger: automation?.trigger || '',
		});
	};

	// Get trigger label and warning status from backend
	const triggerName = getTriggerLabel(automation);
	const hasWarning = hasTriggerWarning(automation);

	const subtitle = (
		<div className="flex items-center gap-2">
			<span
				style={{
					fontWeight: 'bold',
					color: hasWarning ? '#f59e0b' : '#29292E',
				}}
			>
				{triggerName}
			</span>
			{hasWarning && (
				<TooltipProvider>
					<Tooltip>
						<TooltipTrigger asChild>
							<AlertTriangle className="h-4 w-4 text-orange-500" />
						</TooltipTrigger>
						<TooltipContent side="right" className="max-w-xs">
							<p className="font-semibold">
								{__('Plugin Required', 'doublescale')}
							</p>
							<p className="text-xs mt-1">
								{getTriggerWarningMessage(automation)}
							</p>
						</TooltipContent>
					</Tooltip>
				</TooltipProvider>
			)}
		</div>
	);

	return (
		<>
			<NodeContextMenu
				onEdit={viewMode ? undefined : handleEdit}
				showDelete={false}
				disabled={viewMode}
			>
				<div
					className={`doublescale-reactflow-node doublescale-reactflow-node--trigger doublescale-reactflow-node--card-layout ${isTriggerVisible ? 'doublescale-reactflow-node--selected' : ''} ${viewMode && analytics ? 'doublescale-reactflow-node--action-with-analytics' : ''}`}
				>
					<NodeLayout
						variant="trigger"
						icon={<TriggerIcon />}
						title={__('Start Workflow (Trigger)', 'doublescale')}
						subtitle={subtitle}
						onEdit={handleEdit}
						onDelete={() => {}}
						onChangeTrigger={
							!viewMode ? handleChangeTrigger : undefined
						}
						editLabel={__('Edit Trigger', 'doublescale')}
						changeTriggerLabel={__('Change Trigger', 'doublescale')}
						deleteLabel=""
						deleteTitle=""
						deleteDescription=""
						showDelete={false}
						showChangeTrigger={!viewMode}
						viewMode={viewMode}
						analytics={analytics}
					/>

					<Handle
						type="source"
						position={Position.Bottom}
						className="doublescale-reactflow-handle doublescale-reactflow-handle--source"
					/>
				</div>
			</NodeContextMenu>

			{/* Change Trigger Modal - Reuse CreateAutomationModal */}
			<CreateAutomationModal
				visible={showChangeTriggerModal}
				isEditAutomation={true}
				isSaving={isSaving}
				automation={tempAutomation}
				onOk={handleChangeTriggerSave}
				onCancel={handleChangeTriggerCancel}
				onAutomationChange={setTempAutomation}
				onClearError={() => {}}
				error={null}
				removePortal={false}
			/>
		</>
	);
};

export default TriggerNode;
