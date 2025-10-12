/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * External dependencies
 */
import { Modal, Typography, Tabs } from 'antd';
import { map } from 'lodash';

/**
 * Internal dependencies
 */
import type { Automation } from '@quillcrm/client';
import ConfigAPI from '@quillcrm/config';
import { Field } from '@quillcrm/components';
import TriggersGroupRender from '../triggers-group-render';

interface CreateAutomationModalProps {
    visible: boolean;
    isSaving: boolean;
    automation: {
        name: string;
        trigger: string;
    };
    onOk: () => void;
    onCancel: () => void;
    onAutomationChange: (automation: { name: string; trigger: string }) => void;
}

const CreateAutomationModal: React.FC<CreateAutomationModalProps> = ({
    visible,
    isSaving,
    automation,
    onOk,
    onCancel,
    onAutomationChange,
}) => {
    const automationTriggers = ConfigAPI.getAutomationTriggers();

    const automationTriggersTabs = map(
        automationTriggers,
        (trigger, index) => ({
            key: index,
            label: trigger.label,
            children: (
                <TriggersGroupRender
                    groups={trigger.groups}
                    onChange={(value) =>
                        onAutomationChange({ ...automation, trigger: value })
                    }
                    value={automation.trigger}
                />
            ),
        })
    );

    return (
        <Modal
            title={__('Create Automation', 'quillcrm')}
            open={visible}
            onOk={onOk}
            onCancel={onCancel}
            confirmLoading={isSaving}
            width={800}
        >
            <div className="qcrm-fields qcrm-automation-modal-fields">
                <Field
                    label={__('Name', 'quillcrm')}
                    value={automation.name}
                    onChange={(value) =>
                        onAutomationChange({ ...automation, name: value })
                    }
                    type="text"
                />
                <div className="qcrm-field">
                    <div className="qcrm-field-label">
                        <Typography.Text>
                            {__('Trigger', 'quillcrm')}
                        </Typography.Text>
                    </div>
                    <div className="qcrm-field-input">
                        <Tabs
                            defaultActiveKey="0"
                            tabPosition="left"
                            items={automationTriggersTabs}
                        />
                    </div>
                </div>
            </div>
        </Modal>
    );
};

export default CreateAutomationModal;

