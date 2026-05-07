import { __ } from '@wordpress/i18n';
import React from 'react';
import { Automation } from '@doublescale/client';

interface EmailAnalyticsProps {
	automation: Automation | null;
}

const EmailAnalytics: React.FC<EmailAnalyticsProps> = ({ automation }) => {
	return (
		<div className="email-analytics-container">
			<h1>Email Analytics</h1>
		</div>
	);
};

export default EmailAnalytics;
