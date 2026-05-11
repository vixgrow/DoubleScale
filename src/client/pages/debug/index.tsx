/**
 * WordPress dependencies
 */
import { useState, useEffect } from '@wordpress/element';
import apiFetch from '@wordpress/api-fetch';
import { __ } from '@wordpress/i18n';
import { useDispatch } from '@wordpress/data';
import { addQueryArgs } from '@wordpress/url';

/**
 * Internal dependencies
 */
import './style.scss';
import type { Log } from '@doublescale/client';
import { convertDate } from '@doublescale/utils';

import {
	Card,
	CardHeader,
	CardTitle,
	CardContent,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog';
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Checkbox } from '@/components/ui/checkbox';

const Debug: React.FC = () => {
	const [loading, setLoading] = useState<boolean>(true);
	const [total, setTotal] = useState<number>(0);
	const [page, setPage] = useState<number>(1);
	const [perPage] = useState<number>(10);
	const [logs, setLogs] = useState<Log[]>([]);
	const { createNotice } = useDispatch('doublescale/core');
	const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
	const [viewLog, setViewLog] = useState<Log | null>(null);

	const fetchLogs = async () => {
		setLoading(true);
		try {
			const response = (await apiFetch({
				path: addQueryArgs('/doublescale/v1/logs', {
					page,
					per_page: perPage,
				}),
			})) as {
				items: Log[];
				total_items: number;
				total_pages: number;
				page: number;
				per_page: number;
			};

			setLogs(response.items);
			setTotal(response.total_items);
			setPage(response.page);
		} catch (error: any) {
			createNotice({
				type: 'error',
				message: error.message,
			});
		} finally {
			setLoading(false);
		}
	};

	const deleteAll = async () => {
		const data: { ids?: React.Key[] } = {};
		if (selectedRowKeys.length > 0) {
			data.ids = selectedRowKeys;
		}
		try {
			await apiFetch({
				path: '/doublescale/v1/logs',
				method: 'DELETE',
				data,
			});

			fetchLogs();
		} catch (error: any) {
			createNotice({
				type: 'error',
				message: error.message,
			});
		}
	};

	const exportLogs = async () => {
		try {
			const response = await apiFetch({
				path: addQueryArgs('/doublescale/v1/logs', {
					export: 'json',
				}),
			});

			const blob = new Blob([JSON.stringify(response)], {
				type: 'application/json',
			});
			const url = URL.createObjectURL(blob);
			const a = document.createElement('a');
			a.href = url;
			a.download = 'logs.json';
			a.click();
		} catch (error: any) {
			createNotice({
				type: 'error',
				message: error.message,
			});
		}
	};

	useEffect(() => {
		fetchLogs();
	}, [page, perPage]);

	const totalPages = Math.max(1, Math.ceil(total / perPage));
	const allSelected =
		logs.length > 0 && selectedRowKeys.length === logs.length;

	const toggleAll = () => {
		if (allSelected) {
			setSelectedRowKeys([]);
		} else {
			setSelectedRowKeys(logs.map((l) => (l as any).id));
		}
	};

	const toggleRow = (id: React.Key) => {
		setSelectedRowKeys((prev) =>
			prev.includes(id) ? prev.filter((k) => k !== id) : [...prev, id]
		);
	};

	return (
		<div className="doublescale-debug">
			<div className="flex gap-5 doublescale-contacts-list__actions">
				<Button onClick={() => deleteAll()} variant="default">
					{__('Delete All', 'doublescale')}
				</Button>
				<Button onClick={() => exportLogs()} variant="default">
					{__('Export', 'doublescale')}
				</Button>
			</div>
			<Card>
				<CardHeader>
					<CardTitle>{__('Logs', 'doublescale')}</CardTitle>
				</CardHeader>
				<CardContent>
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead className="w-10">
									<Checkbox
										checked={allSelected}
										onCheckedChange={toggleAll}
									/>
								</TableHead>
								<TableHead>{__('Source', 'doublescale')}</TableHead>
								<TableHead>{__('Level', 'doublescale')}</TableHead>
								<TableHead>{__('Message', 'doublescale')}</TableHead>
								<TableHead>{__('Date', 'doublescale')}</TableHead>
								<TableHead>{__('Actions', 'doublescale')}</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{loading ? (
								Array.from({ length: 5 }).map((_, i) => (
									<TableRow key={`s-${i}`}>
										<TableCell colSpan={6}>
											<Skeleton className="h-6 w-full" />
										</TableCell>
									</TableRow>
								))
							) : logs.length === 0 ? (
								<TableRow>
									<TableCell
										colSpan={6}
										className="text-center text-muted-foreground"
									>
										{__('No results found.', 'doublescale')}
									</TableCell>
								</TableRow>
							) : (
								logs.map((log) => {
									const id = (log as any).id;
									return (
										<TableRow key={id}>
											<TableCell>
												<Checkbox
													checked={selectedRowKeys.includes(id)}
													onCheckedChange={() => toggleRow(id)}
												/>
											</TableCell>
											<TableCell>{log.source}</TableCell>
											<TableCell>{log.level}</TableCell>
											<TableCell>{log.message}</TableCell>
											<TableCell>
												{convertDate((log as any).local_datetime, true)}
											</TableCell>
											<TableCell>
												<Button
													onClick={() => setViewLog(log)}
													variant="link"
												>
													{__('View', 'doublescale')}
												</Button>
											</TableCell>
										</TableRow>
									);
								})
							)}
						</TableBody>
					</Table>

					{total > 0 && (
						<div className="flex items-center justify-between mt-4">
							<span className="text-sm text-muted-foreground">
								{__('Page', 'doublescale')} {page} / {totalPages}
							</span>
							<div className="flex gap-2">
								<Button
									variant="outline"
									size="sm"
									disabled={page <= 1}
									onClick={() => setPage(page - 1)}
								>
									{__('Previous', 'doublescale')}
								</Button>
								<Button
									variant="outline"
									size="sm"
									disabled={page >= totalPages}
									onClick={() => setPage(page + 1)}
								>
									{__('Next', 'doublescale')}
								</Button>
							</div>
						</div>
					)}
				</CardContent>
			</Card>

			<Dialog
				open={viewLog !== null}
				onOpenChange={(open) => !open && setViewLog(null)}
			>
				<DialogContent className="max-w-[800px]">
					<DialogHeader>
						<DialogTitle>{__('Log Details', 'doublescale')}</DialogTitle>
					</DialogHeader>
					<div className="max-h-[600px] overflow-y-auto">
						<pre className="text-sm">
							{viewLog
								? JSON.stringify(viewLog.context, null, 2)
								: ''}
						</pre>
					</div>
				</DialogContent>
			</Dialog>
		</div>
	);
};

export default Debug;
