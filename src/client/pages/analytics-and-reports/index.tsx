/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import apiFetch from '@wordpress/api-fetch';
import { useEffect, useState } from '@wordpress/element';
import { useDispatch } from '@wordpress/data';
import ContactsDealsReports from './contacts-deals-reports';

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
		</div>
	);
};

export default AnalyticsAndReports;
