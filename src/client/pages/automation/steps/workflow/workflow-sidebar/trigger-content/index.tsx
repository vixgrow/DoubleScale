/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import WebhookFields from '../../webhook-fields';
import FormFields from '../../form-fields';
import Fields from '@/components/fields';
import TriggerDocumentationCallout from '../../../../../automations/components/trigger-documentation-callout';
import { getTrigger } from '@doublescale/utils';
import type { Automation } from '@doublescale/client';
import { Switch } from '@/components/ui/switch';
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from '@/components/ui/tooltip';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { HelpCircle } from 'lucide-react';
import { AlertTriangleIcon } from '@doublescale/components';

interface TriggerContentProps {
	automation: Automation;
	onSettingsChange: (settings: any) => void;
	onMultipleRunsChange: (value: boolean) => void;
}

const TriggerContent: React.FC<TriggerContentProps> = ({
	automation,
	onSettingsChange,
	onMultipleRunsChange,
}) => {
	const trigger = getTrigger(automation.trigger);

	if (!trigger) return null;

	// Get trigger warning if exists
	const triggerWarning = automation._warnings?.find(
		(warning) => warning.type === 'trigger'
	);

	const getTriggerFieldsComponent = () => {
		const triggerFieldTypeMap: Record<string, JSX.Element> = {
			webhook_received: (
				<WebhookFields
					values={automation.settings || {}}
					onChange={onSettingsChange}
				/>
			),
		};

		if (automation.trigger && triggerFieldTypeMap[automation.trigger]) {
			return triggerFieldTypeMap[automation.trigger];
		}

		return trigger.is_form ? (
			<FormFields
				values={{
					form_type: automation.trigger,
					...(automation.settings || {}),
				}}
				onChange={onSettingsChange}
			/>
		) : (
			<Fields
				fields={trigger.fields!}
				values={automation.settings || {}}
				onChange={onSettingsChange}
			/>
		);
	};

	// If there's a trigger warning, show only the warning
	if (triggerWarning) {
		return (
			<div className="flex flex-col gap-5 min-h-[80vh]">
				<Alert
					variant="destructive"
					className="border-orange-500 bg-orange-50"
				>
					<AlertTriangleIcon width={20} height={20} color="#EA580C" />
					<AlertDescription className="text-sm text-orange-800">
						{triggerWarning.message}
						{triggerWarning.plugin_label && (
							<span className="block mt-1 font-medium">
								{__('Required plugin:', 'doublescale')}{' '}
								{triggerWarning.plugin_label}
							</span>
						)}
					</AlertDescription>
				</Alert>
			</div>
		);
	}

	return (
		<div className="flex flex-col gap-5 min-h-[80vh]">
			{trigger.documentation && (
				<TriggerDocumentationCallout
					documentation={trigger.documentation}
				/>
			)}
			{trigger.description && !trigger.documentation && (
				<p className="text-sm leading-6 text-muted-foreground">
					{trigger.description}
				</p>
			)}
			{trigger.fields && (
				<div className="doublescale-workflow-sidebar__fields-container">
					{getTriggerFieldsComponent()}
				</div>
			)}
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-2">
					<span className="text-sm font-medium text-[#333333]">
						{__('Run Multiple Times', 'doublescale')}
					</span>
					<TooltipProvider>
						<Tooltip>
							<TooltipTrigger asChild>
								<HelpCircle className="w-4 h-4 text-gray-400 cursor-help" />
							</TooltipTrigger>
							<TooltipContent className="z-[160000] bg-gray-100 border-none w-60 text-gray-600 text-xs">
								<p>
									{__(
										'If you want to restart the automation for the same contact',
										'doublescale'
									)}
								</p>
							</TooltipContent>
						</Tooltip>
					</TooltipProvider>
				</div>
				<Switch
					checked={automation.settings?.multiple_runs}
					onCheckedChange={onMultipleRunsChange}
				/>
			</div>
		</div>
	);
};

export default TriggerContent;
