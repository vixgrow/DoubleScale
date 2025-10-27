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
import { getTrigger } from '@quillcrm/utils';
import type { Automation } from '@quillcrm/client';
import { Switch } from '@/components/ui/switch';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { HelpCircle } from 'lucide-react';

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

    return (
        <div className="flex flex-col h-full gap-5 max-h-[90vh] overflow-y-auto min-h-[50vh]">
            {trigger.fields && (
                <div className="qcrm-workflow-sidebar__fields-container">
                    {getTriggerFieldsComponent()}
                </div>
            )}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-[#333333]">
                        {__('Run Multiple Times', 'quillcrm')}
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
                                        'quillcrm'
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

