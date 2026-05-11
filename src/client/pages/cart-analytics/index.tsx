/**
 * WordPress dependencies
 */
import { useState, useEffect } from '@wordpress/element';
import apiFetch from '@wordpress/api-fetch';
import { addQueryArgs } from '@wordpress/url';
import { __ } from '@wordpress/i18n';
import { useDispatch } from '@wordpress/data';

import { User as UserOutlined, Mail as MailOutlined } from 'lucide-react';
import dayjs from 'dayjs';
import { map } from 'lodash';
import '../../lib/chart-setup';
import { Line } from 'react-chartjs-2';

/**
 * Internal dependencies
 */
import './style.scss';
import type { CartAnalytics as CartAnalyticsData } from '@doublescale/client';
import { NavLink } from '@doublescale/navigation';
import { convertDate, formatDate } from '@doublescale/utils';
import { DateFilter } from '@doublescale/components';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

const CartAnalytics: React.FC = () => {
	const [data, setData] = useState<CartAnalyticsData | null>(null);
	const [loading, setLoading] = useState(true);
	const [interval, setInterval] = useState<string>('today');
	const [startDate, setStartDate] = useState<Date>(new Date());
	const [endDate, setEndDate] = useState<Date>(new Date());
	const { createNotice } = useDispatch('doublescale/core');

	const fetchCartAnalytics = async () => {
		setLoading(true);
		try {
			const response = (await apiFetch({
				path: addQueryArgs('/doublescale/v1/abandoned-carts/analytics', {
					interval,
					start_date: dayjs(startDate).format('YYYY-MM-DD'),
					end_date: dayjs(endDate).format('YYYY-MM-DD'),
				}),
			})) as CartAnalyticsData;

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
		fetchCartAnalytics();
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
                                    <UserOutlined style={{ fontSize: 16 }} />
                                </div>
                                <span>
                                    {__('Total Carts', 'doublescale')}
                                </span>
                            </div>
                            <span className="doublescale-dashboard-card-value">
                                {data.total.carts}
                            </span>
                        </div>
                    </CardContent></Card>
				<Card className="doublescale-dashboard-card"><CardContent>
                        <div className='flex gap-2.5 flex-col'>
                            <div className='flex gap-2.5'>
                                <div className="doublescale-dashboard-card-icon">
                                    <MailOutlined style={{ fontSize: 16 }} />
                                </div>
                                <span>
                                    {__('Total Revenue', 'doublescale')}
                                </span>
                            </div>
                            <span className="doublescale-dashboard-card-value">
                                {data.total.revenue}
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
				onSubmit={fetchCartAnalytics}
			/>
            <div className='flex gap-5'>
				<Card style={{ flex: 1 }}><CardHeader className='flex flex-row items-center justify-between'><CardTitle>{__('Cart Analytics', 'doublescale')}</CardTitle>{<NavLink to="abandoned-carts">
							{__('View All', 'doublescale')}
						</NavLink>}</CardHeader><CardContent>
                        <Line
                            data={{
                                labels: map(data.data.dates, (date) => {
                                    return formatDate(date, data.data.type);
                                }),
                                datasets: [
                                    {
                                        label: __('Carts', 'doublescale'),
                                        data: map(data.data.dates, (date) => {
                                            return data.carts[date]
                                                ? data.carts[date]
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
                                        max: data.total.carts + 10,
                                    },
                                },
                                plugins: {
                                    tooltip: {
                                        callbacks: {
                                            label: function (context) {
                                                return `Date: ${convertDate(data.data.dates[context.dataIndex])}`;
                                            },
                                            title: function (context) {
                                                return `Carts: ${data.carts[data.data.dates[context[0].dataIndex]]}`;
                                            },
                                        },
                                    },
                                },
                            }}
                            height={100}
                        />
                    </CardContent></Card>
				<Card style={{ flex: 1 }}><CardHeader className='flex flex-row items-center justify-between'><CardTitle>{__('Revenue', 'doublescale')}</CardTitle>{<NavLink to="abandoned-carts">
							{__('View All', 'doublescale')}
						</NavLink>}</CardHeader><CardContent>
                        <Line
                            data={{
                                labels: map(data.data.dates, (date) => {
                                    return formatDate(date, data.data.type);
                                }),
                                datasets: [
                                    {
                                        label: __('Revenue', 'doublescale'),
                                        data: map(data.data.dates, (date) => {
                                            return data.revenue[date]
                                                ? data.revenue[date]
                                                : 0;
                                        }),
                                        borderColor: '#6d78d8',
                                        backgroundColor: '#6d78d8',
                                        fill: false,
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
                                        max:
                                            parseInt(
                                                data.total.revenue.toString()
                                            ) + 10,
                                    },
                                },
                                plugins: {
                                    tooltip: {
                                        callbacks: {
                                            label: function (context) {
                                                return `Date: ${convertDate(data.data.dates[context.dataIndex])}`;
                                            },
                                            title: function (context) {
                                                return `Revenue: ${data.revenue[data.data.dates[context[0].dataIndex]]}`;
                                            },
                                        },
                                    },
                                },
                            }}
                            height={100}
                        />
                    </CardContent></Card>
			</div>
        </div>
    );
};

export default CartAnalytics;
