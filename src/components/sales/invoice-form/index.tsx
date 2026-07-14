/**
 * Invoice create/edit form.
 */

import React, {
	useCallback,
	useEffect,
	useRef,
	useState,
} from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import apiFetch from '@wordpress/api-fetch';
import { useParams } from '@doublescale/navigation';

import { useNavigate, getToLink, useLocation } from '@doublescale/navigation';
import {
	FormField,
	TagField,
	InfiniteScrollSelect,
	NovicesIcon,
	PanelLayout,
} from '@doublescale/components';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { DatePicker } from '@/components/ui/date-picker';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import { LineItemsEditor, computeLineItemsTotals } from '../line-items-editor';
import { SendDocumentDialog } from '../send-document-dialog';
import { ApprovalStatusBanner } from '../approval-status-banner';
import {
	canEditSalesDocument,
	canSubmitForApproval,
	isApprovalWorkflowEnabled,
	requiresReapprovalAfterEdit,
	showDirectSendAction,
	formatSalesRestError,
} from '@/components/sales/sales-approval-utils';
import {
	getDiscountValidationError,
	isPercentDiscountType,
	parseDiscountInput,
} from '@/components/sales/sales-discount-utils';
import {
	formatContactAddressBlock,
	normalizeSalesContact,
} from '@/components/sales/contact-sales-fields';
import {
	createInvoice,
	sendInvoice,
	submitInvoiceForApproval,
	updateInvoice,
	useAssignableSalesUsers,
	useInvoice,
	useSalesSettings,
} from '@/hooks/sales';
import type { ContactSummary, LineItem } from '@/types/sales';
import {
	CURRENCIES,
	DISCOUNT_TYPES,
	INVOICE_STATUSES,
	INVOICE_STATUS_LABELS,
	OFFLINE_PAYMENT_MODES,
	OFFLINE_PAYMENT_MODE_LABELS,
	ONLINE_PAYMENT_GATEWAYS,
	ONLINE_PAYMENT_GATEWAY_LABELS,
} from '@/constants/sales';

export interface InvoiceFormProps {
	invoiceId?: number | null;
	initialContactId?: number;
	initialLineItems?: LineItem[];
	initialCurrency?: string;
	mode?: 'page' | 'dialog';
	onClose?: () => void;
	onSaved?: (invoiceId: number) => void;
}

const selectTriggerClass = 'h-10 w-full rounded-lg border-[#D0D0D0] bg-white';

const paymentModePillClass = (selected: boolean) =>
	selected
		? 'border border-border bg-white text-foreground'
		: 'border-0 bg-[#EEF] text-[#3A3A99] font-medium';

const today = () => new Date().toISOString().slice(0, 10);
const monthFromToday = () => {
	const d = new Date();
	d.setMonth(d.getMonth() + 1);
	return d.toISOString().slice(0, 10);
};

const contactOptionLabel = (contact: ContactSummary): string => {
	const name = [contact.first_name, contact.last_name]
		.filter(Boolean)
		.join(' ')
		.trim();
	return name ? `${name} (${contact.email})` : contact.email;
};

