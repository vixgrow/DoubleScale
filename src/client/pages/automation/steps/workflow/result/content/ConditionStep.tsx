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
import { Card, CardContent } from '@/components/ui/card';
import type { OrganizedStep } from '@quillcrm/client';

interface ConditionStepProps {
    icon: React.ReactNode;
    label: string;
    conditionResult: 'yes' | 'no';
    branchSteps: Array<{
        id: number | string;
        type: string;
        label: string;
        icon: React.ReactNode;
        status?: string;
        date?: string;
        step?: OrganizedStep;
    }>;
    statuses: {
        completed: string;
        failed: string;
        pending: string;
    };
}

const ConditionStep: React.FC<ConditionStepProps> = ({
    icon,
    label,
    conditionResult,
    branchSteps,
    statuses,
}) => {
    return (
        <div className="qcrm-condition-card">
            <div className="flex gap-2.5 items-center mb-3 flex-wrap">
                <div className="qcrm-timeline-card-icon">{icon}</div>
                <div className="qcrm-timeline-card-title">{label}:</div>
                {conditionResult && (
                    <div className="qcrm-condition-result-inline">
                        <span
                            className={`text-xl font-semibold ${conditionResult === 'yes'
                                ? 'text-[#16A34A]'
                                : 'text-destructive'
                                }`}
                        >
                            {conditionResult === 'yes'
                                ? __('Yes', 'quillcrm')
                                : __('No', 'quillcrm')}
                        </span>
                    </div>
                )}
            </div>
            {branchSteps.length > 0 && (
                <div className="qcrm-branch-steps">
                    <div className="space-y-2">
                        {branchSteps.map((branchStep) => (
                            <Card
                                key={branchStep.id}
                                className="qcrm-branch-step-card shadow-none"
                            >
                                <CardContent className="p-3">
                                    <div className="flex gap-2.5 items-center mb-2">
                                        <div className="qcrm-timeline-card-icon">
                                            {branchStep.icon}
                                        </div>
                                        <div className="qcrm-timeline-card-title flex-1">
                                            {branchStep.label}
                                        </div>
                                    </div>
                                    {branchStep.status && (
                                        <div className="flex justify-start">
                                            {(() => {
                                                const status = branchStep.status;
                                                const bgColor =
                                                    status == 'completed'
                                                        ? 'bg-[#EFFFF5] text-[#16A34A] border-[#16A34A]'
                                                        : status == 'failed'
                                                            ? 'bg-[#EF444429] text-destructive border-destructive'
                                                            : status == 'pending'
                                                                ? 'bg-gray-100 text-gray-500 border-gray-300'
                                                                : 'bg-gray-100 text-gray-700';
                                                return (
                                                    <span
                                                        className={`capitalize border rounded py-0.5 px-2 text-xs w-fit ${bgColor}`}
                                                    >
                                                        {statuses[status] ||
                                                            status}
                                                    </span>
                                                );
                                            })()}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default ConditionStep;

