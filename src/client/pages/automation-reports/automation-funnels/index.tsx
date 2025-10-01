import React, { useState } from 'react';
import type { Automation } from '@quillcrm/client';
import ChartReport from './chart-report';
import StepReport from './step-report';
import EmailAnalytics from './email-analytics';
import './style.scss';
import { __ } from '@wordpress/i18n';
import { convertDate } from '@quillcrm/utils';
import { NavLink } from '@quillcrm/navigation';

interface AutomationFunnelProps {
	automation: Automation | null;
}

const AutomationFunnel: React.FC<AutomationFunnelProps> = ({ automation }) => {
	const [activeTab, setActiveTab] = useState('chart-report');

	const handleTabClick = (tabName: string) => {
		setActiveTab(tabName);
	};

	const renderChartReport = () => {
		return <ChartReport automation={automation} />;
	};

	const renderStepReport = () => {
		return <StepReport automation={automation} />;
	};

	const renderEmailAnalytics = () => {
		return <EmailAnalytics automation={automation} />;
	};

	return (
		<div className="qcrm-automation-reports__automation-funnels">
			<div className="qcrm-automation-reports__automation-funnels__header">
				<div className="funnel-info">
					<NavLink to={`automations`}>
						{__('Automation Funnels', 'quillcrm')}
					</NavLink>
					<span>/</span>
					<NavLink to={`automations/${automation?.id}`}>
						{automation?.name} ({__('Created at', 'quillcrm')}:{' '}
						{convertDate(automation?.created_at || '')})
					</NavLink>
				</div>
			</div>

			<div className="tabs-container">
				<div className="tabs-header">
					<button
						className={`tab-button ${activeTab === 'chart-report' ? 'active' : ''}`}
						onClick={() => handleTabClick('chart-report')}
					>
						{__('Chart Report', 'quillcrm')}
					</button>
					<button
						className={`tab-button ${activeTab === 'step-report' ? 'active' : ''}`}
						onClick={() => handleTabClick('step-report')}
					>
						{__('Step Report', 'quillcrm')}
					</button>
					<button
						className={`tab-button ${activeTab === 'email-analytics' ? 'active' : ''}`}
						onClick={() => handleTabClick('email-analytics')}
					>
						{__('Emails Analytics', 'quillcrm')}
					</button>
				</div>

				<div className="tab-content">
					{activeTab === 'chart-report' && renderChartReport()}
					{activeTab === 'step-report' && renderStepReport()}
					{activeTab === 'email-analytics' && renderEmailAnalytics()}
				</div>
			</div>
		</div>
	);
};

export default AutomationFunnel;
