/**
 * Invoice create/edit form.
 */

import React, { useCallback, useEffect, useRef, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import apiFetch from '@wordpress/api-fetch';
import { useParams } from '@doublescale/navigation';

import { useNavigate, getToLink, useLocation } from '@doublescale/navigation';
import { FormField, TagField, InfiniteScrollSelect } from '@doublescale/components';
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
import { LineItemsEditor } from '@/components/sales';
import {
	formatContactAddressBlock,
	normalizeSalesContact,
} from '@/components/sales/contact-sales-fields';
import {
	createInvoice,
	sendInvoice,
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
	OFFLINE_PAYMENT_MODES,
	OFFLINE_PAYMENT_MODE_LABELS,
	ONLINE_PAYMENT_GATEWAYS,
	ONLINE_PAYMENT_GATEWAY_LABELS,
} from '@/constants/sales';

const selectClass =
	'w-full border border-input rounded-md px-3 py-2 text-sm bg-background';

const today = () => new Date().toISOString().slice(0, 10);
const monthFromToday = () => {
	const d = new Date();
	d.setMonth(d.getMonth() + 1);
	return d.toISOString().slice(0, 10);
};

const contactOptionLabel = (contact: ContactSummary): string => {
	const name = [contact.first_name, contact.last_name].filter(Boolean).join(' ').trim();
	return name ? `${name} (${contact.email})` : contact.email;
};

const InvoiceEdit: React.FC = () => {
	const navigate = useNavigate();
	const location = useLocation();
	const params = useParams();
	const idParam = params?.id;
	const isNew = !idParam || idParam === 'new';
	const invoiceId = !isNew && idParam ? Number(idParam) : null;

	const { data: existing, loading } = useInvoice(invoiceId);
	const { data: salesSettings } = useSalesSettings();
	const { data: assignableUsers, loading: usersLoading } = useAssignableSalesUsers();

	const [status, setStatus] = useState('draft');
	const [contact, setContact] = useState<ContactSummary | null>(null);
	const [invoiceDate, setInvoiceDate] = useState(today());
	const [dueDate, setDueDate] = useState(monthFromToday());
	const [currency, setCurrency] = useState('USD');
	const [discountType, setDiscountType] = useState('none');
	const [discountValue, setDiscountValue] = useState(0);
	const [adjustment, setAdjustment] = useState(0);
	const [allowedPaymentModes, setAllowedPaymentModes] = useState<string[]>([]);
	const [billingAddress, setBillingAddress] = useState('');
	const [shippingAddress, setShippingAddress] = useState('');
	const [clientNote, setClientNote] = useState('');
	const [terms, setTerms] = useState('');
	const [saleAgentUserId, setSaleAgentUserId] = useState<number | null>(null);
	const [tagIds, setTagIds] = useState<number[]>([]);
	const [lineItems, setLineItems] = useState<LineItem[]>([
		{
			description: '',
			long_description: '',
			qty: 1,
			unit: '',
			rate: 0,
			tax: [],
			amount: 0,
			optional: false,
		},
	]);
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const prefilledContactFromUrlRef = useRef(false);

	useEffect(() => {
		if (!existing) {
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
		setLineItems(
			existing.line_items?.length
				? existing.line_items
				: [
						{
							description: '',
							qty: 1,
							rate: 0,
							amount: 0,
						},
					]
		);
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
			prev.includes(mode) ? prev.filter((m) => m !== mode) : [...prev, mode]
		);
	};

	const handleSave = async (andSend = false) => {
		if (!contact) {
			setError(__('Please select a customer.', 'doublescale'));
			return;
		}

		setSaving(true);
		setError(null);

		const payload = {
			status,
			contact_id: contact.id,
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
		};

		try {
			let id = invoiceId;
			if (isNew) {
				const created = await createInvoice(payload);
				id = created.id;
			} else if (invoiceId) {
				await updateInvoice(invoiceId, payload);
			}

			if (andSend && id) {
				await sendInvoice(id);
			}

			navigate(getToLink(`sales/invoices/${id}`));
		} catch (err: unknown) {
			setError(err instanceof Error ? err.message : __('Save failed.', 'doublescale'));
		} finally {
			setSaving(false);
		}
	};

	if (!isNew && loading) {
		return (
			<div className="p-6 text-muted-foreground">{__('Loading…', 'doublescale')}</div>
		);
	}

	return (
		<div className="p-6 space-y-6 max-w-6xl">
			<div className="flex items-center justify-between">
				<h1 className="text-2xl font-semibold">
					{isNew ? __('Create New Invoice', 'doublescale') : __('Edit Invoice', 'doublescale')}
				</h1>
				<Button variant="outline" onClick={() => navigate(getToLink('sales/invoices'))}>
					{__('Back', 'doublescale')}
				</Button>
			</div>

			{error ? <div className="text-sm text-red-600">{error}</div> : null}

			<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
				<div className="space-y-4">
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
					<FormField label={__('Sale Agent', 'doublescale')} className="!mb-0">
						{usersLoading ? (
							<div className="text-sm text-muted-foreground">{__('Loading…', 'doublescale')}</div>
						) : assignableUsers.length <= 1 ? (
							<div className="border rounded px-3 py-2 bg-slate-50 text-sm h-10 flex items-center">
								{assignableUsers.find((u) => u.id === saleAgentUserId)?.display_name ||
									assignableUsers[0]?.display_name ||
									'—'}
							</div>
						) : (
							<Select
								value={saleAgentUserId ? String(saleAgentUserId) : 'unassigned'}
								onValueChange={(next) =>
									setSaleAgentUserId(next === 'unassigned' ? null : Number(next))
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
					<FormField label={__('Tags', 'doublescale')} className="!mb-0">
						<TagField value={tagIds} onChange={setTagIds} />
					</FormField>
					<FormField label={__('Bill To', 'doublescale')} className="!mb-0">
						<Textarea
							value={billingAddress}
							onChange={(e) => setBillingAddress(e.target.value)}
							rows={4}
						/>
					</FormField>
					<FormField label={__('Ship To', 'doublescale')} className="!mb-0">
						<Textarea
							value={shippingAddress}
							onChange={(e) => setShippingAddress(e.target.value)}
							rows={4}
						/>
					</FormField>
					<div className="grid grid-cols-2 gap-3">
						<FormField label={__('Invoice Date', 'doublescale')} className="!mb-0">
							<DatePicker
								value={invoiceDate}
								onChange={setInvoiceDate}
								outputFormat="iso"
								placeholder={__('Select date', 'doublescale')}
								buttonClassName="w-full"
								className="w-full"
							/>
						</FormField>
						<FormField label={__('Due Date', 'doublescale')} className="!mb-0">
							<DatePicker
								value={dueDate}
								onChange={setDueDate}
								outputFormat="iso"
								placeholder={__('Select date', 'doublescale')}
								buttonClassName="w-full"
								className="w-full"
							/>
						</FormField>
					</div>
				</div>

				<div className="space-y-4">
					<div className="space-y-2">
						<Label>{__('Status', 'doublescale')}</Label>
						<select
							className="w-full border rounded px-3 py-2"
							value={status}
							onChange={(e) => setStatus(e.target.value)}
						>
							{INVOICE_STATUSES.map((s) => (
								<option key={s} value={s}>
									{s}
								</option>
							))}
						</select>
					</div>
					<div className="grid grid-cols-2 gap-3">
						<FormField label={__('Currency', 'doublescale')} className="!mb-0">
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
						<FormField label={__('Discount Type', 'doublescale')} className="!mb-0">
							<select
								className={selectClass}
								value={discountType}
								onChange={(e) => setDiscountType(e.target.value)}
							>
								{DISCOUNT_TYPES.map((option) => (
									<option key={option.value} value={option.value}>
										{option.label}
									</option>
								))}
							</select>
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
								step="0.01"
								value={discountValue}
								onChange={(e) => setDiscountValue(Number(e.target.value))}
							/>
						</FormField>
					) : null}
					<div className="space-y-2">
						<Label>{__('Offline payment methods', 'doublescale')}</Label>
						<p className="text-xs text-muted-foreground">
							{__('Recorded manually by staff when the customer pays offline.', 'doublescale')}
						</p>
						<div className="flex flex-wrap gap-2">
							{OFFLINE_PAYMENT_MODES.map((mode) => (
								<button
									key={mode}
									type="button"
									className={`px-3 py-1 rounded border text-sm ${
										allowedPaymentModes.includes(mode)
											? 'bg-primary text-white border-primary'
											: 'bg-white'
									}`}
									onClick={() => togglePaymentMode(mode)}
								>
									{OFFLINE_PAYMENT_MODE_LABELS[mode]}
								</button>
							))}
						</div>
					</div>
					<div className="space-y-2">
						<Label>{__('Online payment gateways', 'doublescale')}</Label>
						<p className="text-xs text-muted-foreground">
							{__(
								'Customers can pay automatically on the public invoice page. Stripe uses Integrations → Stripe.',
								'doublescale'
							)}
						</p>
						<div className="flex flex-wrap gap-2">
							{ONLINE_PAYMENT_GATEWAYS.map((mode) => (
								<button
									key={mode}
									type="button"
									className={`px-3 py-1 rounded border text-sm ${
										allowedPaymentModes.includes(mode)
											? 'bg-primary text-white border-primary'
											: 'bg-white'
									}`}
									onClick={() => togglePaymentMode(mode)}
								>
									{ONLINE_PAYMENT_GATEWAY_LABELS[mode]}
								</button>
							))}
						</div>
					</div>
				</div>
			</div>

			<LineItemsEditor
				items={lineItems}
				onChange={setLineItems}
				currency={currency}
				discountType={discountType}
				discountValue={discountValue}
				adjustment={adjustment}
				onAdjustmentChange={setAdjustment}
				hideDiscountTypeSelect
			/>

			<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
				<div className="space-y-2">
					<Label>{__('Client Note', 'doublescale')}</Label>
					<Textarea
						value={clientNote}
						onChange={(e) => setClientNote(e.target.value)}
						rows={5}
					/>
				</div>
				<div className="space-y-2">
					<Label>{__('Terms & Conditions', 'doublescale')}</Label>
					<Textarea value={terms} onChange={(e) => setTerms(e.target.value)} rows={5} />
				</div>
			</div>

			<div className="flex justify-end gap-2">
				<Button variant="outline" onClick={() => navigate(getToLink('sales/invoices'))}>
					{__('Cancel', 'doublescale')}
				</Button>
				<Button variant="outline" onClick={() => void handleSave(false)} disabled={saving}>
					{saving ? __('Saving…', 'doublescale') : __('Save', 'doublescale')}
				</Button>
				<Button onClick={() => void handleSave(true)} disabled={saving || status === 'paid'}>
					{saving ? __('Sending…', 'doublescale') : __('Save & Send', 'doublescale')}
				</Button>
			</div>
		</div>
	);
};

export default InvoiceEdit;
