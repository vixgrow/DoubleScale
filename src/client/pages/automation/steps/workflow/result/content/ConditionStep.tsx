/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * External dependencies
 */
import React from 'react';

interface ConditionStepProps {
    icon: React.ReactNode;
    label: string;
    conditionResult: 'yes' | 'no';
    status?: string;
    statuses?: {
        completed: string;
        failed: string;
        pending: string;
        skipped: string;
    };
}

const ConditionStep: React.FC<ConditionStepProps> = ({
    icon,
    label,
    conditionResult,
    status,
    statuses,
}) => {
    return (
        <>
            <div className="flex gap-2.5 items-center mb-3">
                <div className="qcrm-timeline-card-icon">{icon}</div>
                <div className="qcrm-timeline-card-title flex-1">{label}</div>
                {conditionResult && (
                    <span
                        className={`text-xl font-semibold ${conditionResult === 'yes'
                            ? 'text-[#16A34A]'
                            : 'text-destructive'
                            }`}
                    >
                        {conditionResult === 'yes'
                            ? __('Yes', 'doublescale')
                            : __('No', 'doublescale')}
                    </span>
                )}
            </div>
            {status && statuses && (
                <div className="flex justify-start">
                    {(() => {
                        const bgColor =
                            status == 'completed'
                                ? 'bg-[#EFFFF5] text-[#16A34A] border-[#16A34A]'
                                : status == 'failed'
                                    ? 'bg-[#EF444429] text-destructive border-destructive'
                                    : status == 'pending'
                                        ? 'bg-gray-100 text-gray-500 border-gray-300'
                                        : status == 'skipped'
                                            ? 'bg-orange-50 text-orange-600 border-orange-400'
                                            : 'bg-gray-100 text-gray-700';
                        return (
                            <span
                                className={`capitalize border rounded py-1 px-3 text-sm w-fit ${bgColor}`}
                            >
                                {statuses[status] || status}
                            </span>
                        );
                    })()}
                </div>
            )}
        </>
    );
};

export default ConditionStep;

