/**
 * Contract create/edit form.
 */

import React, { useCallback, useEffect, useRef, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import apiFetch from '@wordpress/api-fetch';
import { ExternalLink, Plus } from 'lucide-react';
import { useParams } from '@doublescale/navigation';

import { useNavigate, getToLink, useLocation } from '@doublescale/navigation';
import { FormField, TagField, InfiniteScrollSelect } from '@doublescale/components';
import { RichTextEditor } from '@/components/rich-text-editor';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { DatePicker } from '@/components/ui/date-picker';
import {
	Dialog,
	DialogContent,
	DialogFooter,
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
import { SendDocumentDialog, ContractAttachmentsPanel } from '@/components/sales';
import PageTabs from '@/components/page-tabs';
import { normalizeSalesContact } from '@/components/sales/contact-sales-fields';
import {
	createContract,
	createContractType,
	sendContract,
	updateContract,
	useAssignableSalesUsers,
	useContract,
	useContractTypes,
	formatRestError,
} from '@/hooks/sales';
import type { ContactSummary } from '@/types/sales';
import { CONTRACT_STATUSES, CURRENCIES } from '@/constants/sales';

const selectClass =
	'w-full border border-input rounded-md px-3 py-2 text-sm bg-background';

const contactOptionLabel = (contact: ContactSummary): string => {
	const name = [contact.first_name, contact.last_name].filter(Boolean).join(' ').trim();
	return name ? `${name} (${contact.email})` : contact.email;
};

const today = () => new Date().toISOString().slice(0, 10);
const yearFromToday = () => {
	const d = new Date();
	d.setFullYear(d.getFullYear() + 1);
	return d.toISOString().slice(0, 10);
};

const ContractEdit: React.FC = () => {
	const navigate = useNavigate();
	const location = useLocation();
	const params = useParams();
	const idParam = params?.id;
	const isNew = !idParam || idParam === 'new';
	const contractId = !isNew && idParam ? Number(idParam) : null;

	const { data: existing, loading } = useContract(contractId);
	const { data: assignableUsers, loading: usersLoading } = useAssignableSalesUsers();
	const { data: contractTypes, refetch: refetchTypes } = useContractTypes();

	const [subject, setSubject] = useState('');
	const [status, setStatus] = useState('draft');
	const [contact, setContact] = useState<ContactSummary | null>(null);
	const [contractTypeId, setContractTypeId] = useState<number | null>(null);
	const [contractValue, setContractValue] = useState(0);
	const [currency, setCurrency] = useState('USD');
	const [startDate, setStartDate] = useState(today());
	const [endDate, setEndDate] = useState(yearFromToday());
	const [description, setDescription] = useState('');
	const [hideFromCustomer, setHideFromCustomer] = useState(false);
	const [isTrash, setIsTrash] = useState(false);
	const [assignedUserId, setAssignedUserId] = useState<number | null>(null);
	const [tagIds, setTagIds] = useState<number[]>([]);
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [sendOpen, setSendOpen] = useState(false);
	const [typeDialogOpen, setTypeDialogOpen] = useState(false);
	const [newTypeName, setNewTypeName] = useState('');
	const [typeBusy, setTypeBusy] = useState(false);
	const prefilledContactFromUrlRef = useRef(false);

	const handleContactPick = useCallback((_value: string, item?: ContactSummary | null) => {
		if (!item) {
			setContact(null);
			return;
		}
		setContact(normalizeSalesContact(item));
	}, []);

	useEffect(() => {
		if (!isNew || prefilledContactFromUrlRef.current) {
			return;
		}
		const contactIdParam = new URLSearchParams(location.search).get('contact_id');
		if (!contactIdParam) {
			return;
		}
		const contactId = Number(contactIdParam);
		if (!contactId) {
			return;
		}
		prefilledContactFromUrlRef.current = true;
		void (async () => {
			try {
				const full = await apiFetch<ContactSummary>({
					path: `/doublescale/v1/contacts/${contactId}`,
				});
				handleContactPick(String(contactId), normalizeSalesContact(full));
			} catch {
				prefilledContactFromUrlRef.current = false;
			}
		})();
	}, [isNew, location.search, handleContactPick]);

	useEffect(() => {
		if (assignableUsers.length === 1 && assignedUserId === null) {
			setAssignedUserId(assignableUsers[0].id);
		}
	}, [assignableUsers, assignedUserId]);

	useEffect(() => {
		if (!existing) {
			return;
		}
		setSubject(existing.subject);
		setStatus(existing.status);
		setContact(existing.contact || null);
		setContractTypeId(existing.contract_type_id ?? null);
		setContractValue(existing.contract_value || 0);
		setCurrency(existing.currency || 'USD');
		setStartDate(existing.start_date || today());
		setEndDate(existing.end_date || yearFromToday());
		setDescription(existing.description || '');
		setHideFromCustomer(existing.hide_from_customer);
		setIsTrash(existing.is_trash);
		setAssignedUserId(existing.assigned_user_id ?? null);
		setTagIds(
			Array.isArray(existing.tag_ids)
				? existing.tag_ids.map((id) => Number(id)).filter(Boolean)
				: []
		);
	}, [existing]);

	const buildPayload = () => ({
		subject: subject.trim(),
		status,
		contact_id: contact!.id,
		contract_type_id: contractTypeId,
		contract_value: contractValue,
		currency,
		start_date: startDate,
		end_date: endDate,
		description,
		hide_from_customer: hideFromCustomer,
		is_trash: isTrash,
		assigned_user_id: assignedUserId,
		tag_ids: tagIds,
	});

	const validateForm = (): boolean => {
		if (!contact) {
			setError(__('Please select a customer.', 'doublescale'));
			return false;
		}
		if (!subject.trim()) {
			setError(__('Subject is required.', 'doublescale'));
			return false;
		}
		return true;
	};

	const persistContract = async (): Promise<number | null> => {
		if (!validateForm()) {
			return null;
		}

		setSaving(true);
		setError(null);
		const payload = buildPayload();

		try {
			let id = contractId;
			if (isNew) {
				const created = await createContract(payload);
				id = created.id;
			} else if (contractId) {
				await updateContract(contractId, payload);
			}
			return id ?? null;
		} catch (err: unknown) {
			setError(err instanceof Error ? err.message : __('Save failed.', 'doublescale'));
			return null;
		} finally {
			setSaving(false);
		}
	};

	const handleSave = async () => {
		const id = await persistContract();
		if (id) {
			navigate(getToLink(`sales/contracts/${id}`));
		}
	};

	const handleSaveAndSend = async (message: string) => {
		const id = await persistContract();
		if (!id) {
			return;
		}

		setSaving(true);
		setError(null);
		try {
			await sendContract(id, message);
			navigate(getToLink(`sales/contracts/${id}`));
		} catch (err: unknown) {
			setError(formatRestError(err));
		} finally {
			setSaving(false);
			setSendOpen(false);
		}
	};

	const handleCreateType = async () => {
		const name = newTypeName.trim();
		if (!name) {
			return;
		}
		setTypeBusy(true);
		setError(null);
		try {
			const created = await createContractType({ name });
			await refetchTypes();
			setContractTypeId(created.id);
			setNewTypeName('');
			setTypeDialogOpen(false);
		} catch (err: unknown) {
			setError(err instanceof Error ? err.message : __('Failed to create type.', 'doublescale'));
		} finally {
			setTypeBusy(false);
		}
	};

	if (!isNew && loading) {
		return (
			<div className="p-6 text-muted-foreground">{__('Loading…', 'doublescale')}</div>
		);
	}

	const assigneeReadOnly = assignableUsers.length <= 1;

	const informationFields = (
		<div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
			<div className="space-y-4">
				<FormField label={__('Subject', 'doublescale')} required className="!mb-0">
					<Input value={subject} onChange={(e) => setSubject(e.target.value)} />
				</FormField>

				<FormField label={__('Customer', 'doublescale')} required className="!mb-0">
					<InfiniteScrollSelect
						value={contact?.id ? String(contact.id) : ''}
						onValueChange={handleContactPick}
						placeholder={__('Search contacts…', 'doublescale')}
						apiEndpoint="/doublescale/v1/contacts"
						searchParamName="keywords"
						getOptionLabel={contactOptionLabel}
						getOptionValue={(c: ContactSummary) => c.id}
						dataPath="data"
						totalPath="total"
						perPage={20}
						selectedItem={contact}
					/>
				</FormField>

				<FormField label={__('Contract Type', 'doublescale')} className="!mb-0">
					<div className="flex gap-2">
						<Select
							value={contractTypeId ? String(contractTypeId) : 'none'}
							onValueChange={(next) =>
								setContractTypeId(next === 'none' ? null : Number(next))
							}
						>
							<SelectTrigger className="flex-1">
								<SelectValue placeholder={__('— None —', 'doublescale')} />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="none">{__('— None —', 'doublescale')}</SelectItem>
								{contractTypes.map((type) => (
									<SelectItem key={type.id} value={String(type.id)}>
										{type.name}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
						<Button
							type="button"
							variant="outline"
							size="icon"
							onClick={() => setTypeDialogOpen(true)}
							aria-label={__('Add contract type', 'doublescale')}
						>
							<Plus className="h-4 w-4" />
						</Button>
						<Button
							type="button"
							variant="ghost"
							size="sm"
							className="shrink-0 px-2"
							onClick={() => navigate(getToLink('sales/contract-types'))}
						>
							<ExternalLink className="h-4 w-4" />
						</Button>
					</div>
				</FormField>

				<div className="grid grid-cols-2 gap-3">
					<FormField label={__('Contract Value', 'doublescale')} required className="!mb-0">
						<Input
							type="number"
							min={0}
							step="0.01"
							value={contractValue}
							onChange={(e) => setContractValue(Number(e.target.value))}
						/>
					</FormField>
					<FormField label={__('Currency', 'doublescale')} required className="!mb-0">
						<select
							className={selectClass}
							value={currency}
							onChange={(e) => setCurrency(e.target.value)}
						>
							{CURRENCIES.map((c) => (
								<option key={c} value={c}>
									{c}
								</option>
							))}
						</select>
					</FormField>
				</div>

				<div className="grid grid-cols-2 gap-3">
					<FormField label={__('Start Date', 'doublescale')} className="!mb-0">
						<DatePicker
							value={startDate}
							onChange={setStartDate}
							outputFormat="iso"
							placeholder={__('Select date', 'doublescale')}
							buttonClassName="w-full"
							className="w-full"
						/>
					</FormField>
					<FormField label={__('End Date', 'doublescale')} className="!mb-0">
						<DatePicker
							value={endDate}
							onChange={setEndDate}
							outputFormat="iso"
							placeholder={__('Select date', 'doublescale')}
							buttonClassName="w-full"
							className="w-full"
						/>
					</FormField>
				</div>

				<FormField label={__('Tags', 'doublescale')} className="!mb-0">
					<TagField value={tagIds} onChange={setTagIds} />
				</FormField>
			</div>

			<div className="space-y-4">
				<div className="grid grid-cols-2 gap-3">
					<FormField label={__('Status', 'doublescale')} className="!mb-0">
						<select
							className={selectClass}
							value={status}
							onChange={(e) => setStatus(e.target.value)}
						>
							{CONTRACT_STATUSES.map((s) => (
								<option key={s} value={s}>
									{s}
								</option>
							))}
						</select>
					</FormField>
					<FormField label={__('Assigned', 'doublescale')} className="!mb-0">
						{usersLoading ? (
							<div className="text-sm text-muted-foreground">{__('Loading…', 'doublescale')}</div>
						) : assigneeReadOnly ? (
							<div className="border rounded px-3 py-2 bg-slate-50 text-sm h-10 flex items-center">
								{assignableUsers.find((u) => u.id === assignedUserId)?.display_name ||
									assignableUsers[0]?.display_name ||
									'—'}
							</div>
						) : (
							<Select
								value={assignedUserId ? String(assignedUserId) : 'unassigned'}
								onValueChange={(next) =>
									setAssignedUserId(next === 'unassigned' ? null : Number(next))
								}
							>
								<SelectTrigger className="w-full">
									<SelectValue placeholder={__('— Unassigned —', 'doublescale')} />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="unassigned">
										{__('— Unassigned —', 'doublescale')}
									</SelectItem>
									{assignableUsers.map((user) => (
										<SelectItem key={user.id} value={String(user.id)}>
											{user.display_name}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						)}
					</FormField>
				</div>

				<div className="flex items-center justify-between pt-2">
					<Label htmlFor="contract-hide-customer">
						{__('Hide from Customer', 'doublescale')}
					</Label>
					<Switch
						id="contract-hide-customer"
						checked={hideFromCustomer}
						onCheckedChange={setHideFromCustomer}
					/>
				</div>

				<div className="flex items-center justify-between">
					<Label htmlFor="contract-trash">{__('Move to Trash', 'doublescale')}</Label>
					<Switch
						id="contract-trash"
						checked={isTrash}
						onCheckedChange={setIsTrash}
					/>
				</div>
			</div>
		</div>
	);

	return (
		<div className="p-6 space-y-6 max-w-6xl">
			<div className="flex items-center justify-between">
				<h1 className="text-2xl font-semibold">
					{isNew ? __('New Contract', 'doublescale') : __('Edit Contract', 'doublescale')}
				</h1>
				<Button variant="outline" onClick={() => navigate(getToLink('sales/contracts'))}>
					{__('Back', 'doublescale')}
				</Button>
			</div>

			{error ? <div className="text-sm text-red-600">{error}</div> : null}

			<PageTabs
				defaultValue="information"
				tabsVariant="underline"
				tabsListWrapperClassName="border-b border-border px-0 py-0 rounded-none bg-transparent"
				tabsListClassName="bg-transparent gap-6"
				enableHorizontalScroll
				tabsList={[
					{ value: 'information', label: __('Contract Information', 'doublescale') },
					{ value: 'content', label: __('Content', 'doublescale') },
					{ value: 'attachments', label: __('Attachments', 'doublescale') },
				]}
				tabsContent={[
					{ value: 'information', children: informationFields },
					{
						value: 'content',
						children: (
							<FormField label={__('Contract Body', 'doublescale')} className="!mb-0">
								<RichTextEditor content={description} onChange={setDescription} />
							</FormField>
						),
					},
					{
						value: 'attachments',
						children: (
							<ContractAttachmentsPanel
								contractId={contractId}
								onNotice={(message) => setError(message)}
							/>
						),
					},
				]}
			/>

			<div className="flex justify-end gap-2">
				<Button variant="outline" onClick={() => navigate(getToLink('sales/contracts'))}>
					{__('Cancel', 'doublescale')}
				</Button>
				<Button variant="outline" onClick={() => void handleSave()} disabled={saving}>
					{saving ? __('Saving…', 'doublescale') : __('Save', 'doublescale')}
				</Button>
				<Button onClick={() => setSendOpen(true)} disabled={saving || status === 'expired'}>
					{__('Save & Send', 'doublescale')}
				</Button>
			</div>

			<SendDocumentDialog
				open={sendOpen}
				onOpenChange={setSendOpen}
				title={__('Save & Send Contract', 'doublescale')}
				description={__(
					'Save this contract and email it to the customer. Add an optional personal note below.',
					'doublescale'
				)}
				confirmLabel={__('Save & Send', 'doublescale')}
				busy={saving}
				onConfirm={handleSaveAndSend}
			/>

			<Dialog open={typeDialogOpen} onOpenChange={setTypeDialogOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>{__('New Contract Type', 'doublescale')}</DialogTitle>
					</DialogHeader>
					<Input
						value={newTypeName}
						onChange={(e) => setNewTypeName(e.target.value)}
						placeholder={__('Type name', 'doublescale')}
					/>
					<DialogFooter>
						<Button variant="outline" onClick={() => setTypeDialogOpen(false)}>
							{__('Cancel', 'doublescale')}
						</Button>
						<Button onClick={() => void handleCreateType()} disabled={typeBusy}>
							{typeBusy ? __('Saving…', 'doublescale') : __('Create', 'doublescale')}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
};

export default ContractEdit;
