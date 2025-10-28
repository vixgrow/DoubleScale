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
    };
}

const RegularStep: React.FC<RegularStepProps> = ({
    icon,
    label,
    status,
    statuses,
}) => {
    return (
        <>
            <div className="flex gap-2.5 items-center mb-3">
                <div className="qcrm-timeline-card-icon">{icon}</div>
                <div className="qcrm-timeline-card-title flex-1">{label}</div>
            </div>
            {status && (
                <div className="flex justify-start">
                    {(() => {
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

export default RegularStep;

