/**
 * WordPress dependencies
 */
import { useState, useEffect, useCallback } from '@wordpress/element';
import apiFetch from '@wordpress/api-fetch';
import { addQueryArgs } from '@wordpress/url';
import { __ } from '@wordpress/i18n';
import { useDispatch } from '@wordpress/data';

/**
 * External dependencies
 */
import dayjs from 'dayjs';

/**
 * Internal dependencies
 */
import type {
	DashboardData,
	ContactAnalytics,
	EmailsAnalytics,
} from '@doublescale/client';

// Dashboard data hook
export const useDashboardData = () => {
	const [data, setData] = useState<DashboardData | null>(null);
	const [loading, setLoading] = useState(true);
	const { createNotice } = useDispatch('doublescale/core');

	const fetchDashboardData = useCallback(async () => {
		setLoading(true);
		try {
			const response = (await apiFetch({
				path: addQueryArgs('/qc/v1/general/dashboard'),
			})) as DashboardData;

			setData(response);
		} catch (error) {
			createNotice({
				type: 'error',
				message: __('Error fetching dashboard data', 'doublescale'),
			});
		} finally {
			setLoading(false);
		}
	}, [createNotice]);

	useEffect(() => {
		fetchDashboardData();
	}, [fetchDashboardData]);

	return { data, loading, refetch: fetchDashboardData };
};

// Contact analytics hook
export const useContactAnalytics = () => {
	const [data, setData] = useState<ContactAnalytics | null>(null);
	const [loading, setLoading] = useState(true);
	const [interval, setInterval] = useState<string>('today');
	const [startDate, setStartDate] = useState<Date>(new Date());
	const [endDate, setEndDate] = useState<Date>(new Date());
	const { createNotice } = useDispatch('doublescale/core');

	const fetchContactAnalytics = useCallback(async () => {
		setLoading(true);
		try {
			const response = (await apiFetch({
				path: addQueryArgs('/qc/v1/contacts/analytics', {
					interval,
					start_date: dayjs(startDate).format('YYYY-MM-DD'),
					end_date: dayjs(endDate).format('YYYY-MM-DD'),
				}),
			})) as ContactAnalytics;

			setData(response);
		} catch (error) {
			createNotice({
				type: 'error',
				message: __('Error fetching analytics data', 'doublescale'),
			});
		} finally {
			setLoading(false);
		}
	}, [interval, startDate, endDate, createNotice]);

	useEffect(() => {
		fetchContactAnalytics();
	}, [fetchContactAnalytics]);

	return {
		data,
		loading,
		interval,
		startDate,
		endDate,
		setInterval,
		setStartDate,
		setEndDate,
		refetch: fetchContactAnalytics,
	};
};

// Email analytics hook
export const useEmailAnalytics = () => {
	const [data, setData] = useState<EmailsAnalytics | null>(null);
	const [loading, setLoading] = useState(true);
	const [interval, setInterval] = useState<string>('today');
	const [startDate, setStartDate] = useState<Date>(new Date());
	const [endDate, setEndDate] = useState<Date>(new Date());
	const { createNotice } = useDispatch('doublescale/core');

	const fetchEmailAnalytics = useCallback(async () => {
		setLoading(true);
		try {
			const response = (await apiFetch({
				path: addQueryArgs('/qc/v1/campaigns/analytics', {
					channel: 'email',
					interval,
					start_date: dayjs(startDate).format('YYYY-MM-DD'),
					end_date: dayjs(endDate).format('YYYY-MM-DD'),
				}),
			})) as EmailsAnalytics;

			setData(response);
		} catch (error) {
			createNotice({
				type: 'error',
				message: __('Error fetching analytics data', 'doublescale'),
			});
		} finally {
			setLoading(false);
		}
	}, [interval, startDate, endDate, createNotice]);

	useEffect(() => {
		fetchEmailAnalytics();
	}, [fetchEmailAnalytics]);

	return {
		data,
		loading,
		interval,
		startDate,
		endDate,
		setInterval,
		setStartDate,
		setEndDate,
		refetch: fetchEmailAnalytics,
	};
};
