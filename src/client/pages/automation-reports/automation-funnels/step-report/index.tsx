import React, { useState, useEffect, useCallback } from 'react';
import apiFetch from '@wordpress/api-fetch';
import './style.scss';
import { __ } from '@wordpress/i18n';
import { Automation } from '@quillcrm/client';

interface StepReportProps {
	automation: Automation | null;
}

interface StepData {
	stepName: string;
	contactsEntered: number;
	contactsCompleted: number;
	completionRate: number;
	dropOffRate: number;
}

interface StepsReportResponse {
	steps: StepData[];
	total_contacts: number;
	overall_conversion: number;
	automation: {
		id: number;
		name: string;
	};
}

interface CircularProgressProps {
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

const StepReport: React.FC<StepReportProps> = ({ automation }) => {
	const [stepData, setStepData] = useState<StepData[]>([]);
	const [overallConversion, setOverallConversion] = useState<number>(0);
	const [loading, setLoading] = useState<boolean>(true);
	const [error, setError] = useState<string | null>(null);

	const fetchStepData = useCallback(async () => {
		if (!automation?.id) {
			setLoading(false);
			return;
		}

		try {
			setLoading(true);
			const response = (await apiFetch({
				path: `/qc/v1/automation-reports/${automation.id}/steps-report`,
				method: 'GET',
			})) as StepsReportResponse;

			if (response.steps && Array.isArray(response.steps)) {
				setStepData(response.steps);
				setOverallConversion(response.overall_conversion || 0);
			} else {
				setError('Invalid response format');
			}
		} catch (err) {
			console.error('Error fetching step data:', err);
			setError('Failed to fetch step data');
		} finally {
			setLoading(false);
		}
	}, [automation?.id]);

	useEffect(() => {
		fetchStepData();
	}, [fetchStepData]);

	const getProgressColor = (rate: number): string => {
		if (rate >= 90) return '#4F8EF7'; // Blue for excellent
		if (rate >= 70) return '#4F8EF7'; // Blue for good
		if (rate >= 50) return '#52C41A'; // Green for average
		if (rate >= 30) return '#FAAD14'; // Orange for below average
		return '#FF4D4F'; // Red for poor
	};

	if (loading) {
		return (
			<div className="step-report-container">
				<div className="loading-state">Loading step data...</div>
			</div>
		);
	}

	if (error) {
		return (
			<div className="step-report-container">
				<div className="error-state">Error: {error}</div>
			</div>
		);
	}

	if (stepData.length === 0) {
		return (
			<div className="step-report-container">
				<div className="empty-state">No step data available</div>
			</div>
		);
	}

	return (
		<div className="step-report-container">
			<div className="step-grid">
				{stepData.map((step, index) => (
					<div key={index} className="step-card">
						<div className="step-progress">
							<CircularProgress
								percentage={step.completionRate}
								color={getProgressColor(step.completionRate)}
								size={120}
								strokeWidth={8}
							/>
						</div>
						<div className="step-info">
							<h3 className="step-title">{step.stepName}</h3>
							<div className="step-stats">
								<div className="stat-row">
									<span className="stat-icon">👥</span>
									<span className="stat-value">
										{step.contactsEntered}
									</span>
									<span className="stat-label">
										{step.completionRate}%
									</span>
									{step.dropOffRate > 0 && (
										<span className="drop-indicator">
											↓ {step.dropOffRate}%
										</span>
									)}
								</div>
							</div>
						</div>
					</div>
				))}
				{/* overall conversion */}
				<div className="step-card">
					<div className="step-progress">
						<CircularProgress
							percentage={100}
							color={getProgressColor(100)}
							size={120}
							strokeWidth={8}
							showCheckmark={true}
						/>
					</div>
					<div className="step-info">
						<h3 className="step-title">
							{__('Overall Conversion Rate', 'quillcrm')}:{' '}
							{overallConversion}%
						</h3>
					</div>
				</div>
			</div>
		</div>
	);
};

export default StepReport;
