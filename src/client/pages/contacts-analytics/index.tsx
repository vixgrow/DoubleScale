/**
 * WordPress dependencies
 */
import { useState, useEffect } from '@wordpress/element';
import apiFetch from '@wordpress/api-fetch';
import { addQueryArgs } from '@wordpress/url';
import { __ } from '@wordpress/i18n';
import { useDispatch } from '@wordpress/data';

import dayjs from 'dayjs';
import { User as UserOutlined, UserMinus as UserDeleteOutlined } from 'lucide-react';
import { map } from 'lodash';
import '../../lib/chart-setup';
import { Line } from 'react-chartjs-2';

/**
 * Internal dependencies
 */
import './style.scss';
import type { ContactAnalytics as ContactAnalyticsData } from '@doublescale/client';
import { NavLink } from '@doublescale/navigation';
import { convertDate, formatDate } from '@doublescale/utils';
import { DateFilter } from '@doublescale/components';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

const ContactAnalytics: React.FC = () => {
	const [data, setData] = useState<ContactAnalyticsData | null>(null);
	const [loading, setLoading] = useState(true);
	const [interval, setInterval] = useState<string>('today');
	const [startDate, setStartDate] = useState<Date>(new Date());
	const [endDate, setEndDate] = useState<Date>(new Date());
	const { createNotice } = useDispatch('doublescale/core');

	const fetchContactAnalytics = async () => {
		setLoading(true);
		try {
			const response = (await apiFetch({
				path: addQueryArgs('/doublescale/v1/contacts/analytics', {
					interval,
					start_date: dayjs(startDate).format('YYYY-MM-DD'),
					end_date: dayjs(endDate).format('YYYY-MM-DD'),
				}),
			})) as ContactAnalyticsData;

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
		fetchContactAnalytics();
	}, []);

	if (loading) {
		return <Skeleton className="h-4 w-full" />;
	}

	if (!data) {
		return (
			<div className="flex flex-col items-center gap-4 py-8">
				<p className="text-center text-muted-foreground">
					{__(
						'Could not load analytics. Check your connection or try again.',
						'doublescale'
					)}
				</p>
				<Button type="button" onClick={() => void fetchContactAnalytics()}>
					{__('Try again', 'doublescale')}
				</Button>
			</div>
		);
	}

	return (
        <div className='flex gap-5 flex-col'>
            <div className='flex gap-5'>
				<Card className="doublescale-dashboard-card"><CardContent>
                        <div className='flex gap-2.5 flex-col'>
                            <div className='flex gap-2.5'>
                                <div className="doublescale-dashboard-card-icon">
                                    <UserOutlined style={{ fontSize: 16 }} />
                                </div>
                                <span>
                                    {__('Total Contacts', 'doublescale')}
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
                                    <UserOutlined style={{ fontSize: 16 }} />
                                </div>
                                <span>
                                    {__('Total Subscribers', 'doublescale')}
                                </span>
                            </div>
                            <span className="doublescale-dashboard-card-value">
                                {data.total_subscribed}
                            </span>
                        </div>
                    </CardContent></Card>
				<Card className="doublescale-dashboard-card"><CardContent>
                        <div className='flex gap-2.5 flex-col'>
                            <div className='flex gap-2.5'>
                                <div className="doublescale-dashboard-card-icon">
                                    <UserDeleteOutlined style={{ fontSize: 16 }} />
                                </div>
                                <span>
                                    {__('Total Unsubscribers', 'doublescale')}
                                </span>
                            </div>
                            <span className="doublescale-dashboard-card-value">
                                {data.total_unsubscribed}
                            </span>
                        </div>
                    </CardContent></Card>
			</div>
            <div className='flex gap-5 items-end'>
				<DateFilter
					interval={interval}
					startDate={startDate}
					endDate={endDate}
					onIntervalChange={(value) => setInterval(value)}
					onChangeFromDate={(date) => setStartDate(date)}
					onChangeToDate={(date) => setEndDate(date)}
					onSubmit={fetchContactAnalytics}
				/>
			</div>
            <div className='flex gap-5'>
				<Card style={{ flex: 1 }}><CardHeader className='flex flex-row items-center justify-between'><CardTitle>{__('Contact Analytics', 'doublescale')}</CardTitle>{<NavLink to="contacts">
							{__('View All', 'doublescale')}
						</NavLink>}</CardHeader><CardContent>
                        <Line
                            data={{
                                labels: map(data.data.dates, (date) => {
                                    return formatDate(date, data.data.type);
                                }),
                                datasets: [
                                    {
                                        label: __('Contacts', 'doublescale'),
                                        data: map(data.data.dates, (date) => {
                                            return data.contacts[date]
                                                ? data.contacts[date]
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
                                                return `Contacts: ${data.contacts[data.data.dates[context[0].dataIndex]]}`;
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

export default ContactAnalytics;
