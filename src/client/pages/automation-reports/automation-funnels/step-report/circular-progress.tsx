import React from 'react';

export interface CircularProgressProps {
    percentage: number;
    size?: number;
    strokeWidth?: number;
    color?: string;
    showCheckmark?: boolean;
}

const CircularProgress: React.FC<CircularProgressProps> = ({
    percentage,
    size = 120,
    strokeWidth = 8,
    color = '#4F8EF7',
    showCheckmark = false,
}) => {
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const strokeDasharray = circumference;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;

    return (
        <div
            className="circular-progress"
            style={{ width: size, height: size }}
        >
            <svg width={size} height={size} className="circular-progress-svg">
                <circle
                    className="circular-progress-background"
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    strokeWidth={strokeWidth}
                />
                <circle
                    className="circular-progress-foreground"
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    strokeWidth={strokeWidth}
                    style={{
                        strokeDasharray,
                        strokeDashoffset,
                        stroke: color,
                    }}
                />
            </svg>
            <div className="circular-progress-text">
                {showCheckmark ? (
                    <span className="checkmark">✓</span>
                ) : (
                    <span className="percentage">{percentage}%</span>
                )}
            </div>
        </div>
    );
};

export default CircularProgress;