const InvoiceForm: React.FC<InvoiceFormProps> = ({
	invoiceId: invoiceIdProp,
	initialContactId,
	initialLineItems,
	initialCurrency,
	mode = 'page',
	onClose,
	onSaved,
}) => {
	const navigate = useNavigate();
	const location = useLocation();
	const params = useParams();
	const idParam = params?.id;
	const routeInvoiceId =
		idParam && idParam !== 'new' ? Number(idParam) : null;
	const invoiceId =
		invoiceIdProp !== undefined ? invoiceIdProp : routeInvoiceId;
	const isNew = invoiceId === null;
	const isDialog = mode === 'dialog';

	const goBack = () => {
		if (onClose) {
			onClose();
			return;
		}
		navigate(getToLink('sales/invoices'));
	};

	const handleSaveSuccess = (id: number) => {
		if (onSaved) {
			onSaved(id);
			return;
		}
		navigate(getToLink(`sales/invoices/${id}`));
	};

	const { data: existing, loading, refetch } = useInvoice(invoiceId);
	const { data: salesSettings } = useSalesSettings();
	const { data: assignableUsers, loading: usersLoading } =
		useAssignableSalesUsers();

	const [status, setStatus] = useState('draft');
	const [contact, setContact] = useState<ContactSummary | null>(null);
	const [invoiceDate, setInvoiceDate] = useState(today());
	const [dueDate, setDueDate] = useState(monthFromToday());
	const [currency, setCurrency] = useState(initialCurrency ?? 'USD');
	const [discountType, setDiscountType] = useState('none');
	const [discountValue, setDiscountValue] = useState(0);
	const [adjustment, setAdjustment] = useState(0);
	const [allowedPaymentModes, setAllowedPaymentModes] = useState<string[]>(
		[]
	);
	const [billingAddress, setBillingAddress] = useState('');
	const [shippingAddress, setShippingAddress] = useState('');
	const [clientNote, setClientNote] = useState('');
	const [terms, setTerms] = useState('');
	const [saleAgentUserId, setSaleAgentUserId] = useState<number | null>(null);
	const [tagIds, setTagIds] = useState<number[]>([]);
	const [lineItems, setLineItems] = useState<LineItem[]>(() =>
		isNew && initialLineItems?.length ? initialLineItems : []
	);
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const prefilledContactFromUrlRef = useRef(false);
	const hydratedInvoiceIdRef = useRef<number | null>(null);

	useEffect(() => {
		hydratedInvoiceIdRef.current = null;
	}, [invoiceId]);

	useEffect(() => {
		if (!existing) {
			return;
		}
		if (hydratedInvoiceIdRef.current === existing.id) {
			return;
		}
		setStatus(existing.status);
		setContact(existing.contact || null);
		setInvoiceDate(existing.invoice_date || today());
		setDueDate(existing.due_date || monthFromToday());
		setCurrency(existing.currency || 'USD');
		setDiscountType(existing.discount_type || 'none');
		setDiscountValue(existing.discount_value || 0);
		setAdjustment(existing.adjustment || 0);
		setAllowedPaymentModes(existing.allowed_payment_modes || []);
		setBillingAddress(existing.billing_address || '');
		setShippingAddress(existing.shipping_address || '');
		setClientNote(existing.client_note || '');
		setTerms(existing.terms || '');
		setSaleAgentUserId(existing.sale_agent_user_id ?? null);
		setTagIds(
			Array.isArray(existing.tag_ids)
				? existing.tag_ids.map((id) => Number(id)).filter(Boolean)
				: []
		);
		setLineItems(existing.line_items?.length ? existing.line_items : []);
		hydratedInvoiceIdRef.current = existing.id;
	}, [existing]);

	const applyContactFields = useCallback((raw: ContactSummary) => {
		const block = formatContactAddressBlock(normalizeSalesContact(raw));
		if (block) {
			setBillingAddress(block);
			setShippingAddress(block);
		}
	}, []);

	const handleContactPick = useCallback(
		(_value: string, item?: ContactSummary | null) => {
			if (!item) {
				setContact(null);
				return;
			}
			const normalized = normalizeSalesContact(item);
			setContact(normalized);
			applyContactFields(normalized);
			void (async () => {
				try {
					const full = await apiFetch<ContactSummary>({
						path: `/doublescale/v1/contacts/${item.id}`,
					});
					const complete = normalizeSalesContact(full);
					setContact(complete);
					applyContactFields(complete);
				} catch {
					// List row already applied.
				}
			})();
		},
		[applyContactFields]
	);

	useEffect(() => {
		if (!isNew || prefilledContactFromUrlRef.current) {
			return;
		}
		const rawContactId =
			initialContactId ??
			Number(new URLSearchParams(location.search).get('contact_id'));
		if (!rawContactId) {
			return;
		}
		const contactId = Number(rawContactId);
		if (!contactId) {
			return;
		}
		prefilledContactFromUrlRef.current = true;
		void (async () => {
			try {
				const full = await apiFetch<ContactSummary>({
					path: `/doublescale/v1/contacts/${contactId}`,
				});
				handleContactPick(
					String(contactId),
					normalizeSalesContact(full)
				);
			} catch {
				prefilledContactFromUrlRef.current = false;
			}
		})();
	}, [isNew, location.search, handleContactPick, initialContactId]);

	useEffect(() => {
		if (assignableUsers.length === 1 && saleAgentUserId === null) {
			setSaleAgentUserId(assignableUsers[0].id);
		}
	}, [assignableUsers, saleAgentUserId]);

	useEffect(() => {
		if (!isNew || existing || !salesSettings) {
			return;
		}
		if (allowedPaymentModes.length > 0) {
			return;
		}
		const defaults = [
			...(salesSettings.default_offline_payment_modes ?? []),
			...(salesSettings.default_online_payment_gateways ?? []),
		];
		if (defaults.length > 0) {
			setAllowedPaymentModes(defaults);
		}
	}, [isNew, existing, salesSettings, allowedPaymentModes.length]);

	const togglePaymentMode = (mode: string) => {
		setAllowedPaymentModes((prev) =>
			prev.includes(mode)
				? prev.filter((m) => m !== mode)
				: [...prev, mode]
		);
	};

	const [sendOpen, setSendOpen] = useState(false);
	const [submittingApproval, setSubmittingApproval] = useState(false);

	const workflowEnabled = isApprovalWorkflowEnabled(
		salesSettings,
		existing ?? undefined
	);
	const approval = existing?.approval ?? null;
	const fieldsLocked = !canEditSalesDocument(
		workflowEnabled,
		approval,
		existing ?? undefined
	);
	const showReapprovalWarning = requiresReapprovalAfterEdit(
		workflowEnabled,
		approval,
		existing ?? undefined
	);
	const showSubmitApproval = canSubmitForApproval(
		workflowEnabled,
		'invoice',
		status,
		approval,
		existing ?? undefined
	);
	const showSend = showDirectSendAction(
		workflowEnabled,
		'invoice',
		status,
		approval,
		status === 'paid',
		existing ?? undefined
	);

	const buildPayload = () => ({
		status,
		contact_id: contact!.id,
		invoice_date: invoiceDate,
		due_date: dueDate,
		currency,
		discount_type: discountType,
		discount_value: discountValue,
		adjustment,
		allowed_payment_modes: allowedPaymentModes,
		billing_address: billingAddress,
		shipping_address: shippingAddress,
		client_note: clientNote,
		terms,
		sale_agent_user_id: saleAgentUserId,
		tag_ids: tagIds,
		line_items: lineItems,
	});

	const validateForm = (): boolean => {
		if (!contact) {
			setError(__('Please select a customer.', 'doublescale'));
			return false;
		}
		if (lineItems.length === 0) {
			setError(__('Please add at least one item.', 'doublescale'));
			return false;
		}

		const subtotal = computeLineItemsTotals(
			lineItems,
			'none',
			0,
			0
		).subtotal;
		const discountError = getDiscountValidationError(
			discountType,
			discountValue,
			subtotal
		);
		if (discountError) {
			setError(discountError);
			return false;
		}

		return true;
	};

	const persistInvoice = async (): Promise<number | null> => {
		if (!validateForm()) {
			return null;
		}

		setSaving(true);
		setError(null);

		try {
			let id = invoiceId;
			if (isNew) {
				const created = await createInvoice(buildPayload());
				id = created.id;
			} else if (invoiceId) {
				await updateInvoice(invoiceId, buildPayload());
			}
			return id ?? null;
		} catch (err: unknown) {
			setError(
				formatSalesRestError(err, __('Save failed.', 'doublescale'), {
					approval_pending: __(
						'This invoice is pending approval and cannot be edited.',
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
		const id = await persistInvoice();
		if (id) {
			handleSaveSuccess(id);
		}
	};

	const handleSaveAndSend = async (message: string) => {
		const id = await persistInvoice();
		if (!id) {
			return;
		}

		setSaving(true);
		setError(null);
		try {
			await sendInvoice(id, message);
			handleSaveSuccess(id);
		} catch (err: unknown) {
			setError(
				formatSalesRestError(err, __('Send failed.', 'doublescale'), {
					approval_required: __(
						'This invoice must be approved before it can be sent. Use Submit for Approval first.',
						'doublescale'
					),
				})
			);
		} finally {
			setSaving(false);
			setSendOpen(false);
		}
	};

	const handleSubmitForApproval = async () => {
		const id = await persistInvoice();
		if (!id) {
			return;
		}

		setSubmittingApproval(true);
		setError(null);
		try {
			await submitInvoiceForApproval(id);
			await refetch();
		} catch (err: unknown) {
			setError(
				formatSalesRestError(
					err,
					__('Failed to submit for approval.', 'doublescale')
				)
			);
		} finally {
			setSubmittingApproval(false);
		}
	};

	const pageTitle = isNew
		? __('Create New Invoice', 'doublescale')
		: __('Edit Invoice', 'doublescale');

	const breadcrumbItems = [
		{ label: __('Sales (Invoices)', 'doublescale'), href: 'sales/invoices' },
		{ label: pageTitle },
	];

	const panelShell = (children: React.ReactNode) => (
		<PanelLayout
			fullWidth
			items={breadcrumbItems}
			showPanelClose
			onClosePanel={goBack}
			handleNavigate={(href) => navigate(getToLink(href))}
		>
			{children}
		</PanelLayout>
	);

	if (!isNew && loading) {
		if (isDialog) {
			return (
				<div className="p-6 text-muted-foreground">
					{__('Loading…', 'doublescale')}
				</div>
			);
		}

		return panelShell(
			<div className="py-12 text-center text-muted-foreground">
				{__('Loading…', 'doublescale')}
			</div>
		);
	}

	const formBody = (
		<>
			{isDialog ? (
				<h2 className="mb-6 text-xl font-semibold tracking-tight text-[#29292E]">
					{pageTitle}
				</h2>
			) : (
				<h1 className="text-2xl font-semibold text-foreground">{pageTitle}</h1>
			)}

			{error ? <div className="text-sm text-red-600">{error}</div> : null}

			<ApprovalStatusBanner
				approval={approval}
				showReapprovalWarning={showReapprovalWarning}
			/>

			<fieldset
				disabled={fieldsLocked}
				className="m-0 min-w-0 space-y-6 border-0 p-0"
			>
				<div className="grid grid-cols-1 gap-6 md:grid-cols-2">
					<div className="space-y-4">
						<FormField
							label={__('Related', 'doublescale')}
							required
							className="!mb-0"
						>
							<InfiniteScrollSelect
								value={contact?.id ? String(contact.id) : ''}
								onValueChange={handleContactPick}
								placeholder={__(
									'Search contacts...',
									'doublescale'
								)}
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
						<FormField
							label={__('Sale Agent', 'doublescale')}
							className="!mb-0"
						>
							{usersLoading ? (
								<div className="text-sm text-muted-foreground">
									{__('Loading…', 'doublescale')}
								</div>
							) : assignableUsers.length <= 1 ? (
								<div className="flex h-10 items-center rounded-lg border border-border bg-[#ECECEC] px-3 text-sm text-[#29292E]">
									{assignableUsers.find(
										(u) => u.id === saleAgentUserId
									)?.display_name ||
										assignableUsers[0]?.display_name ||
										'—'}
								</div>
							) : (
								<Select
									value={
										saleAgentUserId
											? String(saleAgentUserId)
											: 'unassigned'
									}
									onValueChange={(next) =>
										setSaleAgentUserId(
											next === 'unassigned'
												? null
												: Number(next)
										)
									}
								>
									<SelectTrigger
										className={selectTriggerClass}
									>
										<SelectValue
											placeholder={__(
												'— Unassigned —',
												'doublescale'
											)}
										/>
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="unassigned">
											{__(
												'— Unassigned —',
												'doublescale'
											)}
										</SelectItem>
										{assignableUsers.map((user) => (
											<SelectItem
												key={user.id}
												value={String(user.id)}
											>
												{user.display_name}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							)}
						</FormField>
						<FormField
							label={__('Tags', 'doublescale')}
							className="!mb-0"
						>
							<TagField value={tagIds} onChange={setTagIds} />
						</FormField>
						<FormField
							label={__('Bill To', 'doublescale')}
							className="!mb-0"
						>
							<Textarea
								value={billingAddress}
								onChange={(e) =>
									setBillingAddress(e.target.value)
								}
								rows={4}
								className="rounded-lg border-[#D0D0D0] bg-white"
							/>
						</FormField>
						<FormField
							label={__('Ship To', 'doublescale')}
							className="!mb-0"
						>
							<Textarea
								value={shippingAddress}
								onChange={(e) =>
									setShippingAddress(e.target.value)
								}
								rows={4}
								className="rounded-lg border-[#D0D0D0] bg-white"
							/>
						</FormField>
						<div className="grid grid-cols-2 gap-3">
							<FormField
								label={__('Invoice Date', 'doublescale')}
								required
								className="!mb-0"
							>
								<DatePicker
									value={invoiceDate}
									onChange={setInvoiceDate}
									outputFormat="iso"
									placeholder={__(
										'Select date',
										'doublescale'
									)}
									buttonClassName="w-full rounded-lg border-[#D0D0D0]"
									className="w-full"
								/>
							</FormField>
							<FormField
								label={__('Due Date', 'doublescale')}
								className="!mb-0"
							>
								<DatePicker
									value={dueDate}
									onChange={setDueDate}
									outputFormat="iso"
									placeholder={__(
										'Select date',
										'doublescale'
									)}
									buttonClassName="w-full rounded-lg border-[#D0D0D0]"
									className="w-full"
								/>
							</FormField>
						</div>
					</div>

					<div className="space-y-4">
						{!isNew && existing?.invoice_number ? (
							<FormField
								label={__('Invoice #', 'doublescale')}
								className="!mb-0"
							>
								<div className="flex h-10 items-center rounded-lg border border-[#D0D0D0] bg-[#ECECEC] px-3 text-sm text-[#29292E]">
									{existing.invoice_number}
								</div>
							</FormField>
						) : null}
						<FormField
							label={__('Status', 'doublescale')}
							className="!mb-0"
						>
							<Select value={status} onValueChange={setStatus}>
								<SelectTrigger className={selectTriggerClass}>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									{INVOICE_STATUSES.map((s) => (
										<SelectItem key={s} value={s}>
											{INVOICE_STATUS_LABELS[s]}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</FormField>
						<div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
							<FormField
								label={__('Currency', 'doublescale')}
								required
								className="!mb-0"
							>
								<Select
									value={currency}
									onValueChange={setCurrency}
								>
									<SelectTrigger
										className={selectTriggerClass}
									>
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										{CURRENCIES.map((c) => (
											<SelectItem key={c} value={c}>
												{c}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</FormField>
							<FormField
								label={__('Discount Type', 'doublescale')}
								className="!mb-0"
							>
								<Select
									value={discountType}
									onValueChange={setDiscountType}
								>
									<SelectTrigger
										className={selectTriggerClass}
									>
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										{DISCOUNT_TYPES.map((option) => (
											<SelectItem
												key={option.value}
												value={option.value}
											>
												{option.label}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</FormField>
						</div>
						{discountType !== 'none' ? (
							<FormField
								label={
									discountType === 'fixed'
										? __('Discount Amount', 'doublescale')
										: __('Discount (%)', 'doublescale')
								}
								className="!mb-0"
							>
								<Input
									type="number"
									min={0}
									max={
										isPercentDiscountType(discountType)
											? 100
											: undefined
									}
									step="0.01"
									value={discountValue}
									onChange={(e) =>
										setDiscountValue(
											parseDiscountInput(e.target.value)
										)
									}
									className="rounded-lg border-[#D0D0D0]"
								/>
							</FormField>
						) : null}
						<div className="space-y-3 rounded-lg border border-border bg-[#F7F8FA] p-6">
							<div>
								<p className="text-lg font-semibold text-foreground">
									{__('Offline Methods', 'doublescale')}
								</p>
								<p className="mt-3  text-muted-foreground">
									{__(
										'Recorded manually by staff when the customer pays offline.',
										'doublescale'
									)}
								</p>
							</div>
							<div className="flex flex-wrap gap-4">
								{OFFLINE_PAYMENT_MODES.map((mode) => (
									<button
										key={mode}
										type="button"
										className={`rounded-md p-2 text-sm transition-colors ${paymentModePillClass(
											allowedPaymentModes.includes(mode)
										)}`}
										onClick={() => togglePaymentMode(mode)}
									>
										{OFFLINE_PAYMENT_MODE_LABELS[mode]}
									</button>
								))}
							</div>
						</div>
						<div className="space-y-3 rounded-lg border border-border bg-[#F7F8FA] p-6">
							<div>
								<p className="text-lg font-semibold text-foreground">
									{__('Online Gateways', 'doublescale')}
								</p>
								<p className="mt-3  text-muted-foreground">
									{__(
										'Shown on the public invoice when balance is due.',
										'doublescale'
									)}
								</p>
							</div>
							<div className="flex flex-wrap gap-2">
								{ONLINE_PAYMENT_GATEWAYS.map((mode) => (
									<button
										key={mode}
										type="button"
										className={`rounded-md px-3 py-1.5 text-sm transition-colors ${paymentModePillClass(
											allowedPaymentModes.includes(mode)
										)}`}
										onClick={() => togglePaymentMode(mode)}
									>
										{ONLINE_PAYMENT_GATEWAY_LABELS[mode]}
									</button>
								))}
							</div>
						</div>
					</div>
				</div>

				<div className=" h-[1px] w-full bg-[#DEE1E6] my-6"> </div>

				<LineItemsEditor
					items={lineItems}
					onChange={setLineItems}
					currency={currency}
					discountType={discountType}
					discountValue={discountValue}
					adjustment={adjustment}
					onAdjustmentChange={setAdjustment}
					hideDiscountTypeSelect
					readOnly={fieldsLocked}
				/>

				<div className=" h-[1px] w-full bg-[#DEE1E6] my-6"> </div>

				<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
					<div className="space-y-2">
						<Label className="text-sm !p-0 font-medium text-[#29292E]">
							{__('Client Note', 'doublescale')}
						</Label>
						<Textarea
							value={clientNote}
							onChange={(e) => setClientNote(e.target.value)}
							rows={5}
							placeholder={__('Client Note', 'doublescale')}
							className="rounded-lg border-[#D0D0D0] bg-white"
						/>
					</div>
					<div className="space-y-2">
						<Label className="text-sm p-0 font-medium text-[#29292E]">
							{__('Terms & Conditions', 'doublescale')}
						</Label>
						<Textarea
							value={terms}
							onChange={(e) => setTerms(e.target.value)}
							rows={5}
							placeholder={__(
								'Terms & Conditions',
								'doublescale'
							)}
							className="rounded-lg border-[#D0D0D0] bg-white"
						/>
					</div>
				</div>
			</fieldset>
		</>
	);

	const formFooter = (
		<div className="flex flex-col-reverse gap-3 sm:flex-row items-center sm:justify-between">
			<Button
				variant="secondaryDeepBlue"
				onClick={goBack}
				className="rounded-lg"
			>
				{__('Cancel', 'doublescale')}
			</Button>
			<div className="flex flex-wrap justify-center sm:justify-end gap-2">
				<Button
					variant="secondaryDeepBlue"
					onClick={() => void handleSave()}
					disabled={saving || submittingApproval || fieldsLocked}
					className="rounded-lg"
				>
					{saving
						? __('Saving…', 'doublescale')
						: __('Save', 'doublescale')}
				</Button>
				{showSubmitApproval ? (
					<Button
						variant="gradient"
						onClick={() => void handleSubmitForApproval()}
						disabled={saving || submittingApproval}
						className="rounded-lg"
					>
						{submittingApproval
							? __('Submitting…', 'doublescale')
							: __('Save & Submit for Approval', 'doublescale')}
					</Button>
				) : null}
				{showSend ? (
					<Button
						variant="gradient"
						onClick={() => setSendOpen(true)}
						disabled={saving || submittingApproval}
						className="rounded-lg"
					>
						{__('Save & Send', 'doublescale')}
					</Button>
				) : null}
			</div>
		</div>
	);

	if (isDialog) {
		return (
			<div className="mx-auto flex min-h-0 w-full max-w-[1680px] flex-1 flex-col overflow-hidden p-6">
				<div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[20px] bg-white shadow-[0_4px_20px_0_rgba(59,130,246,0.14)]">
					<div className="doublescale-contact-page-column-scroll min-h-0 flex-1 overflow-y-auto p-6">
						{formBody}
					</div>
					<div className="shrink-0  bg-white px-6 py-4">
						{formFooter}
					</div>
				</div>
				<SendDocumentDialog
					open={sendOpen}
					onOpenChange={setSendOpen}
					icon={<NovicesIcon width={32} height={32} />}
					title={__('Save & Send Invoice', 'doublescale')}
					description={__(
						'Save this invoice and email it to the customer. Add an optional personal note below.',
						'doublescale'
					)}
					confirmLabel={__('Save & Send', 'doublescale')}
					busy={saving}
					onConfirm={handleSaveAndSend}
				/>
			</div>
		);
	}

	return (
		<>
			{panelShell(
				<div className="space-y-6">
					{formBody}
					{formFooter}
				</div>
			)}
			<SendDocumentDialog
				open={sendOpen}
				onOpenChange={setSendOpen}
				icon={<NovicesIcon width={32} height={32} />}
				title={__('Save & Send Invoice', 'doublescale')}
				description={__(
					'Save this invoice and email it to the customer. Add an optional personal note below.',
					'doublescale'
				)}
				confirmLabel={__('Save & Send', 'doublescale')}
				busy={saving}
				onConfirm={handleSaveAndSend}
			/>
		</>
	);
};

export { InvoiceForm };
export default InvoiceForm;
