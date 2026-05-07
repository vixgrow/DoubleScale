/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import apiFetch from '@wordpress/api-fetch';
import { useEffect, useState } from '@wordpress/element';
import { useDispatch } from '@wordpress/data';

/**
 * External dependencies
 */
import { useParams } from '@doublescale/navigation';

/**
 * Internal dependencies
 */
import './style.scss';
import type { Automation } from '@doublescale/client';
import AutomationFunnel from './automation-funnels';

const AutomationReports: React.FC = () => {
	const { id } = useParams<{ id: string }>();
	const [automation, setAutomation] = useState<Automation | null>(null);
	const { createNotice } = useDispatch('doublescale/core');

	useEffect(() => {
		if (id) {
			fetchAutomation();
		}
	}, [id]);

	const fetchAutomation = async () => {
		try {
			const response = (await apiFetch({
				path: `/qc/v1/automations/${id}`,
			})) as Automation;

			setAutomation(response);
		} catch (error: any) {
			createNotice({
				type: 'error',
				message:
					error.message ||
					__('Failed to fetch automation', 'doublescale'),
			});
		}
	};

	return (
		<div className="qcrm-automation-reports">
			<AutomationFunnel automation={automation} />
		</div>
	);
};

export default AutomationReports;
