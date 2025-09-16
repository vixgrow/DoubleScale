/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import ContactsDealsReports from './contacts-deals-reports';
import DealsReportsByDate from './deals-reports-by-date';

/**
 * External dependencies
 */

/**
 * Internal dependencies
 */

const AnalyticsAndReports: React.FC = () => {
	return (
		<div className="text-5xl font-bold">
			<h2 className="text-2xl font-bold">Analytics and Reports</h2>
			<ContactsDealsReports />
			<DealsReportsByDate />
		</div>
	);
};

export default AnalyticsAndReports;
