/**
 * Contract create/edit form.
 */

import React, { useCallback, useEffect, useRef, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import apiFetch from '@wordpress/api-fetch';
import { Plus } from 'lucide-react';
import { useParams } from '@doublescale/navigation';

import { useNavigate, getToLink, useLocation } from '@doublescale/navigation';
import {
	FormField,
	TagField,
	InfiniteScrollSelect,
	Editor,
	PanelLayout,
	PlusIcon,
	CustomDialogHeader,
	GradientContractTypeIcon,
	GradientContractsIcon,
} from '@doublescale/components';
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
} from '@/components/ui/dialog';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import { SendDocumentDialog, ContractAttachmentsPanel, ApprovalStatusBanner } from '@/components/sales';
import PageTabs from '@/components/page-tabs';
import { normalizeSalesContact } from '@/components/sales/contact-sales-fields';
import {
	canEditSalesDocument,
	canSubmitForApproval,
	isApprovalWorkflowEnabled,
	requiresReapprovalAfterEdit,
	showDirectSendAction,
	formatSalesRestError,
} from '@/components/sales/sales-approval-utils';
import {
	createContract,
	createContractType,
	sendContract,
	submitContractForApproval,
	updateContract,
	useAssignableSalesUsers,
	useContract,
	useContractTypes,
	useSalesSettings,
} from '@/hooks/sales';
import type { ContactSummary } from '@/types/sales';
import config from '@doublescale/config';
import {
	CONTRACT_STATUSES,
	CONTRACT_STATUS_LABELS,
} from '@/constants/sales';

const selectClass =
	'w-full border !border-border !rounded-lg px-3 py-2 text-sm bg-background h-10';

