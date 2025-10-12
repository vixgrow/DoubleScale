import React, { useState, useEffect } from 'react';
import { __ } from '@wordpress/i18n';
import apiFetch from '@wordpress/api-fetch';
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Eye, MousePointer, Mail, Users, Calendar } from 'lucide-react';
import { END_POINT } from '../../constants';
import { SequenceMailReport } from '../../types';

interface SequenceReportsModalProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	sequenceId: string;
	emailId: number;
	emailName?: string;
}

const SequenceReportsModal: React.FC<SequenceReportsModalProps> = ({
	open,
	onOpenChange,
	sequenceId,
	emailId,
	emailName = 'Email Report',
}) => {
	const [loading, setLoading] = useState(true);
	const [reportData, setReportData] = useState<SequenceMailReport | null>(
		null
	);

	useEffect(() => {
		if (open && emailId) {
			fetchReportData();
		}
	}, [open, emailId]);

	const fetchReportData = async () => {
		setLoading(true);
		try {
			const response = await apiFetch<SequenceMailReport>({
				path: END_POINT + `/${emailId}/reports`,
			});
			setReportData(response);
		} catch (error: any) {
			// If the endpoint doesn't exist yet, show mock data
			console.warn('Reports endpoint not found, showing mock data');
		} finally {
			setLoading(false);
		}
	};

	const getStatusBadge = (recipient: SequenceMailReport['recipients'][0]) => {
		if (recipient.clicked_at) {
			return (
				<Badge
					variant="default"
					className="flex items-center gap-1 bg-green-500"
				>
					<MousePointer size={12} />
					{__('Clicked', 'quillcrm')}
				</Badge>
			);
		}
		if (recipient.opened_at) {
			return (
				<Badge
					variant="secondary"
					className="flex items-center gap-1 bg-blue-500 text-white"
				>
					<Eye size={12} />
					{__('Opened', 'quillcrm')}
				</Badge>
			);
		}
		if (recipient.status === 'sent') {
			return (
				<Badge
					variant="default"
					className="flex items-center gap-1 bg-blue-500 text-white"
				>
					<Mail size={12} />
					{__('Sent', 'quillcrm')}
				</Badge>
			);
		}
		if (recipient.status === 'pending') {
			return (
				<Badge
					variant="default"
					className="flex items-center gap-1 bg-blue-500 text-white"
				>
					<Mail size={12} />
					{__('Pending', 'quillcrm')}
				</Badge>
			);
		}
		if (recipient.status === 'failed') {
			return (
				<Badge
					variant="default"
					className="flex items-center gap-1 bg-red-500 text-white"
				>
					<Mail size={12} />
					{__('Failed', 'quillcrm')}
				</Badge>
			);
		}
		return (
			<Badge
				variant="default"
				className="flex items-center gap-1 bg-gray-500 text-white"
			>
				<Mail size={12} />
				{__('Unknown', 'quillcrm')}
			</Badge>
		);
	};

	const formatDate = (dateString: string) => {
		return new Date(dateString).toLocaleString();
	};

	const StatCard = ({
		icon: Icon,
		title,
		value,
		subtitle,
		color = 'text-blue-500',
	}: {
		icon: any;
		title: string;
		value: string | number;
		subtitle?: string;
		color?: string;
	}) => (
		<Card>
			<CardContent className="p-4">
				<div className="flex items-center space-x-3">
					<div className={`p-2 rounded-lg bg-gray-100 ${color}`}>
						<Icon size={20} />
					</div>
					<div>
						<p className="text-sm text-gray-600">{title}</p>
						<p className="text-2xl font-bold">{value}</p>
						{subtitle && (
							<p className="text-xs text-gray-500">{subtitle}</p>
						)}
					</div>
				</div>
			</CardContent>
		</Card>
	);

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2">
						<Eye size={20} />
						{__('Email Reports', 'quillcrm')}: {emailName}
					</DialogTitle>
				</DialogHeader>

				{loading ? (
					<div className="flex items-center justify-center py-8">
						<div className="text-center">
							<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
							{__('Loading reports...', 'quillcrm')}
						</div>
					</div>
				) : reportData ? (
					<Tabs defaultValue="overview" className="w-full">
						<TabsList className="grid w-full grid-cols-2">
							<TabsTrigger value="overview">
								{__('Overview', 'quillcrm')}
							</TabsTrigger>
							<TabsTrigger value="recipients">
								{__('Recipients', 'quillcrm')}
							</TabsTrigger>
						</TabsList>

						<TabsContent value="overview" className="space-y-4">
							<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
								<StatCard
									icon={Mail}
									title={__('Sent', 'quillcrm')}
									value={reportData.sent}
									subtitle={`${reportData.sent_rate}% rate`}
									color="text-blue-500"
								/>
								<StatCard
									icon={Eye}
									title={__('Opened', 'quillcrm')}
									value={reportData.opened}
									subtitle={`${reportData.open_rate}% rate`}
									color="text-green-500"
								/>
								<StatCard
									icon={MousePointer}
									title={__('Clicked', 'quillcrm')}
									value={reportData.click}
									subtitle={`${reportData.click_rate}% rate`}
									color="text-purple-500"
								/>
							</div>

							<Card>
								<CardHeader>
									<CardTitle>
										{__('Performance Summary', 'quillcrm')}
									</CardTitle>
								</CardHeader>
								<CardContent>
									<div className="space-y-3">
										<div className="flex justify-between items-center">
											<span>
												{__('Sent Rate', 'quillcrm')}
											</span>
											<div className="flex items-center gap-2">
												<div className="w-32 bg-gray-200 rounded-full h-2">
													<div
														className="bg-blue-500 h-2 rounded-full"
														style={{
															width: `${reportData.sent_rate}%`,
														}}
													></div>
												</div>
												<span className="font-medium">
													{reportData.sent_rate}%
												</span>
											</div>
										</div>
										<div className="flex justify-between items-center">
											<span>
												{__('Open Rate', 'quillcrm')}
											</span>
											<div className="flex items-center gap-2">
												<div className="w-32 bg-gray-200 rounded-full h-2">
													<div
														className="bg-green-500 h-2 rounded-full"
														style={{
															width: `${reportData.open_rate}%`,
														}}
													></div>
												</div>
												<span className="font-medium">
													{reportData.open_rate}%
												</span>
											</div>
										</div>
										<div className="flex justify-between items-center">
											<span>
												{__('Click Rate', 'quillcrm')}
											</span>
											<div className="flex items-center gap-2">
												<div className="w-32 bg-gray-200 rounded-full h-2">
													<div
														className="bg-purple-500 h-2 rounded-full"
														style={{
															width: `${reportData.click_rate}%`,
														}}
													></div>
												</div>
												<span className="font-medium">
													{reportData.click_rate}%
												</span>
											</div>
										</div>
									</div>
								</CardContent>
							</Card>
						</TabsContent>

						<TabsContent value="recipients" className="space-y-4">
							<Card>
								<CardHeader>
									<CardTitle className="flex items-center gap-2">
										<Users size={20} />
										{__('Recipients', 'quillcrm')} (
										{reportData.recipients.length})
									</CardTitle>
								</CardHeader>
								<CardContent>
									<div className="space-y-2">
										{reportData.recipients.map(
											(recipient) => (
												<div
													key={recipient.id}
													className="flex items-center justify-between p-3 border rounded-lg"
												>
													<div className="flex items-center space-x-3">
														<div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
															{recipient.name
																.charAt(0)
																.toUpperCase()}
														</div>
														<div>
															<p className="font-medium">
																{recipient.name}
															</p>
															<p className="text-sm text-gray-500">
																{
																	recipient.email
																}
															</p>
														</div>
													</div>
													<div className="flex items-center space-x-3">
														{getStatusBadge(
															recipient
														)}
														<div className="text-right text-sm text-gray-500">
															<div className="flex items-center gap-1">
																<Calendar
																	size={12}
																/>
																{formatDate(
																	recipient.sent_at
																)}
															</div>
															{recipient.opened_at && (
																<div className="text-xs text-green-600">
																	{__(
																		'Opened',
																		'quillcrm'
																	)}
																	:{' '}
																	{formatDate(
																		recipient.opened_at
																	)}
																</div>
															)}
															{recipient.clicked_at && (
																<div className="text-xs text-purple-600">
																	{__(
																		'Clicked',
																		'quillcrm'
																	)}
																	:{' '}
																	{formatDate(
																		recipient.clicked_at
																	)}
																</div>
															)}
														</div>
													</div>
												</div>
											)
										)}
									</div>
								</CardContent>
							</Card>
						</TabsContent>
					</Tabs>
				) : (
					<div className="text-center py-8">
						<p>{__('No report data available', 'quillcrm')}</p>
					</div>
				)}
			</DialogContent>
		</Dialog>
	);
};

export default SequenceReportsModal;
