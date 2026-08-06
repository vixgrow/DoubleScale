/**
 * Debugging Logs Component
 *
 * Displays debugging logs with configurable log level filtering
 *
 * @since 1.0.0
 * @package DoubleScale
 */

import { useState, useEffect } from '@wordpress/element';
import apiFetch from '@wordpress/api-fetch';
import { __ } from '@wordpress/i18n';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@/components/ui/table';
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogDescription,
} from '@/components/ui/dialog';
import {
	AlertTriangle,
	RefreshCw,
	Trash2,
	Download,
	Info,
	Bug,
	XCircle,
	Eye,
} from 'lucide-react';
import { DeleteIcon, ViewIcon } from '@doublescale/components';

interface LogEntry {
	id: number;
	plugin: string;
	level: string;
	message: string;
	source: string;
	context: any;
	datetime: string;
	local_datetime: string;
}

interface LogsResponse {
	items: LogEntry[];
	total_items: number;
	page: number;
	per_page: number;
	total_pages: number;
}

type LogLevelOption = 'error' | 'error,debug' | 'error,debug,info';

const DebuggingLogs: React.FC = () => {
	const [logs, setLogs] = useState<LogEntry[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [logLevel, setLogLevel] = useState<LogLevelOption>('error');
	const [page, setPage] = useState(1);
	const [totalPages, setTotalPages] = useState(1);
	const [totalItems, setTotalItems] = useState(0);
	const [isDeleting, setIsDeleting] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [selectedLog, setSelectedLog] = useState<LogEntry | null>(null);
	const [isModalOpen, setIsModalOpen] = useState(false);
	const perPage = 50;

	// Fetch log level preference from settings
	useEffect(() => {
		const fetchLogLevel = async () => {
			try {
				const settings = await apiFetch({
					path: '/doublescale/v1/settings',
				}) as any;
				if (settings?.debugging?.log_level) {
					setLogLevel(settings.debugging.log_level);
				}
			} catch (err) {
				console.error('Failed to fetch log level setting:', err);
			}
		};
		fetchLogLevel();
	}, []);

	// Fetch logs
	const fetchLogs = async () => {
		setIsLoading(true);
		setError(null);
		try {
			const levels = logLevel.split(',');
			const response = await apiFetch({
				path: `/doublescale/v1/logs?levels=${levels.join(',')}&page=${page}&per_page=${perPage}`,
			}) as LogsResponse;

			setLogs(response.items || []);
			setTotalPages(response.total_pages || 1);
			setTotalItems(response.total_items || 0);
		} catch (err: any) {
			console.error('Failed to fetch logs:', err);
			setError(
				err?.message ||
					__('Failed to load logs. Please refresh the page.', 'doublescale')
			);
		} finally {
			setIsLoading(false);
		}
	};

	// Save log level preference
	const saveLogLevel = async (newLevel: LogLevelOption) => {
		try {
			const settings = await apiFetch({
				path: '/doublescale/v1/settings',
			}) as any;

			const updatedSettings = {
				...settings,
				debugging: {
					...(settings.debugging || {}),
					log_level: newLevel,
				},
			};

			await apiFetch({
				path: '/doublescale/v1/settings',
				method: 'POST',
				data: updatedSettings,
			});

			setLogLevel(newLevel);
		} catch (err) {
			console.error('Failed to save log level:', err);
		}
	};

	// Handle log level change
	const handleLogLevelChange = (value: string) => {
		const newLevel = value as LogLevelOption;
		setPage(1);
		saveLogLevel(newLevel);
	};

	// Delete logs
	const deleteLogs = async (logIds?: number[]) => {
		setIsDeleting(true);
		try {
			if (logIds && logIds.length > 0) {
				await apiFetch({
					path: '/doublescale/v1/logs',
					method: 'DELETE',
					data: { ids: logIds.join(',') },
				});
			} else {
				const levels = logLevel.split(',');
				await apiFetch({
					path: `/doublescale/v1/logs?levels=${levels.join(',')}`,
					method: 'DELETE',
				});
			}
			await fetchLogs();
		} catch (err) {
			console.error('Failed to delete logs:', err);
		} finally {
			setIsDeleting(false);
		}
	};

	// Export logs
	const exportLogs = async () => {
		try {
			const levels = logLevel.split(',');
			const url = `/wp-json/doublescale/v1/logs?levels=${levels.join(',')}&export=json`;
			window.open(url, '_blank');
		} catch (err) {
			console.error('Failed to export logs:', err);
		}
	};

	// Get level badge variant
	const getLevelBadgeVariant = (level: string) => {
		switch (level.toLowerCase()) {
			case 'error':
			case 'critical':
			case 'emergency':
			case 'alert':
				return 'destructive';
			case 'warning':
				return 'default';
			case 'info':
			case 'notice':
				return 'secondary';
			case 'debug':
				return 'outline';
			default:
				return 'outline';
		}
	};

	// Get level icon
	const getLevelIcon = (level: string) => {
		switch (level.toLowerCase()) {
			case 'error':
			case 'critical':
			case 'emergency':
			case 'alert':
				return <XCircle className="h-4 w-4" />;
			case 'warning':
				return <AlertTriangle className="h-4 w-4" />;
			case 'info':
			case 'notice':
				return <Info className="h-4 w-4" />;
			case 'debug':
				return <Bug className="h-4 w-4" />;
			default:
				return <Info className="h-4 w-4" />;
		}
	};

	useEffect(() => {
		fetchLogs();
	}, [logLevel, page]);

	return (
		<div className="debugging-logs doublescale-fields">
			{/* Log Level Settings */}
			<div className="mb-6">
				<div className="flex items-center gap-2 mb-2">
					<AlertTriangle className="h-5 w-5 text-primary" />
					<h3 className="text-[#09090B] font-semibold text-lg">
						{__('Log Level Settings', 'doublescale')}
					</h3>
				</div>
				<p className="text-sm text-muted-foreground mb-4">
					{__(
						'Configure which log levels should be stored in the system. This setting controls what gets logged and saved to the database, not just what is displayed. Only logs matching the selected level(s) will be stored.',
						'doublescale'
					)}
				</p>
				<div className="space-y-4 p-4 border rounded-lg bg-primary/5 border-primary/20">
					<div>
						<label className="text-sm font-medium mb-2 block text-[#09090B]">
							{__('Store Logs For:', 'doublescale')}
						</label>
						<Select value={logLevel} onValueChange={handleLogLevelChange}>
							<SelectTrigger className="w-full max-w-[400px]">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="error">
									{__('Error Only', 'doublescale')} - {__('Only error, critical, alert, and emergency logs will be stored', 'doublescale')}
								</SelectItem>
								<SelectItem value="error,debug">
									{__('Error & Debug', 'doublescale')} - {__('Error and debug logs will be stored', 'doublescale')}
								</SelectItem>
								<SelectItem value="error,debug,info">
									{__('Error, Debug & Info', 'doublescale')} - {__('Error, debug, info, and notice logs will be stored', 'doublescale')}
								</SelectItem>
							</SelectContent>
						</Select>
					</div>
					<Alert className="items-center">
						<AlertTriangle className="h-4 w-4" />
						<AlertDescription className="text-sm pt-[5px]">
							<strong>{__('Current Setting:', 'doublescale')}</strong>{' '}
							{logLevel === 'error' && __(
								'Only error-level logs and above (error, critical, alert, emergency) are being stored in the system.',
								'doublescale'
							)}
							{logLevel === 'error,debug' && __(
								'Error and debug logs are being stored in the system. Info and notice logs are not stored.',
								'doublescale'
							)}
							{logLevel === 'error,debug,info' && __(
								'Error, debug, info, and notice logs are being stored in the system.',
								'doublescale'
							)}
						</AlertDescription>
					</Alert>
				</div>
			</div>

			{/* Log Management */}
			<div className="mb-6">
				<div className="flex sm:flex-row flex-col items-start gap-3 sm:items-center justify-between mb-4">
					<h3 className="text-[#09090B] font-semibold text-lg">
						{__('Log Management', 'doublescale')}
					</h3>
					<div className="flex items-center gap-2">
						<Button
							variant="outline"
							size="sm"
							onClick={fetchLogs}
							disabled={isLoading}
						>
							<RefreshCw
								className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`}
							/>
							{__('Refresh', 'doublescale')}
						</Button>
						<Button
							variant="outline"
							size="sm"
							onClick={exportLogs}
							disabled={logs.length === 0}
						>
							<Download className="h-4 w-4 mr-2" />
							{__('Export', 'doublescale')}
						</Button>
						<Button
							variant="outline"
							size="sm"
							onClick={() => deleteLogs()}
							disabled={isDeleting || logs.length === 0}
							className="text-destructive hover:text-destructive"
						>
							<DeleteIcon width={24} height={24} />
							{isDeleting
								? __('Deleting...', 'doublescale')
								: __('Clear All', 'doublescale')}
						</Button>
					</div>
				</div>
				<p className="text-sm text-muted-foreground mb-4">
					{__('View, export, and manage stored logs', 'doublescale')}
				</p>
			</div>

			{/* Error Alert */}
			{error && (
				<Alert variant="destructive" className="mb-6">
					<AlertTriangle className="h-4 w-4" />
					<AlertDescription>{error}</AlertDescription>
				</Alert>
			)}

			{/* Logs Table */}
			<div className="mb-6">
				<div className="mb-4">
					<h3 className="text-[#09090B] font-semibold text-lg">
						{__('Logs', 'doublescale')} ({totalItems})
					</h3>
					<p className="text-sm text-muted-foreground">
						{__('View and manage debugging logs', 'doublescale')}
					</p>
				</div>
				{isLoading ? (
					<div className="p-6 text-center border rounded-lg">
						{__('Loading logs...', 'doublescale')}
					</div>
				) : logs.length === 0 ? (
					<div className="p-6 text-center text-muted-foreground border rounded-lg">
						{__('No logs found for the selected level.', 'doublescale')}
					</div>
				) : (
					<>
						<div className="rounded-md border">
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead className="w-[80px]">
											{__('Level', 'doublescale')}
										</TableHead>
										<TableHead className="w-[100px]">
											{__('Plugin', 'doublescale')}
										</TableHead>
										<TableHead>{__('Message', 'doublescale')}</TableHead>
										<TableHead className="w-[200px]">
											{__('Source', 'doublescale')}
										</TableHead>
										<TableHead className="w-[180px]">
											{__('Date & Time', 'doublescale')}
										</TableHead>
										<TableHead className="w-[120px]">
											{__('Actions', 'doublescale')}
										</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{logs.map((log) => (
										<TableRow key={log.id}>
											<TableCell>
												<Badge
													variant={getLevelBadgeVariant(log.level)}
													className="flex items-center gap-1 w-fit"
												>
													{getLevelIcon(log.level)}
													{log.level.toUpperCase()}
												</Badge>
											</TableCell>
											<TableCell>
												<Badge variant="outline">{log.plugin}</Badge>
											</TableCell>
											<TableCell>
												<div className="max-w-md truncate" title={log.message}>
													{log.message}
												</div>
											</TableCell>
											<TableCell>
												<div className="max-w-[200px] truncate text-xs text-muted-foreground" title={log.source}>
													{log.source}
												</div>
											</TableCell>
											<TableCell className="text-sm text-muted-foreground">
												{log.local_datetime}
											</TableCell>
											<TableCell>
												<div className="flex items-center gap-2">
													<Button
														variant="ghost"
														size="sm"
														onClick={() => {
															setSelectedLog(log);
															setIsModalOpen(true);
														}}
														title={__('View Details', 'doublescale')}
													>
														<ViewIcon width={24} height={24} />
													</Button>
													<Button
														variant="ghost"
														size="sm"
														onClick={() => deleteLogs([log.id])}
														disabled={isDeleting}
														className="text-destructive hover:text-destructive"
														title={__('Delete', 'doublescale')}
													>
														<DeleteIcon width={24} height={24} />
													</Button>
												</div>
											</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
						</div>

						{/* Pagination */}
						{totalPages > 1 && (
							<div className="flex items-center justify-between mt-4">
								<div className="text-sm text-muted-foreground">
									{__('Page', 'doublescale')} {page} {__('of', 'doublescale')}{' '}
									{totalPages}
								</div>
								<div className="flex gap-2">
									<Button
										variant="outline"
										size="sm"
										onClick={() => setPage((p) => Math.max(1, p - 1))}
										disabled={page === 1}
									>
										{__('Previous', 'doublescale')}
									</Button>
									<Button
										variant="outline"
										size="sm"
										onClick={() =>
											setPage((p) => Math.min(totalPages, p + 1))
										}
										disabled={page === totalPages}
									>
										{__('Next', 'doublescale')}
									</Button>
								</div>
							</div>
						)}
					</>
				)}
			</div>

			{/* Log Details Modal */}
			<Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
				<DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
					<DialogHeader>
						<DialogTitle>{__('Log Details', 'doublescale')}</DialogTitle>
						<DialogDescription>
							{__('View complete log entry information', 'doublescale')}
						</DialogDescription>
					</DialogHeader>
					{selectedLog && (
						<div className="space-y-4 mt-4">
							<div className="grid grid-cols-2 gap-4">
								<div>
									<label className="text-sm font-semibold text-muted-foreground">
										{__('Level', 'doublescale')}
									</label>
									<div className="mt-1">
										<Badge
											variant={getLevelBadgeVariant(selectedLog.level)}
											className="flex items-center gap-1 w-fit"
										>
											{getLevelIcon(selectedLog.level)}
											{selectedLog.level.toUpperCase()}
										</Badge>
									</div>
								</div>
								<div>
									<label className="text-sm font-semibold text-muted-foreground">
										{__('Plugin', 'doublescale')}
									</label>
									<div className="mt-1">
										<Badge variant="outline">{selectedLog.plugin}</Badge>
									</div>
								</div>
								<div className="col-span-2">
									<label className="text-sm font-semibold text-muted-foreground">
										{__('Message', 'doublescale')}
									</label>
									<div className="mt-1 p-3 bg-muted rounded-md text-sm">
										{selectedLog.message}
									</div>
								</div>
								<div className="col-span-2">
									<label className="text-sm font-semibold text-muted-foreground">
										{__('Source', 'doublescale')}
									</label>
									<div className="mt-1 p-3 bg-muted rounded-md text-sm font-mono text-xs">
										{selectedLog.source}
									</div>
								</div>
								<div>
									<label className="text-sm font-semibold text-muted-foreground">
										{__('Date & Time (UTC)', 'doublescale')}
									</label>
									<div className="mt-1 p-3 bg-muted rounded-md text-sm">
										{selectedLog.datetime}
									</div>
								</div>
								<div>
									<label className="text-sm font-semibold text-muted-foreground">
										{__('Date & Time (Local)', 'doublescale')}
									</label>
									<div className="mt-1 p-3 bg-muted rounded-md text-sm">
										{selectedLog.local_datetime}
									</div>
								</div>
								{selectedLog.context && Object.keys(selectedLog.context).length > 0 && (
									<div className="col-span-2">
										<label className="text-sm font-semibold text-muted-foreground">
											{__('Context / Additional Data', 'doublescale')}
										</label>
										<div className="mt-1 p-3 bg-muted rounded-md">
											<pre className="text-xs overflow-x-auto whitespace-pre-wrap">
												{JSON.stringify(selectedLog.context, null, 2)}
											</pre>
										</div>
									</div>
								)}
							</div>
						</div>
					)}
				</DialogContent>
			</Dialog>
		</div>
	);
};

export default DebuggingLogs;
