/**
 * Cron Jobs Component
 *
 * Extracted from SystemSettings for nested tabs
 *
 * @since 1.0.0
 * @package DoubleScale
 */

import { useState, useEffect } from '@wordpress/element';
import apiFetch from '@wordpress/api-fetch';
import { __ } from '@wordpress/i18n';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
	Terminal,
	RefreshCw,
} from 'lucide-react';
import { AlertTriangleIcon, CopyIcon, PlayIcon, TimerBlockIcon, ExternalLinkIcon } from '@doublescale/components';

interface CronEvent {
	hook: string;
	is_overdue: boolean;
	human_name: string;
	next_run: string;
	last_run: string;
	interval: number;
}

interface ServerInfo {
	memory_limit: string;
	usage_percent: number;
	max_execution_time: string;
	has_server_cron: boolean;
	cron_url: string;
	site_path: string;
}

interface CronStatus {
	cron_events: CronEvent[];
	server: ServerInfo;
}

const CronJobs: React.FC = () => {
	const [cronStatus, setCronStatus] = useState<CronStatus | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [runningHook, setRunningHook] = useState<string | null>(null);
	const [copiedText, setCopiedText] = useState<string | null>(null);
	const [autoRefresh, setAutoRefresh] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [runError, setRunError] = useState<string | null>(null);

	const fetchCronStatus = async () => {
		try {
			setError(null);
			const response = await apiFetch({
				path: '/doublescale/v1/settings/cron-status',
			});
			setCronStatus(response as CronStatus);
		} catch (error) {
			console.error('Failed to fetch cron status:', error);
			setError(
				__(
					'Failed to load system status. Please refresh the page.',
					'doublescale'
				)
			);
		} finally {
			setIsLoading(false);
		}
	};

	const runCron = async (hook: string) => {
		setRunningHook(hook);
		setRunError(null);
		try {
			await apiFetch({
				path: '/doublescale/v1/settings/run-cron',
				method: 'POST',
				data: { hook },
			});
			await fetchCronStatus();
		} catch (error: any) {
			console.error('Failed to run cron:', error);
			const errorMessage =
				error?.message ||
				__('Failed to run the scheduled task. Please try again.', 'doublescale');
			setRunError(errorMessage);
			setTimeout(() => setRunError(null), 5000);
		} finally {
			setRunningHook(null);
		}
	};

	const copyToClipboard = (text: string, label: string) => {
		if (!navigator.clipboard) {
			const textArea = document.createElement('textarea');
			textArea.value = text;
			textArea.style.position = 'fixed';
			textArea.style.left = '-999999px';
			document.body.appendChild(textArea);
			textArea.select();
			try {
				document.execCommand('copy');
				setCopiedText(label);
				setTimeout(() => setCopiedText(null), 2000);
			} catch (err) {
				console.error('Failed to copy text:', err);
			} finally {
				document.body.removeChild(textArea);
			}
			return;
		}

		navigator.clipboard
			.writeText(text)
			.then(() => {
				setCopiedText(label);
				setTimeout(() => setCopiedText(null), 2000);
			})
			.catch((err) => {
				console.error('Failed to copy text:', err);
			});
	};

	useEffect(() => {
		fetchCronStatus();

		if (autoRefresh) {
			const interval = setInterval(fetchCronStatus, 30000);
			return () => clearInterval(interval);
		}
	}, [autoRefresh]);

	if (isLoading) {
		return (
			<div className="cron-jobs">
				<div className="p-6">{__('Loading system status...', 'doublescale')}</div>
			</div>
		);
	}

	if (error) {
		return (
			<div className="cron-jobs">
				<Alert variant="destructive">
					<AlertTriangleIcon width={20} height={20} />
					<AlertTitle>{__('Error Loading Status', 'doublescale')}</AlertTitle>
					<AlertDescription>
						{error}
						<div className="mt-4">
							<Button onClick={fetchCronStatus} variant="outline" size="sm">
								<RefreshCw className="h-3 w-3 me-1" />
								{__('Try Again', 'doublescale')}
							</Button>
						</div>
					</AlertDescription>
				</Alert>
			</div>
		);
	}

	if (!cronStatus) {
		return (
			<div className="cron-jobs">
				<div className="p-6">{__('No status data available.', 'doublescale')}</div>
			</div>
		);
	}

	const hasOverdue = cronStatus.cron_events.some(
		(event) => event.is_overdue
	);
	const hasServerCron = cronStatus.server.has_server_cron;

	const cronCommand = `*/1 * * * * wget -q -O - ${cronStatus.server.cron_url} >/dev/null 2>&1`;
	const cronCommandCurl = `*/1 * * * * curl ${cronStatus.server.cron_url} >/dev/null 2>&1`;
	const wpConfigCode = `define('DISABLE_WP_CRON', true);`;

	return (
		<div className="cron-jobs doublescale-fields">
			{runError && (
				<Alert variant="destructive" className="mb-6">
					<AlertTriangleIcon width={20} height={20} />
					<AlertTitle>{__('Task Execution Failed', 'doublescale')}</AlertTitle>
					<AlertDescription>{runError}</AlertDescription>
				</Alert>
			)}

			{hasOverdue && (
				<Alert variant="destructive" className="mb-6">
					<AlertTriangleIcon width={20} height={20} />
					<AlertTitle>{__('Attention Required', 'doublescale')}</AlertTitle>
					<AlertDescription>
						{__(
							'Some scheduled jobs are overdue. This may affect email delivery and automation processing. ',
							'doublescale'
						)}
						{!hasServerCron &&
							__(
								'Consider enabling server-side cron for better reliability.',
								'doublescale'
							)}
					</AlertDescription>
				</Alert>
			)}

			{!hasServerCron && (
				<Alert className="mb-6">
					<AlertTriangleIcon width={20} height={20} />
					<AlertTitle>
						{__('Server Side Cron Not Enabled', 'doublescale')}
					</AlertTitle>
					<AlertDescription>
						{__(
							'Server side cron is not enabled. Please consider enabling it for better performance and reliability.',
							'doublescale'
						)}{' '}
						<a
							href="https://developer.wordpress.org/plugins/cron/hooking-wp-cron-into-the-system-task-scheduler/"
							target="_blank"
							rel="noopener noreferrer"
							className="inline-flex items-center gap-1 underline hover:no-underline"
						>
							{__('Read more about server side cron', 'doublescale')}
							<ExternalLinkIcon width={24} height={24} className="w-6 h-6" />
						</a>
					</AlertDescription>
				</Alert>
			)}

			{/* CRON Job Status Section */}
			<div className="mb-6">
				<div className="flex items-center justify-between mb-4">
					<div className="flex items-center gap-2">
						<TimerBlockIcon width={24} height={24} />
						<h3 className="text-[#09090B] font-semibold text-lg">
							{__('CRON Job Status', 'doublescale')}
						</h3>
					</div>
					<div className="flex items-center gap-2">
						<Button
							size="sm"
							variant="outline"
							onClick={() => setAutoRefresh(!autoRefresh)}
						>
							<RefreshCw
								className={`h-3 w-3 me-1 ${
									isLoading && autoRefresh ? 'animate-spin' : ''
								}`}
							/>
							{autoRefresh
								? __('Auto-refresh: On', 'doublescale')
								: __('Auto-refresh: Off', 'doublescale')}
						</Button>
						<Button
							size="sm"
							variant="outline"
							onClick={fetchCronStatus}
							disabled={isLoading}
						>
							<RefreshCw className={`h-3 w-3 me-1 ${isLoading ? 'animate-spin' : ''}`} />
							{__('Refresh Now', 'doublescale')}
						</Button>
					</div>
				</div>
				<p className="text-sm text-muted-foreground mb-4">
					{__('Monitoring scheduled background tasks', 'doublescale')}
				</p>

				<div className="space-y-3 mb-4">
					{cronStatus.cron_events.map((event) => (
						<div
							key={event.hook}
							className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
						>
							<div className="flex-1 space-y-1">
								<div className="flex items-center gap-2">
									<h4 className="font-medium text-sm">
										{event.human_name}
									</h4>
									{event.is_overdue ? (
										<Badge variant="destructive" className="text-xs">
											{__('Overdue', 'doublescale')}
										</Badge>
									) : (
										<Badge variant="outline" className="text-xs">
											{__('On Schedule', 'doublescale')}
										</Badge>
									)}
								</div>
								<div className="flex items-center gap-4 text-xs text-muted-foreground">
									<span>
										{__('Next Run:', 'doublescale')} {event.next_run}
									</span>
									<span>•</span>
									<span>
										{__('Last Run:', 'doublescale')} {event.last_run}
									</span>
								</div>
							</div>
							<Button
								size="sm"
								variant="outline"
								onClick={() => runCron(event.hook)}
								disabled={runningHook === event.hook}
								className="ms-4"
							>
								<PlayIcon width={24} height={24} />
								{runningHook === event.hook
									? __('Running...', 'doublescale')
									: __('Run Now', 'doublescale')}
							</Button>
						</div>
					))}
				</div>

				<div className="pt-4 border-t text-sm text-muted-foreground">
					<p>
						<strong>{__('Server Memory Limit:', 'doublescale')}</strong>{' '}
						{cronStatus.server.memory_limit}.{' '}
						<strong>{__('Current usage:', 'doublescale')}</strong>{' '}
						{cronStatus.server.usage_percent}%.{' '}
						<strong>{__('Max Execution Time:', 'doublescale')}</strong>{' '}
						{cronStatus.server.max_execution_time}
					</p>
				</div>
			</div>

			{/* Server-Side Cron Setup Guide */}
			{!hasServerCron && (
				<div className="mt-8 pt-8 border-t">
					<div className="flex items-center gap-2 mb-4">
						<Terminal className="h-5 w-5" />
						<h3 className="text-[#09090B] font-semibold text-lg">
							{__('Setup Server-Side Cron', 'doublescale')}
						</h3>
					</div>
					<p className="text-sm text-muted-foreground mb-6">
						{__(
							'Follow these steps to enable server-side cron for better reliability and performance',
							'doublescale'
						)}
					</p>

					<div className="space-y-6">
						<div>
							<h4 className="font-semibold mb-2 flex items-center gap-2">
								<span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs">
									1
								</span>
								{__('Add to wp-config.php', 'doublescale')}
							</h4>
							<p className="text-sm text-muted-foreground mb-3">
								{__(
									'Add this line to your wp-config.php file (before "That\'s all, stop editing!" line):',
									'doublescale'
								)}
							</p>
							<div className="relative rounded-lg bg-muted" dir="ltr">
								<pre className="p-4 pe-24 text-sm overflow-x-auto text-start">
									<code>{wpConfigCode}</code>
								</pre>
								<Button
									size="sm"
									variant="ghost"
									className="absolute top-2 end-2"
									onClick={() =>
										copyToClipboard(wpConfigCode, 'wp-config')
									}
								>
									<CopyIcon width={24} height={24} />
									{copiedText === 'wp-config'
										? __('Copied!', 'doublescale')
										: __('Copy', 'doublescale')}
								</Button>
							</div>
						</div>

						<div>
							<h4 className="font-semibold mb-2 flex items-center gap-2">
								<span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs">
									2
								</span>
								{__('Add Cron Job to Server', 'doublescale')}
							</h4>
							<p className="text-sm text-muted-foreground mb-3">
								{__(
									'Add one of these commands to your server cron (using cPanel, Plesk, or crontab -e):',
									'doublescale'
								)}
							</p>

							<div className="mb-4">
								<p className="text-xs font-medium text-muted-foreground mb-2">
									{__('Using wget (recommended):', 'doublescale')}
								</p>
								<div className="relative rounded-lg bg-muted" dir="ltr">
									<pre className="p-4 pe-24 text-xs overflow-x-auto text-start">
										<code>{cronCommand}</code>
									</pre>
									<Button
										size="sm"
										variant="ghost"
										className="absolute top-2 end-2"
										onClick={() => copyToClipboard(cronCommand, 'wget')}
									>
										<CopyIcon width={24} height={24} />
										{copiedText === 'wget'
											? __('Copied!', 'doublescale')
											: __('Copy', 'doublescale')}
									</Button>
								</div>
							</div>

							<div>
								<p className="text-xs font-medium text-muted-foreground mb-2">
									{__('Using curl (alternative):', 'doublescale')}
								</p>
								<div className="relative rounded-lg bg-muted" dir="ltr">
									<pre className="p-4 pe-24 text-xs overflow-x-auto text-start">
										<code>{cronCommandCurl}</code>
									</pre>
									<Button
										size="sm"
										variant="ghost"
										className="absolute top-2 end-2"
										onClick={() =>
											copyToClipboard(cronCommandCurl, 'curl')
										}
									>
										<CopyIcon width={24} height={24} />
										{copiedText === 'curl'
											? __('Copied!', 'doublescale')
											: __('Copy', 'doublescale')}
									</Button>
								</div>
							</div>

							<Alert className="mt-4">
								<AlertDescription className="text-xs">
									<strong>{__('Note:', 'doublescale')}</strong>{' '}
									{__(
										'The command runs every minute (*/1 * * * *). This ensures your scheduled tasks run on time.',
										'doublescale'
									)}
								</AlertDescription>
							</Alert>
						</div>

						<div>
							<h4 className="font-semibold mb-2 flex items-center gap-2">
								<span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs">
									3
								</span>
								{__('Verify Setup', 'doublescale')}
							</h4>
							<p className="text-sm text-muted-foreground mb-3">
								{__(
									'After setting up, wait a few minutes and refresh this page. The "Cron Type" above should change to "Server Cron".',
									'doublescale'
								)}
							</p>
							<Button
								variant="outline"
								onClick={fetchCronStatus}
								className="w-full"
							>
								<RefreshCw className="h-4 w-4 me-2" />
								{__('Refresh Status', 'doublescale')}
							</Button>
						</div>

						<Alert>
							<AlertDescription className="flex items-center justify-between flex-wrap gap-4">
								<span className="text-sm">
									{__(
										'Need help? Read the complete guide on WordPress cron configuration.',
										'doublescale'
									)}
								</span>
								<Button size="sm" variant="outline" asChild>
									<a
										href="https://developer.wordpress.org/plugins/cron/hooking-wp-cron-into-the-system-task-scheduler/"
										target="_blank"
										rel="noopener noreferrer"
										className="flex items-center gap-1"
									>
										{__('Learn More', 'doublescale')}
										<ExternalLinkIcon width={24} height={24} className="w-6 h-6" />
									</a>
								</Button>
							</AlertDescription>
						</Alert>
					</div>
				</div>
			)}
		</div>
	);
};

export default CronJobs;
