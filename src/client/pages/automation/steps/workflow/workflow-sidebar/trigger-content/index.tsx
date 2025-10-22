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
import { Field } from '@quillcrm/components';
import { getTrigger } from '@quillcrm/utils';
import type { Automation } from '@quillcrm/client';

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
        <div className="flex flex-col h-full gap-5 overflow-y-auto max-h-[75vh]">
            <div className="qcrm-workflow-sidebar__fields-container">
                {trigger.fields && getTriggerFieldsComponent()}
            </div>
            <div className="bg-white">
                <Field
                    type="switch"
                    label={__(
                        'Run Multiple Times (If you want to restart the automation for the same contact)',
                        'quillcrm'
                    )}
                    value={automation.settings?.multiple_runs}
                    onChange={onMultipleRunsChange}
                />
            </div>
        </div>
    );
};

export default TriggerContent;

