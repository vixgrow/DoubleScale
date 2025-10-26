/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * External dependencies
 */
import React, { useState, useMemo } from 'react';

/**
 * Internal dependencies
 */
import ConfigAPI from '@quillcrm/config';
import type { NoticeMessage } from '@quillcrm/client';
import {
    CustomDialogHeader,
    Field,
    NoticeBanner,
    GradientAutomationsIcon,
} from '@quillcrm/components';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import TriggerCategorySelector from './trigger-category-selector';
import TriggersGroupRender from './triggers-group-render';
//@ts-ignore
import crm from '../../../../../assets/images/crm/crm.png';
//@ts-ignore
import lms from '../../../../../assets/images/lms/lms.png';
//@ts-ignore
import memberpress from '../../../../../assets/images/member-press/memberpress.png';
//@ts-ignore
import woocommerce from '../../../../../assets/images/woocoomerce/woo-icon.png';
//@ts-ignore
import wpusers from '../../../../../assets/images/wordpress/wordpress-icon.png';
//@ts-ignore
import forms from '../../../../../assets/images/forms/forms.png';

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
    onClearError: () => void;
    error?: NoticeMessage | null;
}

const CreateAutomationModal: React.FC<CreateAutomationModalProps> = ({
    visible,
    isSaving,
    automation,
    onOk,
    onCancel,
    onAutomationChange,
    onClearError,
    error,
}) => {
    const automationTriggers = ConfigAPI.getAutomationTriggers();
    const [selectedCategory, setSelectedCategory] = useState('crm');

    const categoryData = {
        'booking': {
            image: forms,
            description: __('Trigger automations based on booking events', 'quillcrm')
        },
        'crm': {
            image: crm,
            description: __('Automate your CRM workflows and tasks', 'quillcrm')
        },
        'forms': {
            image: forms,
            description: __('Trigger actions when forms are submitted', 'quillcrm')
        },
        'lms': {
            image: lms,
            description: __('Learning management system automation', 'quillcrm')
        },
        'memberpress': {
            image: memberpress,
            description: __('Membership and subscription automation', 'quillcrm')
        },
        'woocommerce': {
            image: woocommerce,
            description: __('E-commerce and order automation', 'quillcrm')
        },
        'wp': {
            image: wpusers,
            description: __('WordPress user and content automation', 'quillcrm')
        }
    };

    // Get the currently selected category's data
    const currentCategoryData = useMemo(() => {
        return automationTriggers[selectedCategory];
    }, [automationTriggers, selectedCategory]);

    return (
        <Dialog open={visible} onOpenChange={(open) => !open && onCancel()}>
            <DialogContent className="max-w-[1100px] overflow-y-auto max-h-[90vh]">
                <DialogHeader>
                    <CustomDialogHeader
                        title={__('Create Automation', 'quillcrm')}
                        subtitle={__('Add New Automation', 'quillcrm')}
                        icon={<GradientAutomationsIcon width={32} height={32} />}
                    />
                </DialogHeader>

                {error && (
                    <div className="mb-4">
                        <NoticeBanner
                            notice={error}
                            closeNotice={onClearError}
                        />
                    </div>
                )}

                <div className="qcrm-fields qcrm-automation-modal-fields">
                    <Field
                        label={__('Automation Name', 'quillcrm')}
                        value={automation.name}
                        onChange={(value) =>
                            onAutomationChange({ ...automation, name: value })
                        }
                        type="text"
                        required
                    />

                    <div className="qcrm-field">
                        <div className="qcrm-field-label flex items-center text-base text-[#09090B]">
                            {__('Trigger', 'quillcrm')}
                            <span className="text-destructive">*</span>
                        </div>

                        <div className="flex h-full gap-5">
                            <div className="w-1/2">
                                <TriggerCategorySelector
                                    triggers={automationTriggers}
                                    selectedCategory={selectedCategory}
                                    onCategoryChange={setSelectedCategory}
                                    data={categoryData}
                                />
                            </div>

                            <div className="w-1/2">
                                <TriggersGroupRender
                                    groups={currentCategoryData?.groups || []}
                                    value={automation.trigger}
                                    onChange={(value) =>
                                        onAutomationChange({
                                            ...automation,
                                            trigger: value,
                                        })
                                    }
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <DialogFooter>
                    <Button
                        onClick={onOk}
                        disabled={isSaving}
                        size="xl"
                        variant="gradient"
                        className="w-full mt-4"
                    >
                        {isSaving
                            ? __('Creating...', 'quillcrm')
                            : __('Create', 'quillcrm')}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default CreateAutomationModal;
