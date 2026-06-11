/**
 * Proposal create/edit form.
 */

import React, { useCallback, useEffect, useRef, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import apiFetch from '@wordpress/api-fetch';
import { useParams } from '@doublescale/navigation';

import { useNavigate, getToLink } from '@doublescale/navigation';
import { FormField, TagField, InfiniteScrollSelect } from '@doublescale/components';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
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
	normalizeSalesContact,
	proposalFieldsFromContact,
} from '@/components/sales/contact-sales-fields';
import {
	createProposal,
	sendProposal,
	updateProposal,
	useAssignableSalesUsers,
	useProposal,
} from '@/hooks/sales';
import type { ContactSummary, LineItem } from '@/types/sales';
import { CURRENCIES, DISCOUNT_TYPES, PROPOSAL_STATUSES } from '@/constants/sales';

const selectClass =
	'w-full border border-input rounded-md px-3 py-2 text-sm bg-background';

const contactOptionLabel = (contact: ContactSummary): string => {
	const name = [contact.first_name, contact.last_name].filter(Boolean).join(' ').trim();
	return name ? `${name} (${contact.email})` : contact.email;
};

const today = () => new Date().toISOString().slice(0, 10);
const weekFromToday = () => {
	const d = new Date();
	d.setDate(d.getDate() + 7);
	return d.toISOString().slice(0, 10);
};

