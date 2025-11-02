/**
 * External dependencies
 */
import React from 'react';

interface RegularStepProps {
    icon: React.ReactNode;
    label: string;
    status?: string;
    statuses: {
        completed: string;
        failed: string;
        pending: string;
        skipped: string;
    };
    branchLabel?: string;
}

const RegularStep: React.FC<RegularStepProps> = ({
    icon,
    label,
    status,
    statuses,
    branchLabel,
}) => {
    return (
        <>
            <div className="flex gap-2.5 items-center mb-3">
                <div className="qcrm-timeline-card-icon">{icon}</div>
                <div className="qcrm-timeline-card-title flex-1">{label}</div>
            </div>
            <div className="flex gap-2 items-center">
                {status && (
                    <>
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
                    </>
                )}
                {branchLabel && (
                    <div className="capitalize border rounded py-1 px-3 text-sm w-fit bg-[#e4eefd] text-secondary border-secondary">
                        {branchLabel}
                    </div>
                )}
            </div>
        </>
    );
};

export default RegularStep;

