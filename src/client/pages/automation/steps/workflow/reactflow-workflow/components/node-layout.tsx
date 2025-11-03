/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * External dependencies
 */
import React from 'react';

/**
 * Internal dependencies
 */
import NodeActionsDropdown from './node-actions-dropdown';

interface NodeLayoutProps {
    icon: React.ReactNode;
    title: string;
    subtitle: React.ReactNode;
    onEdit: () => void;
    onDelete: () => void;
    editLabel: string;
    deleteLabel: string;
    deleteTitle: string;
    deleteDescription: string;
    showDelete?: boolean;
    viewMode?: boolean;
    analytics?: { contacts: number; conversion_rate: number };
    customFooter?: React.ReactNode;
}

const NodeLayout: React.FC<NodeLayoutProps> = ({
    icon,
    title,
    subtitle,
    onEdit,
    onDelete,
    editLabel,
    deleteLabel,
    deleteTitle,
    deleteDescription,
    showDelete = true,
    viewMode = false,
    analytics,
    customFooter,
}) => {
    const hasFooter = (viewMode && analytics) || customFooter;

    return (
        <>
            <div className={hasFooter ? 'qcrm-reactflow-node__header-row border-b' : ''}>
                <div className='qcrm-reactflow-node__header-left'>
                    <div className="qcrm-reactflow-node__icon">
                        {icon}
                    </div>
                    <div className="qcrm-reactflow-node__content">
                        <div className="qcrm-reactflow-node__title">
                            {title}
                        </div>
                        <div className="qcrm-reactflow-node__subtitle">
                            {subtitle}
                        </div>
                    </div>
                </div>
                <NodeActionsDropdown
                    onEdit={onEdit}
                    onDelete={onDelete}
                    editLabel={editLabel}
                    deleteLabel={deleteLabel}
                    deleteTitle={deleteTitle}
                    deleteDescription={deleteDescription}
                    showDelete={showDelete}
                />
            </div>

            {/* Footer: Analytics or Custom */}
            {viewMode && analytics && (
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
            )}
            {customFooter}
        </>
    );
};

export default NodeLayout;

