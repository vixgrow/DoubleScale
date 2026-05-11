/**
 * WordPress dependencies
 */
import { useState, useEffect } from '@wordpress/element';
import apiFetch from '@wordpress/api-fetch';
import { addQueryArgs } from '@wordpress/url';
import { __ } from '@wordpress/i18n';
import { useDispatch } from '@wordpress/data';

import dayjs from 'dayjs';
import { Mail as MailOutlined, Eye as EyeOutlined, Link as LinkOutlined } from 'lucide-react';
import { map } from 'lodash';
import '../../lib/chart-setup';
import { Line } from 'react-chartjs-2';

/**
 * Internal dependencies
 */
import './style.scss';
import type { EmailsAnalytics as EmailAnalyticsData } from '@doublescale/client';
import { NavLink } from '@doublescale/navigation';
import { convertDate, formatDate } from '@doublescale/utils';
import { DateFilter } from '@doublescale/components';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

const EmailAnalytics: React.FC = () => {
	const [data, setData] = useState<EmailAnalyticsData | null>(null);
	const [loading, setLoading] = useState(true);
	const [interval, setInterval] = useState<string>('today');
	const [startDate, setStartDate] = useState<Date>(new Date());
	const [endDate, setEndDate] = useState<Date>(new Date());
	const { createNotice } = useDispatch('doublescale/core');

	const fetchEmailAnalytics = async () => {
		setLoading(true);
		try {
			const response = (await apiFetch({
				path: addQueryArgs('/doublescale/v1/campaigns/analytics', {
					channel: 'email',
					interval,
					start_date: dayjs(startDate).format('YYYY-MM-DD'),
					end_date: dayjs(endDate).format('YYYY-MM-DD'),
				}),
			})) as EmailAnalyticsData;

			setData(response);
		} catch (error) {
			createNotice({
				type: 'error',
				message: __('Error fetching analytics data', 'doublescale'),
			});
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchEmailAnalytics();
	}, []);

	if (!data || loading) {
		return <Skeleton className='h-4 w-full' />;
	}

	return (
        <div className='flex gap-5 flex-col'>
            <div className='flex gap-5'>
				<Card className="doublescale-dashboard-card"><CardContent>
                        <div className='flex gap-2.5 flex-col'>
                            <div className='flex gap-2.5'>
                                <div className="doublescale-dashboard-card-icon">
                                    <MailOutlined style={{ fontSize: 16 }} />
                                </div>
                                <span>
                                    {__('Total Sent', 'doublescale')}
                                </span>
                            </div>
                            <span className="doublescale-dashboard-card-value">
                                {data.total}
                            </span>
                        </div>
                    </CardContent></Card>
				<Card className="doublescale-dashboard-card"><CardContent>
                        <div className='flex gap-2.5 flex-col'>
                            <div className='flex gap-2.5'>
                                <div className="doublescale-dashboard-card-icon">
                                    <EyeOutlined style={{ fontSize: 16 }} />
                                </div>
                                <span>
                                    {__('Total Opened', 'doublescale')}
                                </span>
                            </div>
                            <span className="doublescale-dashboard-card-value">
                                {data.total_opened || 0}
                            </span>
                        </div>
                    </CardContent></Card>
				<Card className="doublescale-dashboard-card"><CardContent>
                        <div className='flex gap-2.5 flex-col'>
                            <div className='flex gap-2.5'>
                                <div className="doublescale-dashboard-card-icon">
                                    <LinkOutlined style={{ fontSize: 16 }} />
                                </div>
                                <span>
                                    {__('Total Clicked', 'doublescale')}
                                </span>
                            </div>
                            <span className="doublescale-dashboard-card-value">
                                {data.total_clicked || 0}
                            </span>
                        </div>
                    </CardContent></Card>
			</div>
            <DateFilter
				interval={interval}
				startDate={startDate}
				endDate={endDate}
				onIntervalChange={(value) => setInterval(value)}
				onChangeFromDate={(date) => setStartDate(date)}
				onChangeToDate={(date) => setEndDate(date)}
				onSubmit={fetchEmailAnalytics}
			/>
            <div className='flex gap-5'>
				<Card style={{ flex: 1 }}><CardHeader className='flex flex-row items-center justify-between'><CardTitle>{__('Email Analytics', 'doublescale')}</CardTitle>{<NavLink to="campaigns">
							{__('View All', 'doublescale')}
						</NavLink>}</CardHeader><CardContent>
                        <Line
                            data={{
                                labels: map(data.data.dates, (date) => {
                                    return formatDate(date, data.data.type);
                                }),
                                datasets: [
                                    {
                                        label: __('Emails', 'doublescale'),
                                        data: map(data.data.dates, (date) => {
                                            return data.email[date]
                                                ? data.email[date]
                                                : 0;
                                        }),
                                        borderColor: '#6d78d8',
                                        backgroundColor: '#6d78d8',
                                    },
                                ],
                            }}
                            options={{
                                scales: {
                                    x: {
                                        grid: {
                                            display: false,
                                        },
                                    },
                                    y: {
                                        beginAtZero: true,
                                        max: parseInt(data.total) + 10,
                                    },
                                },
                                plugins: {
                                    tooltip: {
                                        callbacks: {
                                            label: function (context) {
                                                return `Date: ${convertDate(data.data.dates[context.dataIndex])}`;
                                            },
                                            title: function (context) {
                                                return `Emails: ${data.email[data.data.dates[context[0].dataIndex]]}`;
                                            },
                                        },
                                    },
                                },
                            }}
                            height={70}
                        />
                    </CardContent></Card>
			</div>
        </div>
    );
};

export default EmailAnalytics;
