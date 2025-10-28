import React from 'react';
import type { Automation } from '@quillcrm/client';
import ChartReport from './chart-report';
import StepReport from './step-report';
// eslint-disable-next-line @typescript-eslint/no-unused-vars, no-unused-vars
import EmailAnalytics from './email-analytics';
import './style.scss';
import { __ } from '@wordpress/i18n';

interface AutomationFunnelProps {
	automation: Automation | null;
}

const AutomationFunnel: React.FC<AutomationFunnelProps> = ({ automation }) => {
	const renderChartReport = () => {
		return <ChartReport automation={automation} />;
	};

	const renderStepReport = () => {
		return <StepReport automation={automation} />;
	};

	// const renderEmailAnalytics = () => {
	// 	return <EmailAnalytics automation={automation} />;
	// };

	return (
		<div className="qcrm-automation-reports__automation-funnels px-8 py-5 h-screen">
			<div className="qcrm-automation-reports__automation-funnels__header mb-4">
				<h1 className="text-3xl font-semibold text-[#09090B]">{__('Analytics', 'quillcrm')}</h1>
			</div>

			<div className="reports-container">
				<div className="report-card">
					<div className="report-card__content">
						{renderChartReport()}
					</div>
				</div>

				<div className="report-card">
					<div className="report-card__content">
						{renderStepReport()}
					</div>
				</div>

				{/* <div className="report-card">
					<div className="report-card__header">
						<h2 className="report-card__title">{__('Emails Analytics', 'quillcrm')}</h2>
					</div>
					<div className="report-card__content">
						{renderEmailAnalytics()}
					</div>
				</div> */}
			</div>
		</div>
	);
};

export default AutomationFunnel;