const contractEditorWrapperClassName =
	'send-email-dialog-editor mt-2 min-w-0 max-w-full overflow-hidden rounded-lg max-sm:[&_.email-body-editor]:max-w-full max-sm:[&_.email-body-editor_.editor-container]:max-w-full max-sm:[&_.toolbar]:flex-col max-sm:[&_.toolbar]:gap-2 max-sm:[&_.toolbar]:p-3 max-sm:[&_.toolbar>div]:w-full max-sm:[&_.toolbar>div]:flex-wrap max-sm:[&_.toolbar>div]:justify-center max-sm:[&_.editor-inner]:min-w-0 max-sm:[&_.editor-inner]:overflow-x-hidden max-sm:[&_.editor-input]:break-words max-sm:[&_.editor-input_img]:h-auto max-sm:[&_.editor-input_img]:max-w-full';

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

	const { data: existing, loading, refetch } = useContract(contractId);
	const { data: salesSettings } = useSalesSettings();
	const { data: assignableUsers, loading: usersLoading } = useAssignableSalesUsers();
	const { data: contractTypes, refetch: refetchTypes } = useContractTypes();

	const [subject, setSubject] = useState('');
	const [status, setStatus] = useState('draft');
	const [contact, setContact] = useState<ContactSummary | null>(null);
	const [contractTypeId, setContractTypeId] = useState<number | null>(null);
	const [contractValue, setContractValue] = useState(0);
	const [currency, setCurrency] = useState(config.getCurrency() ?? 'USD');
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
			setError(
				formatSalesRestError(err, __('Save failed.', 'doublescale'), {
					approval_pending: __(
						'This contract is pending approval and cannot be edited.',
						'doublescale'
					),
				})
			);
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
			setError(
				formatSalesRestError(err, __('Send failed.', 'doublescale'), {
					approval_required: __(
						'This contract must be approved before it can be sent. Use Submit for Approval first.',
						'doublescale'
					),
				})
			);
		} finally {
			setSaving(false);
			setSendOpen(false);
		}
	};

	const [submittingApproval, setSubmittingApproval] = useState(false);

	const workflowEnabled = isApprovalWorkflowEnabled(salesSettings, existing ?? undefined);
	const approval = existing?.approval ?? null;
	const fieldsLocked = !canEditSalesDocument(workflowEnabled, approval, existing ?? undefined);
	const showReapprovalWarning = requiresReapprovalAfterEdit(
		workflowEnabled,
		approval,
		existing ?? undefined
	);
	const showSubmitApproval = canSubmitForApproval(
		workflowEnabled,
		'contract',
		status,
		approval,
		existing ?? undefined
	);
	const showSend = showDirectSendAction(
		workflowEnabled,
		'contract',
		status,
		approval,
		status === 'expired',
		existing ?? undefined
	);

	const handleSubmitForApproval = async () => {
		const id = await persistContract();
		if (!id) {
			return;
		}

		setSubmittingApproval(true);
		setError(null);
		try {
			await submitContractForApproval(id);
			await refetch();
		} catch (err: unknown) {
			setError(
				formatSalesRestError(err, __('Failed to submit for approval.', 'doublescale'))
			);
		} finally {
			setSubmittingApproval(false);
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

	const handleClose = () => navigate(getToLink('sales/contracts'));

	const pageTitle = isNew
		? __('Create New Contract', 'doublescale')
		: __('Edit Contract', 'doublescale');

	const breadcrumbItems = [
		{ label: __('Sales (Contracts)', 'doublescale'), href: 'sales/contracts' },
		{ label: pageTitle },
	];

	const panelShell = (children: JSX.Element) => (
		<PanelLayout
			items={breadcrumbItems}
			showPanelClose
			fullWidth
			onClosePanel={handleClose}
			handleNavigate={(href) => navigate(getToLink(href))}
		>
			{children}
		</PanelLayout>
	);

	if (!isNew && loading) {
		return panelShell(
			<div className="py-12 text-center text-muted-foreground">
				{__('Loading…', 'doublescale')}
			</div>
		);
	}

	const canAssignSalesRep =
		config.getUserCapabilities().doublescale_can_assign_sales_rep === true;
	const assigneeReadOnly =
		assignableUsers.length === 0 ||
		(!canAssignSalesRep && assignableUsers.length <= 1);

	const contractInformationContent = (
		<>
			<div className="mb-6 grid grid-cols-1 lg:grid-cols-2">
				<div className="space-y-4 lg:border-r lg:border-[#DEE1E6] lg:pr-8">
					<FormField label={__('Subject', 'doublescale')} required className="!mb-0">
						<Input
							value={subject}
							onChange={(e) => setSubject(e.target.value)}
							placeholder={__('Subject', 'doublescale')}
							className="!rounded-lg !border-border"
						/>
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

					<FormField label={__('Contract Type', 'doublescale')} required className="!mb-0">
						<div className="flex gap-2">
							<Select
								value={contractTypeId ? String(contractTypeId) : 'none'}
								onValueChange={(next) =>
									setContractTypeId(next === 'none' ? null : Number(next))
								}
							>
								<SelectTrigger className="flex-1 !rounded-lg !border-border">
									<SelectValue
										placeholder={__('Search contract type…', 'doublescale')}
									/>
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="none">{__('— None —', 'doublescale')}</SelectItem>
									{(contractTypes ?? []).map((type) => (
										<SelectItem key={type.id} value={String(type.id)}>
											{type.name}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
							<Button
								type="button"
								variant="outline"
								className="shrink-0 h-10 !rounded-lg border-primary bg-white text-primary"
								onClick={() => setTypeDialogOpen(true)}
								aria-label={__('Add contract type', 'doublescale')}
							>
								<PlusIcon width={20} height={20} />
							</Button>
						</div>
					</FormField>

					<div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
						<FormField label={__('Contract Value', 'doublescale')} required className="!mb-0">
							<Input
								type="number"
								min={0}
								step="0.01"
								value={contractValue}
								onChange={(e) => setContractValue(Number(e.target.value))}
								className="!rounded-lg !border-border"
							/>
						</FormField>
					</div>

					<div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
						<FormField label={__('Start Date', 'doublescale')} required className="!mb-0">
							<DatePicker
								value={startDate}
								onChange={setStartDate}
								outputFormat="iso"
								placeholder={__('From - To', 'doublescale')}
								buttonClassName="w-full !rounded-lg !border-border"
								className="w-full"
							/>
						</FormField>
						<FormField label={__('End Date', 'doublescale')} className="!mb-0">
							<DatePicker
								value={endDate}
								onChange={setEndDate}
								outputFormat="iso"
								placeholder={__('From - To', 'doublescale')}
								buttonClassName="w-full !rounded-lg !border-border"
								className="w-full"
							/>
						</FormField>
					</div>
				</div>

				<div className="space-y-4 pt-6 lg:pl-8 lg:pt-0">
					<FormField label={__('Tags', 'doublescale')} className="!mb-0">
						<TagField value={tagIds} onChange={setTagIds} />
					</FormField>

					<div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
						<FormField label={__('Status', 'doublescale')} className="!mb-0">
							<select
								className={selectClass}
								value={status}
								onChange={(e) => setStatus(e.target.value)}
							>
								{CONTRACT_STATUSES.map((s) => (
									<option key={s} value={s}>
										{CONTRACT_STATUS_LABELS[s]}
									</option>
								))}
							</select>
						</FormField>
						<FormField label={__('Assigned', 'doublescale')} className="!mb-0">
							{usersLoading ? (
								<div className="text-sm text-muted-foreground">
									{__('Loading…', 'doublescale')}
								</div>
							) : assigneeReadOnly ? (
								<div className="flex h-10 items-center rounded-lg border border-border bg-slate-50 px-3 py-2 text-sm">
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
									<SelectTrigger className="w-full !rounded-lg !border-border">
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

					<div className="space-y-4 rounded-lg border border-[#DEE1E6] bg-[#F7F8FA] p-4">
						<div className="flex items-center justify-between border-b border-[#DEE1E6] pb-4">
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
			</div>

			<FormField label={__('Contract Body', 'doublescale')} required className="!mb-0 border-t border-[#DEE1E6] pt-4">
				<div className={contractEditorWrapperClassName}>
					<Editor
						message={description}
						onChange={setDescription}
						placeholder={__('Write a contract body here…', 'doublescale')}
					/>
				</div>
			</FormField>
		</>
	);

	return panelShell(
		<div className="space-y-6">
			<h1 className="text-2xl font-semibold text-foreground">
				{pageTitle}
			</h1>

			{error ? <div className="text-sm text-red-600">{error}</div> : null}

			<ApprovalStatusBanner
				approval={approval}
				showReapprovalWarning={showReapprovalWarning}
			/>

			<fieldset
				disabled={fieldsLocked}
				className="m-0 min-w-0 space-y-0 border-0 p-0"
			>
				{isNew ? (
					contractInformationContent
				) : (
					<PageTabs
						defaultValue="information"
						tabsListWrapperClassName="mb-6"
						tabsListClassName="flex flex-col sm:flex-row h-auto w-full max-w-sm gap-3 bg-transparent p-0"
						tabsTriggerClassName="h-10 flex-1 rounded-xl px-4 text-base font-normal transition-colors data-[state=active]:border-0 data-[state=active]:bg-[#EEEEFF] data-[state=active]:text-primary data-[state=active]:shadow-none data-[state=inactive]:border data-[state=inactive]:border-[#DEE1E6] data-[state=inactive]:bg-white data-[state=inactive]:text-[#29292E] data-[state=inactive]:shadow-none hover:data-[state=inactive]:bg-white"
						tabsList={[
							{
								value: 'information',
								label: __(
									'Contract Information',
									'doublescale'
								),
							},
							{
								value: 'attachments',
								label: __('Attachments', 'doublescale'),
							},
						]}
						tabsContent={[
							{
								value: 'information',
								children: contractInformationContent,
							},
							{
								value: 'attachments',
								children: (
									<ContractAttachmentsPanel
										contractId={contractId}
										layout="form"
										onNotice={(message) =>
											setError(message)
										}
									/>
								),
							},
						]}
					/>
				)}
			</fieldset>

			<div className="flex flex-col-reverse items-center gap-3 sm:flex-row sm:justify-between">
				<Button
					variant="outline"
					onClick={handleClose}
					className="border-primary bg-white text-primary"
				>
					{__('Cancel', 'doublescale')}
				</Button>
				<div className="flex flex-wrap justify-center gap-2 sm:justify-end">
					{isNew ? (
						<>
							<Button
								variant="outline"
								className="border-primary bg-white text-primary"
								onClick={() => void handleSave()}
								disabled={saving || fieldsLocked}
							>
								{saving
									? __('Saving…', 'doublescale')
									: __('Save', 'doublescale')}
							</Button>
							{showSubmitApproval ? (
								<Button
									variant="outline"
									className="border-primary bg-white text-primary"
									onClick={() =>
										void handleSubmitForApproval()
									}
									disabled={saving || submittingApproval}
								>
									{submittingApproval
										? __('Submitting…', 'doublescale')
										: __(
												'Submit for Approval',
												'doublescale'
											)}
								</Button>
							) : null}
							{showSend ? (
								<Button
									onClick={() => setSendOpen(true)}
									disabled={saving || status === 'expired'}
								>
									{__('Save & Send', 'doublescale')}
								</Button>
							) : null}
						</>
					) : (
						<>
							{showSubmitApproval ? (
								<Button
									variant="outline"
									className="border-primary bg-white text-primary"
									onClick={() =>
										void handleSubmitForApproval()
									}
									disabled={
										saving ||
										submittingApproval ||
										fieldsLocked
									}
								>
									{submittingApproval
										? __('Submitting…', 'doublescale')
										: __(
												'Submit for Approval',
												'doublescale'
											)}
								</Button>
							) : null}
							{showSend ? (
								<Button
									variant="outline"
									className="border-primary bg-white text-primary"
									onClick={() => setSendOpen(true)}
									disabled={
										saving ||
										status === 'expired' ||
										fieldsLocked
									}
								>
									{__('Save & Send', 'doublescale')}
								</Button>
							) : null}
							<Button
								onClick={() => void handleSave()}
								disabled={saving || fieldsLocked}
							>
								{saving
									? __('Saving…', 'doublescale')
									: __('Edit', 'doublescale')}
							</Button>
						</>
					)}
				</div>
			</div>

			<SendDocumentDialog
				open={sendOpen}
				onOpenChange={setSendOpen}
				icon={<GradientContractsIcon width={24} height={24} />}
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
				<DialogContent className="max-w-lg z-[150200] bg-white">
					<DialogHeader>
						<CustomDialogHeader
							title={__('New Contract Type', 'doublescale')}
							subtitle={__(
								'Quickly add a new type with a clear interface that keeps everything organized',
								'doublescale'
							)}
							icon={<GradientContractTypeIcon />}
						/>
					</DialogHeader>
					<div className="space-y-2">
						<Label htmlFor="new-contract-type-name">
							{__('Name', 'doublescale')}
						</Label>
						<Input
							id="new-contract-type-name"
							value={newTypeName}
							onChange={(e) => setNewTypeName(e.target.value)}
							placeholder={__('Type name', 'doublescale')}
							className="!rounded-lg !border-border"
						/>
					</div>
					<DialogFooter className="flex gap-2 sm:justify-end">
						<Button
							variant="outline"
							onClick={() => setTypeDialogOpen(false)}
							className="border-primary bg-white text-primary"
						>
							{__('Cancel', 'doublescale')}
						</Button>
						<Button
							onClick={() => void handleCreateType()}
							disabled={typeBusy}
						>
							{typeBusy
								? __('Saving…', 'doublescale')
								: __('Create', 'doublescale')}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
};

export default ContractEdit;
