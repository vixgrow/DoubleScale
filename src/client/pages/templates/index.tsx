/**
 * WordPress dependencies
 */
import { useState, useEffect } from '@wordpress/element';
import apiFetch from '@wordpress/api-fetch';
import { addQueryArgs } from '@wordpress/url';
import { __ } from '@wordpress/i18n';
import { useDispatch } from '@wordpress/data';

/**
 * Internal dependencies
 */
import './style.scss';
import type {
	CustomTemplate as Template,
	TemplatesResponse,
} from '@doublescale/client';
import { NavLink, getToLink, useNavigate } from '@doublescale/navigation';
import { Field } from '@doublescale/components';
import { convertDate } from '@doublescale/utils';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog';
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
import { Skeleton } from '@/components/ui/skeleton';
import { Checkbox } from '@/components/ui/checkbox';

const TemplatesList: React.FC = () => {
	const [loading, setLoading] = useState(true);
	const [page, setPage] = useState(1);
	const [perPage] = useState(10);
	const [total, setTotal] = useState(0);
	const [data, setData] = useState<Template[]>([]);
	const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
	const [keyword, setKeyword] = useState('');
	const [visible, setVisible] = useState(false);
	const [isSaving, setIsSaving] = useState(false);
	const [template, setTemplate] = useState({
		name: '',
	});
	const [bulkAction, setBulkAction] = useState<string>('');
	const [isApplying, setIsApplying] = useState<boolean>(false);
	const { createNotice } = useDispatch('doublescale/core');
	const navigate = useNavigate();

	const fetchTemplates = async (clear: boolean = false) => {
		setLoading(true);
		try {
			const response = (await apiFetch({
				path: addQueryArgs('/doublescale/v1/templates', {
					page,
					per_page: perPage,
					keyword: clear ? '' : keyword,
				}),
				method: 'GET',
			})) as TemplatesResponse;

			response.total && setTotal(response.total);
			response.data && setData(response.data);
		} catch (error: any) {
			createNotice({
				type: 'error',
				message: error.message,
			});
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchTemplates();
	}, [page, perPage]);

	const createTemplate = async () => {
		if (!template.name) {
			createNotice({
				type: 'error',
				message: __('Template name is required', 'doublescale'),
			});
			return;
		}
		setIsSaving(true);

		try {
			const response = (await apiFetch({
				path: '/doublescale/v1/templates',
				method: 'POST',
				data: template,
			})) as Template;

			setVisible(false);
			navigate(getToLink(`templates/${response.id}`));
		} catch (error: any) {
			createNotice({
				type: 'error',
				message: error.message,
			});
		} finally {
			setIsSaving(false);
		}
	};

	const deleteSelected = async () => {
		setIsApplying(true);

		try {
			await apiFetch({
				path: '/doublescale/v1/campaigns',
				method: 'DELETE',
				data: {
					ids: selectedRowKeys,
				},
			});

			setSelectedRowKeys([]);
			fetchTemplates();
		} catch (error: any) {
			createNotice({
				type: 'error',
				message: error.message,
			});
		} finally {
			setIsApplying(false);
		}
	};

	const totalPages = Math.max(1, Math.ceil(total / perPage));
	const allSelected =
		data.length > 0 && selectedRowKeys.length === data.length;
	const toggleAll = () =>
		setSelectedRowKeys(allSelected ? [] : data.map((d) => d.id));
	const toggleRow = (id: React.Key) =>
		setSelectedRowKeys((prev) =>
			prev.includes(id) ? prev.filter((k) => k !== id) : [...prev, id]
		);

	return (
		<div className="doublescale-templates-list">
			<div className="flex justify-between doublescale-contacts-list__actions">
				<div className="flex gap-2.5">
					<div className="flex gap-2.5">
						<Select
							value={bulkAction}
							onValueChange={(value) => setBulkAction(value)}
							disabled={selectedRowKeys.length === 0}
						>
							<SelectTrigger className="w-40">
								<SelectValue
									placeholder={__('Bulk action', 'doublescale')}
								/>
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="delete">
									{__('Delete', 'doublescale')}
								</SelectItem>
							</SelectContent>
						</Select>
						<Button
							onClick={() => {
								if (bulkAction === 'delete') {
									deleteSelected();
								}
							}}
							disabled={selectedRowKeys.length === 0 || isApplying}
							variant="default"
						>
							{__('Apply', 'doublescale')}
						</Button>
					</div>
					<Input
						placeholder={__('Search', 'doublescale')}
						value={keyword}
						onChange={(e) => setKeyword(e.target.value)}
						onKeyDown={(e) => {
							if (e.key === 'Enter') fetchTemplates();
						}}
						type="search"
					/>
				</div>
				<Button onClick={() => setVisible(true)} variant="default">
					{__('Create Template', 'doublescale')}
				</Button>
			</div>
			<Table>
				<TableHeader>
					<TableRow>
						<TableHead className="w-10">
							<Checkbox
								checked={allSelected}
								onCheckedChange={toggleAll}
							/>
						</TableHead>
						<TableHead>{__('Name', 'doublescale')}</TableHead>
						<TableHead>{__('Subject', 'doublescale')}</TableHead>
						<TableHead>{__('Created At', 'doublescale')}</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{loading ? (
						Array.from({ length: 5 }).map((_, i) => (
							<TableRow key={`s-${i}`}>
								<TableCell colSpan={4}>
									<Skeleton className="h-6 w-full" />
								</TableCell>
							</TableRow>
						))
					) : data.length === 0 ? (
						<TableRow>
							<TableCell
								colSpan={4}
								className="text-center text-muted-foreground"
							>
								{__('No results found.', 'doublescale')}
							</TableCell>
						</TableRow>
					) : (
						data.map((record) => (
							<TableRow key={record.id}>
								<TableCell>
									<Checkbox
										checked={selectedRowKeys.includes(record.id)}
										onCheckedChange={() => toggleRow(record.id)}
									/>
								</TableCell>
								<TableCell>
									<NavLink to={`templates/${record.id}`}>
										{record.name}
									</NavLink>
								</TableCell>
								<TableCell>{record.subject}</TableCell>
								<TableCell>
									{convertDate(record.created_at as any)}
								</TableCell>
							</TableRow>
						))
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

			<Dialog
				open={visible}
				onOpenChange={(open) => {
					if (!open) setVisible(false);
				}}
			>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>
							{__('Create Template', 'doublescale')}
						</DialogTitle>
					</DialogHeader>
					<div className="doublescale-fields">
						<Field
							label={__('Name', 'doublescale')}
							value={template.name}
							onChange={(value) =>
								setTemplate({
									...template,
									name: value,
								})
							}
							type="text"
						/>
					</div>
					<div className="flex justify-end mt-4">
						<Button
							variant="default"
							onClick={createTemplate}
							disabled={isSaving}
						>
							{__('Create', 'doublescale')}
						</Button>
					</div>
				</DialogContent>
			</Dialog>
		</div>
	);
};

export default TemplatesList;
