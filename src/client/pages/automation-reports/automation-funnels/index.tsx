import React from 'react';
import type { Automation } from '@quillcrm/client';
import ChartReport from './chart-report';
import StepReport from './step-report';
import EmailAnalytics from './email-analytics';
import './style.scss';
import { __ } from '@wordpress/i18n';

interface AutomationFunnelProps {
	automation: Automation;
}

interface AutomationFunnelState {
	activeTab: string;
}

class AutomationFunnel extends React.Component<
	AutomationFunnelProps,
	AutomationFunnelState
> {
	constructor(props: AutomationFunnelProps) {
		super(props);
		this.state = {
			activeTab: 'chart-report',
		};
	}

	handleTabClick = (tabName: string) => {
		this.setState({ activeTab: tabName });
	};

	renderChartReport = () => {
		return <ChartReport automation={this.props.automation} />;
	};

	renderStepReport = () => {
		return <StepReport automation={this.props.automation} />;
	};

	renderEmailAnalytics = () => {
		return <EmailAnalytics automation={this.props.automation} />;
	};

	render() {
		const { activeTab } = this.state;

		return (
			<div className="qcrm-automation-reports__automation-funnels">
				<div className="qcrm-automation-reports__automation-funnels__header">
					<h1>{__('Automation Funnels', 'quillcrm')}</h1>
					<div className="funnel-info">
						<span>List Applied (Created at 2025-08-26)</span>
						<span>/</span>
						<span>Subscribers</span>
						<button className="re-apply-btn">
							Re-apply New Steps
						</button>
					</div>
				</div>

				<div className="tabs-container">
					<div className="tabs-header">
						<button
							className={`tab-button ${activeTab === 'chart-report' ? 'active' : ''}`}
							onClick={() => this.handleTabClick('chart-report')}
						>
							Chart Report
						</button>
						<button
							className={`tab-button ${activeTab === 'step-report' ? 'active' : ''}`}
							onClick={() => this.handleTabClick('step-report')}
						>
							Step Report
						</button>
						<button
							className={`tab-button ${activeTab === 'email-analytics' ? 'active' : ''}`}
							onClick={() =>
								this.handleTabClick('email-analytics')
							}
						>
							Emails Analytics
						</button>
					</div>

					<div className="tab-content">
						{activeTab === 'chart-report' &&
							this.renderChartReport()}
						{activeTab === 'step-report' && this.renderStepReport()}
						{activeTab === 'email-analytics' &&
							this.renderEmailAnalytics()}
					</div>
				</div>
			</div>
		);
	}
}

export default AutomationFunnel;