const ProposalEdit: React.FC = () => {
	const navigate = useNavigate();
	const params = useParams();
	const idParam = params?.id;
	const isNew = !idParam || idParam === 'new';
	const proposalId = !isNew && idParam ? Number(idParam) : null;

	const { data: existing, loading } = useProposal(proposalId);
	const { data: assignableUsers, loading: usersLoading } = useAssignableSalesUsers();

	const [subject, setSubject] = useState('');
	const [status, setStatus] = useState('draft');
	const [contact, setContact] = useState<ContactSummary | null>(null);
	const [date, setDate] = useState(today());
	const [openTill, setOpenTill] = useState(weekFromToday());
	const [currency, setCurrency] = useState('USD');
	const [discountType, setDiscountType] = useState('none');
	const [discountValue, setDiscountValue] = useState(0);
	const [adjustment, setAdjustment] = useState(0);
	const [toName, setToName] = useState('');
	const [address, setAddress] = useState('');
	const [city, setCity] = useState('');
	const [state, setState] = useState('');
	const [country, setCountry] = useState('');
	const [zip, setZip] = useState('');
	const [email, setEmail] = useState('');
	const [phone, setPhone] = useState('');
	const [allowComments, setAllowComments] = useState(true);
	const [assignedUserId, setAssignedUserId] = useState<number | null>(null);
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
	const hydratedContactIdRef = useRef<number | null>(null);

	const applyContactFields = useCallback((raw: ContactSummary) => {
		const fields = proposalFieldsFromContact(normalizeSalesContact(raw));
		setToName(fields.to_name);
		setAddress(fields.address);
		setCity(fields.city);
		setState(fields.state);
		setCountry(fields.country);
		setZip(fields.zip);
		setEmail(fields.email);
		setPhone(fields.phone);
	}, []);

	const handleContactPick = useCallback(
		(_value: string, item?: ContactSummary | null) => {
			if (!item) {
				setContact(null);
				hydratedContactIdRef.current = null;
				return;
			}
			hydratedContactIdRef.current = item.id;
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
		setDate(existing.date || today());
		setOpenTill(existing.open_till || weekFromToday());
		setCurrency(existing.currency || 'USD');
		setDiscountType(existing.discount_type || 'none');
		setDiscountValue(existing.discount_value || 0);
		setAdjustment(existing.adjustment || 0);
		setToName(existing.to_name || '');
		setAddress(existing.address || '');
		setCity(existing.city || '');
		setState(existing.state || '');
		setCountry(existing.country || '');
		setZip(existing.zip || '');
		setEmail(existing.email || '');
		setPhone(existing.phone || '');
		setAllowComments(existing.allow_comments);
		setAssignedUserId(existing.assigned_user_id ?? null);
		setTagIds(
			Array.isArray(existing.tag_ids)
				? existing.tag_ids.map((id) => Number(id)).filter(Boolean)
				: []
		);
		hydratedContactIdRef.current = existing.contact_id ?? null;
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

	const buildPayload = () => ({
		subject: subject.trim(),
		status,
		contact_id: contact!.id,
		date,
		open_till: openTill,
		currency,
		discount_type: discountType,
		discount_value: discountValue,
		adjustment,
		to_name: toName,
		address,
		city,
		state,
		country,
		zip,
		email,
		phone,
		allow_comments: allowComments,
		assigned_user_id: assignedUserId,
		tag_ids: tagIds,
		line_items: lineItems,
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
		if (!email.trim()) {
			setError(__('Email is required.', 'doublescale'));
			return false;
		}
		return true;
	};

	const handleSave = async (andSend = false) => {
		if (!validateForm()) {
			return;
		}

		setSaving(true);
		setError(null);

		const payload = buildPayload();

		try {
			let id = proposalId;
			if (isNew) {
				const created = await createProposal(payload);
				id = created.id;
			} else if (proposalId) {
				await updateProposal(proposalId, payload);
			}

			if (andSend && id) {
				await sendProposal(id);
			}

			navigate(getToLink(`sales/proposals/${id}`));
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

	const assigneeReadOnly = assignableUsers.length <= 1;

	return (
		<div className="p-6 space-y-6 max-w-6xl">
			<div className="flex items-center justify-between">
				<h1 className="text-2xl font-semibold">
					{isNew ? __('New Proposal', 'doublescale') : __('Edit Proposal', 'doublescale')}
				</h1>
				<Button variant="outline" onClick={() => navigate(getToLink('sales/proposals'))}>
					{__('Back', 'doublescale')}
				</Button>
			</div>

			{error ? <div className="text-sm text-red-600">{error}</div> : null}

			<div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
				<div className="space-y-4">
					<FormField label={__('Subject', 'doublescale')} required className="!mb-0">
						<Input value={subject} onChange={(e) => setSubject(e.target.value)} />
					</FormField>

					<FormField label={__('Related', 'doublescale')} required className="!mb-0">
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

					<div className="grid grid-cols-2 gap-3">
						<FormField label={__('Date', 'doublescale')} required className="!mb-0">
							<DatePicker
								value={date}
								onChange={setDate}
								outputFormat="iso"
								placeholder={__('Select date', 'doublescale')}
								buttonClassName="w-full"
								className="w-full"
							/>
						</FormField>
						<FormField label={__('Open Till', 'doublescale')} className="!mb-0">
							<DatePicker
								value={openTill}
								onChange={setOpenTill}
								outputFormat="iso"
								placeholder={__('Select date', 'doublescale')}
								buttonClassName="w-full"
								className="w-full"
							/>
						</FormField>
					</div>

					<div className="grid grid-cols-2 gap-3">
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

					<FormField label={__('Tags', 'doublescale')} className="!mb-0">
						<TagField value={tagIds} onChange={setTagIds} />
					</FormField>

					<div className="flex items-center justify-between pt-2">
						<Label htmlFor="proposal-allow-comments">
							{__('Allow Comments', 'doublescale')}
						</Label>
						<Switch
							id="proposal-allow-comments"
							checked={allowComments}
							onCheckedChange={setAllowComments}
						/>
					</div>
				</div>

				<div className="space-y-4">
					<div className="grid grid-cols-2 gap-3">
						<FormField label={__('Status', 'doublescale')} className="!mb-0">
							<select
								className={selectClass}
								value={status}
								onChange={(e) => setStatus(e.target.value)}
							>
								{PROPOSAL_STATUSES.map((s) => (
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

					<FormField label={__('To', 'doublescale')} required className="!mb-0">
						<Input value={toName} onChange={(e) => setToName(e.target.value)} />
					</FormField>

					<FormField label={__('Address', 'doublescale')} className="!mb-0">
						<Textarea value={address} onChange={(e) => setAddress(e.target.value)} rows={3} />
					</FormField>

					<div className="grid grid-cols-2 gap-3">
						<FormField label={__('City', 'doublescale')} className="!mb-0">
							<Input value={city} onChange={(e) => setCity(e.target.value)} />
						</FormField>
						<FormField label={__('State', 'doublescale')} className="!mb-0">
							<Input value={state} onChange={(e) => setState(e.target.value)} />
						</FormField>
					</div>

					<div className="grid grid-cols-2 gap-3">
						<FormField label={__('Country', 'doublescale')} className="!mb-0">
							<Input
								value={country}
								onChange={(e) => setCountry(e.target.value)}
								placeholder={__('Country', 'doublescale')}
							/>
						</FormField>
						<FormField label={__('Zip Code', 'doublescale')} className="!mb-0">
							<Input value={zip} onChange={(e) => setZip(e.target.value)} />
						</FormField>
					</div>

					<div className="grid grid-cols-2 gap-3">
						<FormField label={__('Email', 'doublescale')} required className="!mb-0">
							<Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
						</FormField>
						<FormField label={__('Phone', 'doublescale')} className="!mb-0">
							<Input value={phone} onChange={(e) => setPhone(e.target.value)} />
						</FormField>
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
				onDiscountTypeChange={setDiscountType}
				onDiscountValueChange={setDiscountValue}
				onAdjustmentChange={setAdjustment}
				hideDiscountTypeSelect
			/>

			<div className="flex justify-end gap-2">
				<Button variant="outline" onClick={() => navigate(getToLink('sales/proposals'))}>
					{__('Cancel', 'doublescale')}
				</Button>
				<Button variant="outline" onClick={() => void handleSave(false)} disabled={saving}>
					{saving ? __('Saving…', 'doublescale') : __('Save', 'doublescale')}
				</Button>
				<Button onClick={() => void handleSave(true)} disabled={saving || status === 'declined'}>
					{saving ? __('Sending…', 'doublescale') : __('Save & Send', 'doublescale')}
				</Button>
			</div>
		</div>
	);
};

export default ProposalEdit;
