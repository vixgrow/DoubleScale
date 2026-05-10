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
	const [loading, setLoading] = useState<boolean>(true);
	const { createNotice } = useDispatch('doublescale/core');

	useEffect(() => {
		if (id) {
			fetchAutomation();
		}
	}, [id]);

	const fetchAutomation = async () => {
		setLoading(true);
		try {
			const response = (await apiFetch({
				path: `/doublescale/v1/automations/${id}`,
			})) as Automation;

			setAutomation(response);
		} catch (error: any) {
			createNotice({
				type: 'error',
				message:
					error.message ||
					__('Failed to fetch automation', 'doublescale'),
			});
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="doublescale-automation-reports">
			<AutomationFunnel automation={automation} loading={loading} />
		</div>
	);
};

export default AutomationReports;
