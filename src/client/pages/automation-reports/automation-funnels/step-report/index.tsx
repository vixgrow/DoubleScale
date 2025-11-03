import React, { useState, useEffect, useCallback } from 'react';
import apiFetch from '@wordpress/api-fetch';
import './style.scss';
import { __ } from '@wordpress/i18n';
import { Automation } from '@quillcrm/client';
import CircularProgress from './circular-progress';

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

const StepReport: React.FC<StepReportProps> = ({ automation }) => {
	const [stepData, setStepData] = useState<StepData[]>([]);
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

	if (loading) {
		return (
			<div className="step-report-container">
				<div className="report-header">
					<h2 className="report-title">{__('Step Report', 'quillcrm')}</h2>
				</div>
				<div className="loading-state">Loading step data...</div>
			</div>
		);
	}

	if (error) {
		return (
			<div className="step-report-container">
				<div className="report-header">
					<h2 className="report-title">{__('Step Report', 'quillcrm')}</h2>
				</div>
				<div className="error-state">Error: {error}</div>
			</div>
		);
	}

	if (stepData.length === 0) {
		return (
			<div className="step-report-container">
				<div className="report-header">
					<h2 className="report-title">{__('Step Report', 'quillcrm')}</h2>
				</div>
				<div className="empty-state">No step data available</div>
			</div>
		);
	}

	return (
		<div className="step-report-container">
			<div className="report-header">
				<h2 className="report-title">{__('Step Report', 'quillcrm')}</h2>
			</div>
			<div className="step-flex">
				{stepData.map((step, index) => (
					<React.Fragment key={index}>
						<div className="step-item">
							<div className="step-progress">
								<CircularProgress
									percentage={step.completionRate}
									color={'#4F8EF7'}
									size={100}
									strokeWidth={12}
								/>
							</div>
							<div className="step-info">
								<h3 className="step-title">
									{index === 0 ? __('Entrance', 'quillcrm') : `${__('Step', 'quillcrm')} ${index}`}
								</h3>
								<div className="step-stats">
									<div className="stat-row">
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
						{index < stepData.length - 1 && <div className="step-connector"></div>}
					</React.Fragment>
				))}
			</div>
		</div>
	);
};

export default StepReport;
