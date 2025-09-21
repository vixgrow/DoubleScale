import React from 'react';
import type { Automation } from '@quillcrm/client';
import ChartReport from './chart-report';
import StepReport from './step-report';
import EmailAnalytics from './email-analytics';
import './style.scss';
import { __ } from '@wordpress/i18n';
import { convertDate } from '@quillcrm/utils';
import { NavLink } from '@quillcrm/navigation';

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
					<div className="funnel-info">
						<NavLink to={`automations`}>
							{__('Automation Funnels', 'quillcrm')}
						</NavLink>
						<span>/</span>
						<NavLink
							to={`automations/${this.props.automation?.id}`}
						>
							{this.props.automation?.name} (
							{__('Created at', 'quillcrm')}:{' '}
							{convertDate(this.props.automation?.created_at)})
						</NavLink>
					</div>
				</div>

				<div className="tabs-container">
					<div className="tabs-header">
						<button
							className={`tab-button ${activeTab === 'chart-report' ? 'active' : ''}`}
							onClick={() => this.handleTabClick('chart-report')}
						>
							{__('Chart Report', 'quillcrm')}
						</button>
						<button
							className={`tab-button ${activeTab === 'step-report' ? 'active' : ''}`}
							onClick={() => this.handleTabClick('step-report')}
						>
							{__('Step Report', 'quillcrm')}
						</button>
						<button
							className={`tab-button ${activeTab === 'email-analytics' ? 'active' : ''}`}
							onClick={() =>
								this.handleTabClick('email-analytics')
							}
						>
							{__('Emails Analytics', 'quillcrm')}
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
