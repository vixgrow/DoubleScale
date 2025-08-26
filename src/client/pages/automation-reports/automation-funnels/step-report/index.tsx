import React from 'react';
import './style.scss';

interface StepReportProps {
	automation?: any;
}

interface StepData {
	stepName: string;
	contactsEntered: number;
	contactsCompleted: number;
	completionRate: number;
	averageTime: string;
	dropOffRate: number;
}

class StepReport extends React.Component<StepReportProps> {
	getStepData = (): StepData[] => {
		return [
			{
				stepName: 'Entrance',
				contactsEntered: 8,
				contactsCompleted: 8,
				completionRate: 100,
				averageTime: '0 min',
				dropOffRate: 0,
			},
			{
				stepName: 'Apply List #1',
				contactsEntered: 8,
				contactsCompleted: 7,
				completionRate: 88,
				averageTime: '5 min',
				dropOffRate: 12,
			},
			{
				stepName: 'Apply List #2',
				contactsEntered: 7,
				contactsCompleted: 6,
				completionRate: 86,
				averageTime: '3 min',
				dropOffRate: 14,
			},
			{
				stepName: 'Check Condition',
				contactsEntered: 6,
				contactsCompleted: 5,
				completionRate: 83,
				averageTime: '2 min',
				dropOffRate: 17,
			},
			{
				stepName: 'Apply List #3',
				contactsEntered: 5,
				contactsCompleted: 4,
				completionRate: 80,
				averageTime: '4 min',
				dropOffRate: 20,
			},
			{
				stepName: 'Wait X Days/Hours',
				contactsEntered: 4,
				contactsCompleted: 1,
				completionRate: 25,
				averageTime: '24 hrs',
				dropOffRate: 75,
			},
			{
				stepName: 'Apply List #4',
				contactsEntered: 1,
				contactsCompleted: 1,
				completionRate: 100,
				averageTime: '1 min',
				dropOffRate: 0,
			},
		];
	};

	getCompletionRateClass = (rate: number): string => {
		if (rate >= 90) return 'excellent';
		if (rate >= 70) return 'good';
		if (rate >= 50) return 'average';
		return 'poor';
	};

	render() {
		const stepData = this.getStepData();
		const totalEntered = stepData[0]?.contactsEntered || 0;
		const totalCompleted =
			stepData[stepData.length - 1]?.contactsCompleted || 0;
		const overallConversion =
			totalEntered > 0 ? (totalCompleted / totalEntered) * 100 : 0;

		return (
			<div className="step-report-container">
				<div className="step-report-header">
					<h3>Step-by-Step Performance Analysis</h3>
					<p>
						Detailed breakdown of how contacts progress through each
						automation step
					</p>
				</div>

				<div className="overview-stats">
					<div className="overview-card">
						<h4>Overall Performance</h4>
						<div className="overview-metrics">
							<div className="metric">
								<span className="metric-label">
									Total Entered
								</span>
								<span className="metric-value">
									{totalEntered}
								</span>
							</div>
							<div className="metric">
								<span className="metric-label">
									Total Completed
								</span>
								<span className="metric-value">
									{totalCompleted}
								</span>
							</div>
							<div className="metric">
								<span className="metric-label">
									Conversion Rate
								</span>
								<span
									className={`metric-value ${this.getCompletionRateClass(overallConversion)}`}
								>
									{overallConversion.toFixed(1)}%
								</span>
							</div>
						</div>
					</div>
				</div>

				<div className="step-report-table">
					<table>
						<thead>
							<tr>
								<th>Step Name</th>
								<th>Contacts Entered</th>
								<th>Contacts Completed</th>
								<th>Completion Rate</th>
								<th>Drop-off Rate</th>
								<th>Average Time</th>
								<th>Performance</th>
							</tr>
						</thead>
						<tbody>
							{stepData.map((step, index) => (
								<tr key={index}>
									<td className="step-name">
										<div className="step-info">
											<span className="step-number">
												{index + 1}
											</span>
											<span className="step-title">
												{step.stepName}
											</span>
										</div>
									</td>
									<td className="contacts-entered">
										{step.contactsEntered}
									</td>
									<td className="contacts-completed">
										{step.contactsCompleted}
									</td>
									<td className="completion-rate">
										<span
											className={`rate-badge ${this.getCompletionRateClass(step.completionRate)}`}
										>
											{step.completionRate}%
										</span>
									</td>
									<td className="drop-off-rate">
										{step.dropOffRate > 0 && (
											<span className="drop-off-badge">
												{step.dropOffRate}%
											</span>
										)}
									</td>
									<td className="average-time">
										{step.averageTime}
									</td>
									<td className="performance">
										<div className="performance-indicator">
											{step.dropOffRate > 50 && (
												<span className="warning-indicator">
													⚠️ High Drop-off
												</span>
											)}
											{step.completionRate >= 90 && (
												<span className="success-indicator">
													✅ Excellent
												</span>
											)}
											{step.completionRate < 50 &&
												step.dropOffRate <= 50 && (
													<span className="caution-indicator">
														⚡ Needs Attention
													</span>
												)}
										</div>
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>

				<div className="insights-section">
					<h4>Key Insights</h4>
					<div className="insights-grid">
						<div className="insight-card bottleneck">
							<h5>🔍 Biggest Bottleneck</h5>
							<p>
								The "Wait X Days/Hours" step has a 75% drop-off
								rate. Consider reducing the wait time or adding
								engagement content.
							</p>
						</div>
						<div className="insight-card performance">
							<h5>📈 Best Performing</h5>
							<p>
								The "Entrance" and final "Apply List" steps have
								excellent completion rates. Use similar
								strategies for other steps.
							</p>
						</div>
						<div className="insight-card recommendation">
							<h5>💡 Recommendation</h5>
							<p>
								Focus on optimizing the wait step and the
								condition check to improve overall funnel
								performance.
							</p>
						</div>
					</div>
				</div>
			</div>
		);
	}
}

export default StepReport;
