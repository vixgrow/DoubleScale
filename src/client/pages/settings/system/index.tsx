/**
 * System Settings Component
 *
 * Displays cron job status, server information, and server-side cron setup guide
 *
 * @since 1.0.0
 * @package QuillCRM
 */

import { useState, useEffect } from '@wordpress/element';
import apiFetch from '@wordpress/api-fetch';
import { __ } from '@wordpress/i18n';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
	Clock,
	Server,
	Play,
	AlertTriangle,
	CheckCircle2,
	Copy,
	ExternalLink,
	Terminal,
	RefreshCw,
} from 'lucide-react';

interface CronEvent {
	hook: string;
	is_overdue: boolean;
	human_name: string;
	next_run: string;
	last_run: string;
	interval: number;
	run_count: number;
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

const SystemSettings: React.FC = () => {
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
				path: '/qc/v1/settings/cron-status',
			});
			setCronStatus(response as CronStatus);
		} catch (error) {
			console.error('Failed to fetch cron status:', error);
			setError(
				__(
					'Failed to load system status. Please refresh the page.',
					'quillcrm'
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
				path: '/qc/v1/settings/run-cron',
				method: 'POST',
				data: { hook },
			});
			// Refresh status immediately after running
			await fetchCronStatus();
		} catch (error: any) {
			console.error('Failed to run cron:', error);
			const errorMessage =
				error?.message ||
				__('Failed to run the scheduled task. Please try again.', 'quillcrm');
			setRunError(errorMessage);
			// Clear error after 5 seconds
			setTimeout(() => setRunError(null), 5000);
		} finally {
			setRunningHook(null);
		}
	};

	const copyToClipboard = (text: string, label: string) => {
		if (!navigator.clipboard) {
			// Fallback for browsers without Clipboard API
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
				// Silently fail - clipboard API might be blocked
			});
	};

	useEffect(() => {
		fetchCronStatus();

		if (autoRefresh) {
			const interval = setInterval(fetchCronStatus, 30000); // 30 seconds
			return () => clearInterval(interval);
		}
	}, [autoRefresh]);

	if (isLoading) {
		return (
			<div className="p-6">
				{__('Loading system status...', 'quillcrm')}
			</div>
		);
	}

	// Show error state if fetch failed
	if (error) {
		return (
			<div className="p-6">
				<Alert variant="destructive">
					<AlertTriangle className="h-4 w-4" />
					<AlertTitle>{__('Error Loading Status', 'quillcrm')}</AlertTitle>
					<AlertDescription>
						{error}
						<div className="mt-4">
							<Button onClick={fetchCronStatus} variant="outline" size="sm">
								<RefreshCw className="h-3 w-3 mr-1" />
								{__('Try Again', 'quillcrm')}
							</Button>
						</div>
					</AlertDescription>
				</Alert>
			</div>
		);
	}

	// Should not happen, but handle gracefully
	if (!cronStatus) {
		return (
			<div className="p-6">
				{__('No status data available.', 'quillcrm')}
			</div>
		);
	}

	const hasOverdue = cronStatus.cron_events.some(
		(event) => event.is_overdue
	);
	const hasServerCron = cronStatus.server.has_server_cron;

	// Generate cron commands
	const cronCommand = `*/1 * * * * wget -q -O - ${cronStatus.server.cron_url} >/dev/null 2>&1`;
	const cronCommandCurl = `*/1 * * * * curl ${cronStatus.server.cron_url} >/dev/null 2>&1`;
	const wpConfigCode = `define('DISABLE_WP_CRON', true);`;

	return (
		<div className="space-y-6">
			{/* Run Error Alert */}
			{runError && (
				<Alert variant="destructive">
					<AlertTriangle className="h-4 w-4" />
					<AlertTitle>{__('Task Execution Failed', 'quillcrm')}</AlertTitle>
					<AlertDescription>{runError}</AlertDescription>
				</Alert>
			)}

			{/* Overdue Warning */}
			{hasOverdue && (
				<Alert variant="destructive">
					<AlertTriangle className="h-4 w-4" />
					<AlertTitle>{__('Attention Required', 'quillcrm')}</AlertTitle>
					<AlertDescription>
						{__(
							'Some scheduled jobs are overdue. This may affect email delivery and automation processing. ',
							'quillcrm'
						)}
						{!hasServerCron &&
							__(
								'Consider enabling server-side cron for better reliability.',
								'quillcrm'
							)}
					</AlertDescription>
				</Alert>
			)}

			{/* Server-Side Cron Notice */}
			{!hasServerCron && (
				<Alert>
					<AlertTriangle className="h-4 w-4" />
					<AlertTitle>
						{__('Server Side Cron Not Enabled', 'quillcrm')}
					</AlertTitle>
					<AlertDescription>
						{__(
							'Server side cron is not enabled. Please consider enabling it for better performance and reliability.',
							'quillcrm'
						)}{' '}
						<a
							href="https://developer.wordpress.org/plugins/cron/hooking-wp-cron-into-the-system-task-scheduler/"
							target="_blank"
							rel="noopener noreferrer"
							className="inline-flex items-center gap-1 underline hover:no-underline"
						>
							{__('Read more about server side cron', 'quillcrm')}
							<ExternalLink className="h-3 w-3" />
						</a>
					</AlertDescription>
				</Alert>
			)}

			{/* Cron Jobs Status */}
			<Card>
				<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
					<div className="space-y-1">
						<CardTitle className="flex items-center gap-2">
							<Clock className="h-5 w-5" />
							{__('CRON Job Status', 'quillcrm')}
						</CardTitle>
						<CardDescription>
							{__('Monitoring scheduled background tasks', 'quillcrm')}
						</CardDescription>
					</div>
					<div className="flex items-center gap-2">
						<Button
							size="sm"
							variant="outline"
							onClick={() => setAutoRefresh(!autoRefresh)}
						>
							<RefreshCw
								className={`h-3 w-3 mr-1 ${
									isLoading && autoRefresh ? 'animate-spin' : ''
								}`}
							/>
							{autoRefresh
								? __('Auto-refresh: On', 'quillcrm')
								: __('Auto-refresh: Off', 'quillcrm')}
						</Button>
						<Button
							size="sm"
							variant="outline"
							onClick={fetchCronStatus}
							disabled={isLoading}
						>
							<RefreshCw className={`h-3 w-3 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
							{__('Refresh Now', 'quillcrm')}
						</Button>
					</div>
				</CardHeader>
				<CardContent>
					<div className="space-y-3">
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
												{__('Overdue', 'quillcrm')}
											</Badge>
										) : (
											<Badge variant="outline" className="text-xs">
												{__('On Schedule', 'quillcrm')}
											</Badge>
										)}
									</div>
									<div className="flex items-center gap-4 text-xs text-muted-foreground">
										<span>
											{__('Next:', 'quillcrm')} {event.next_run}
										</span>
										<span>•</span>
										<span>
											{__('Last:', 'quillcrm')} {event.last_run}
										</span>
										<span>•</span>
										<span>
											{__('Runs:', 'quillcrm')}{' '}
											{event.run_count.toLocaleString()}
										</span>
									</div>
								</div>
								<Button
									size="sm"
									variant="outline"
									onClick={() => runCron(event.hook)}
									disabled={runningHook === event.hook}
									className="ml-4"
								>
									<Play className="h-3 w-3 mr-1" />
									{runningHook === event.hook
										? __('Running...', 'quillcrm')
										: __('Run Now', 'quillcrm')}
								</Button>
							</div>
						))}
					</div>

					<div className="mt-4 pt-4 border-t text-sm text-muted-foreground">
						<p>
							<strong>{__('Server Memory Limit:', 'quillcrm')}</strong>{' '}
							{cronStatus.server.memory_limit}.{' '}
							<strong>{__('Current usage:', 'quillcrm')}</strong>{' '}
							{cronStatus.server.usage_percent}%.{' '}
							<strong>{__('Max Execution Time:', 'quillcrm')}</strong>{' '}
							{cronStatus.server.max_execution_time}
						</p>
					</div>
				</CardContent>
			</Card>

			{/* Server Information */}
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<Server className="h-5 w-5" />
						{__('Server Information', 'quillcrm')}
					</CardTitle>
					<CardDescription>
						{__('System resources and cron configuration', 'quillcrm')}
					</CardDescription>
				</CardHeader>
				<CardContent>
					<dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
						<div className="p-3 border rounded-lg">
							<dt className="text-xs font-medium text-muted-foreground mb-1">
								{__('Memory Limit', 'quillcrm')}
							</dt>
							<dd className="text-lg font-semibold">
								{cronStatus.server.memory_limit}
							</dd>
						</div>
						<div className="p-3 border rounded-lg">
							<dt className="text-xs font-medium text-muted-foreground mb-1">
								{__('Memory Usage', 'quillcrm')}
							</dt>
							<dd className="text-lg font-semibold flex items-center gap-2">
								{cronStatus.server.usage_percent}%
								{cronStatus.server.usage_percent > 80 && (
									<Badge variant="destructive" className="text-xs">
										{__('High', 'quillcrm')}
									</Badge>
								)}
							</dd>
						</div>
						<div className="p-3 border rounded-lg">
							<dt className="text-xs font-medium text-muted-foreground mb-1">
								{__('Max Execution Time', 'quillcrm')}
							</dt>
							<dd className="text-lg font-semibold">
								{cronStatus.server.max_execution_time}
							</dd>
						</div>
						<div className="p-3 border rounded-lg">
							<dt className="text-xs font-medium text-muted-foreground mb-1">
								{__('Cron Type', 'quillcrm')}
							</dt>
							<dd className="text-lg font-semibold flex items-center gap-2">
								{hasServerCron ? (
									<Badge variant="default" className="text-xs">
										<CheckCircle2 className="h-3 w-3 mr-1" />
										{__('Server Cron', 'quillcrm')}
									</Badge>
								) : (
									<Badge variant="secondary" className="text-xs">
										{__('WP-Cron', 'quillcrm')}
									</Badge>
								)}
							</dd>
						</div>
					</dl>
				</CardContent>
			</Card>

			{/* Server-Side Cron Setup Guide (only if not enabled) */}
			{!hasServerCron && (
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<Terminal className="h-5 w-5" />
							{__('Setup Server-Side Cron', 'quillcrm')}
						</CardTitle>
						<CardDescription>
							{__(
								'Follow these steps to enable server-side cron for better reliability and performance',
								'quillcrm'
							)}
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-6">
						{/* Step 1: wp-config.php */}
						<div>
							<h4 className="font-semibold mb-2 flex items-center gap-2">
								<span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs">
									1
								</span>
								{__('Add to wp-config.php', 'quillcrm')}
							</h4>
							<p className="text-sm text-muted-foreground mb-3">
								{__(
									'Add this line to your wp-config.php file (before "That\'s all, stop editing!" line):',
									'quillcrm'
								)}
							</p>
							<div className="relative">
								<pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto">
									<code>{wpConfigCode}</code>
								</pre>
								<Button
									size="sm"
									variant="ghost"
									className="absolute top-2 right-2"
									onClick={() =>
										copyToClipboard(wpConfigCode, 'wp-config')
									}
								>
									<Copy className="h-3 w-3 mr-1" />
									{copiedText === 'wp-config'
										? __('Copied!', 'quillcrm')
										: __('Copy', 'quillcrm')}
								</Button>
							</div>
						</div>

						{/* Step 2: Server Cron */}
						<div>
							<h4 className="font-semibold mb-2 flex items-center gap-2">
								<span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs">
									2
								</span>
								{__('Add Cron Job to Server', 'quillcrm')}
							</h4>
							<p className="text-sm text-muted-foreground mb-3">
								{__(
									'Add one of these commands to your server cron (using cPanel, Plesk, or crontab -e):',
									'quillcrm'
								)}
							</p>

							{/* wget version */}
							<div className="mb-4">
								<p className="text-xs font-medium text-muted-foreground mb-2">
									{__('Using wget (recommended):', 'quillcrm')}
								</p>
								<div className="relative">
									<pre className="bg-muted p-4 rounded-lg text-xs overflow-x-auto">
										<code>{cronCommand}</code>
									</pre>
									<Button
										size="sm"
										variant="ghost"
										className="absolute top-2 right-2"
										onClick={() => copyToClipboard(cronCommand, 'wget')}
									>
										<Copy className="h-3 w-3 mr-1" />
										{copiedText === 'wget'
											? __('Copied!', 'quillcrm')
											: __('Copy', 'quillcrm')}
									</Button>
								</div>
							</div>

							{/* curl version */}
							<div>
								<p className="text-xs font-medium text-muted-foreground mb-2">
									{__('Using curl (alternative):', 'quillcrm')}
								</p>
								<div className="relative">
									<pre className="bg-muted p-4 rounded-lg text-xs overflow-x-auto">
										<code>{cronCommandCurl}</code>
									</pre>
									<Button
										size="sm"
										variant="ghost"
										className="absolute top-2 right-2"
										onClick={() =>
											copyToClipboard(cronCommandCurl, 'curl')
										}
									>
										<Copy className="h-3 w-3 mr-1" />
										{copiedText === 'curl'
											? __('Copied!', 'quillcrm')
											: __('Copy', 'quillcrm')}
									</Button>
								</div>
							</div>

							<Alert className="mt-4">
								<AlertDescription className="text-xs">
									<strong>{__('Note:', 'quillcrm')}</strong>{' '}
									{__(
										'The command runs every minute (*/1 * * * *). This ensures your scheduled tasks run on time.',
										'quillcrm'
									)}
								</AlertDescription>
							</Alert>
						</div>

						{/* Step 3: Verify */}
						<div>
							<h4 className="font-semibold mb-2 flex items-center gap-2">
								<span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs">
									3
								</span>
								{__('Verify Setup', 'quillcrm')}
							</h4>
							<p className="text-sm text-muted-foreground mb-3">
								{__(
									'After setting up, wait a few minutes and refresh this page. The "Cron Type" above should change to "Server Cron".',
									'quillcrm'
								)}
							</p>
							<Button
								variant="outline"
								onClick={fetchCronStatus}
								className="w-full"
							>
								<RefreshCw className="h-4 w-4 mr-2" />
								{__('Refresh Status', 'quillcrm')}
							</Button>
						</div>

						{/* Documentation Link */}
						<Alert>
							<AlertDescription className="flex items-center justify-between flex-wrap gap-4">
								<span className="text-sm">
									{__(
										'Need help? Read the complete guide on WordPress cron configuration.',
										'quillcrm'
									)}
								</span>
								<Button size="sm" variant="outline" asChild>
									<a
										href="https://developer.wordpress.org/plugins/cron/hooking-wp-cron-into-the-system-task-scheduler/"
										target="_blank"
										rel="noopener noreferrer"
										className="flex items-center gap-1"
									>
										{__('Learn More', 'quillcrm')}
										<ExternalLink className="h-3 w-3" />
									</a>
								</Button>
							</AlertDescription>
						</Alert>
					</CardContent>
				</Card>
			)}
		</div>
	);
};

export default SystemSettings;
