/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * External dependencies
 */
import { Handle, Position, type NodeProps } from '@xyflow/react';
import React from 'react';

/**
 * Internal dependencies
 */
import type {
    AutomationStep,
    Automation,
    OrganizedStep,
} from '@quillcrm/client';
import NodeContextMenu from '../components/node-context-menu';
import NodeActionsDropdown from '../components/node-actions-dropdown';
import StepReorderControls from '../components/step-reorder-controls';
import { useAutomationContext } from '../../../../state/context';
import { useDispatch } from '@wordpress/data';
import { deleteStep } from '../utils/step-utils';
import { TimerBlockIcon } from '@quillcrm/components';

interface DelayNodeData {
    step: AutomationStep;
    automation: Automation;
    selectedStepId?: string | null;
    viewMode?: boolean;
    analytics?: { contacts: number; conversion_rate: number };
    onStepClick?: (step: OrganizedStep) => void;
    onDeleteStep?: (stepId: string) => void;
}

const DelayNode: React.FC<NodeProps> = (props) => {
    const { data } = props;
    const { step, onStepClick, selectedStepId, viewMode = false, analytics } = data as unknown as DelayNodeData;

    const { steps, setSteps } = useAutomationContext();
    const { createNotice } = useDispatch('quillcrm/core');

    // Check if delay is configured - it has both delay value and unit
    const isConfigured = !!step.settings?.delay && !!step.settings?.unit;

    // Format delay display text
    const getDelayText = () => {
        if (!isConfigured) return null;
        const delay = step.settings.delay;
        const unit = step.settings.unit;
        return `${delay} ${unit}`;
    };

    const delayText = getDelayText();


    const handleEdit = () => {
        if (!viewMode && onStepClick) {
            onStepClick({
                ...step,
                children: [], // Will be populated if needed by the consuming component
            });
        }
    };

    const handleDelete = async () => {
        if (!viewMode) {
            await deleteStep(step.id.toString(), steps, setSteps, createNotice);
        }
    };

    // Check if this node is selected
    const isSelected = selectedStepId === step.id.toString();

    return (
        <NodeContextMenu onEdit={viewMode ? undefined : handleEdit} onDelete={viewMode ? undefined : handleDelete} disabled={viewMode}>
            <div className={`qcrm-reactflow-node qcrm-reactflow-node--delay ${isSelected ? 'qcrm-reactflow-node--selected' : ''} ${viewMode && analytics ? 'qcrm-reactflow-node--action-with-analytics' : ''}`} onClick={viewMode ? undefined : handleEdit}>
                <Handle
                    type="target"
                    position={Position.Top}
                    className="qcrm-reactflow-handle qcrm-reactflow-handle--target"
                />

                {/* Step Reorder Controls - hide in view mode */}
                {!viewMode && <StepReorderControls step={step} />}

                {viewMode && analytics ? (
                    <>
                        {/* Header Row: Icon, Content, Dropdown */}
                        <div className="qcrm-reactflow-node__header-row">
                            <div className="qcrm-reactflow-node__header-left">
                                <div className="qcrm-reactflow-node__icon">
                                    <TimerBlockIcon />
                                </div>
                                <div className="qcrm-reactflow-node__content">
                                    <div className="qcrm-reactflow-node__title">
                                        {__('Delay', 'quillcrm')}
                                    </div>
                                    <div className="qcrm-reactflow-node__subtitle">
                                        {isConfigured ? (
                                            <span className="qcrm-reactflow-delay__configured">
                                                {__('Sets to delay', 'quillcrm')} {delayText}
                                            </span>
                                        ) : (
                                            <span className="qcrm-reactflow-delay__not-configured">
                                                <span className='text-[#333333B2] mr-1'>{__('Need to', 'quillcrm')}</span>
                                                {__('Set Delay Time', 'quillcrm')}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <NodeActionsDropdown
                                onEdit={handleEdit}
                                onDelete={handleDelete}
                                editLabel={__('Edit Delay', 'quillcrm')}
                                deleteLabel={__('Delete Delay', 'quillcrm')}
                                deleteTitle={__('Delete this Delay?', 'quillcrm')}
                                deleteDescription={__(
                                    'This will remove the Delay from your workflow.',
                                    'quillcrm'
                                )}
                            />
                        </div>

                        {/* Footer Row: Analytics */}
                        <div className="qcrm-reactflow-node__footer-row">
                            <div className="text-sm">
                                <span className="text-[#667085]">{__('Contact:', 'quillcrm')} </span>
                                <span className="font-semibold text-[#344054]">{analytics.contacts || 0}</span>
                            </div>
                            <div className="text-sm">
                                <span className="text-[#667085]">{__('Conversion Rate:', 'quillcrm')} </span>
                                <span className="font-semibold text-[#344054]">{analytics.conversion_rate || 0}%</span>
                            </div>
                        </div>
                    </>
                ) : (
                    <>
                        <div className="qcrm-reactflow-node__icon">
                            <TimerBlockIcon />
                        </div>
                        <div className="qcrm-reactflow-node__content">
                            <div className="qcrm-reactflow-node__title">
                                {__('Delay', 'quillcrm')}
                            </div>
                            <div className="qcrm-reactflow-node__subtitle">
                                {isConfigured ? (
                                    <span className="qcrm-reactflow-delay__configured">
                                        {__('Sets to delay', 'quillcrm')} {delayText}
                                    </span>
                                ) : (
                                    <span className="qcrm-reactflow-delay__not-configured">
                                        <span className='text-[#333333B2] mr-1'>{__('Need to', 'quillcrm')}</span>
                                        {__('Set Delay Time', 'quillcrm')}
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Three dots dropdown menu */}
                        <NodeActionsDropdown
                            onEdit={handleEdit}
                            onDelete={handleDelete}
                            editLabel={__('Edit Delay', 'quillcrm')}
                            deleteLabel={__('Delete Delay', 'quillcrm')}
                            deleteTitle={__('Delete this Delay?', 'quillcrm')}
                            deleteDescription={__(
                                'This will remove the Delay from your workflow.',
                                'quillcrm'
                            )}
                        />
                    </>
                )}

                <Handle
                    type="source"
                    position={Position.Bottom}
                    className="qcrm-reactflow-handle qcrm-reactflow-handle--source"
                />
            </div>
        </NodeContextMenu>
    );
};

export default DelayNode;
