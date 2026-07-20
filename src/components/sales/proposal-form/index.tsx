/**
 * Proposal create/edit form.
 */

import React, { useCallback, useEffect, useRef, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import apiFetch from '@wordpress/api-fetch';
import { useParams } from '@doublescale/navigation';

import { useNavigate, getToLink, useLocation } from '@doublescale/navigation';
import { FormField, InfiniteScrollSelect, PanelLayout, GradientProposalsIcon } from '@doublescale/components';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { ProposalDocumentPreview } from '../document-preview';
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
	normalizeSalesContact,
	proposalFieldsFromContact,
} from '@/components/sales/contact-sales-fields';
import {
	createProposal,
	sendProposal,
	submitProposalForApproval,
	updateProposal,
	useAssignableSalesUsers,
	useProposal,
	useSalesSettings,
} from '@/hooks/sales';
import config from '@doublescale/config';
import type { ContactSummary, LineItem, Proposal } from '@/types/sales';
import { DISCOUNT_TYPES, PROPOSAL_STATUSES } from '@/constants/sales';
import {
	DesignPickerRow,
	TemplateGallery,
} from '../document-templates/template-gallery';
import { normalizeTemplateColor } from '../document-templates/color-presets';
import { DocumentEditorSidebar } from '../document-templates/document-editor-sidebar';
import { DocumentEditorSteps } from '../document-templates/document-editor-steps';
import { TemplateStyleEditor } from '../document-templates/template-style-editor';
import {
	DEFAULT_TEMPLATE_ID,
	normalizeTemplateId,
} from '../document-templates/registry';

const selectClass =
	'w-full border !border-border !rounded-lg px-3 py-2 text-sm bg-background';

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

export interface ProposalFormProps {
	proposalId?: number | null;
	initialContactId?: number;
	initialSubject?: string;
	initialLineItems?: LineItem[];
	initialCurrency?: string;
	mode?: 'page' | 'dialog';
	onClose?: () => void;
	onSaved?: (proposalId: number) => void;
}

const ProposalForm: React.FC<ProposalFormProps> = ({
	proposalId: proposalIdProp,
	initialContactId,
	initialSubject,
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
	const routeProposalId =
		idParam && idParam !== 'new' ? Number(idParam) : null;
	const proposalId =
		proposalIdProp !== undefined ? proposalIdProp : routeProposalId;
	const isNew = proposalId === null;
	const isDialog = mode === 'dialog';

	const goBack = () => {
		if (onClose) {
			onClose();
			return;
		}
		navigate(getToLink('sales/proposals'));
	};

	const handleSaveSuccess = (id: number) => {
		if (onSaved) {
			onSaved(id);
			return;
		}
		navigate(getToLink(`sales/proposals/${id}`));
	};

	const { data: existing, loading, refetch } = useProposal(proposalId);
	const { data: salesSettings } = useSalesSettings();
	const { data: assignableUsers, loading: usersLoading } = useAssignableSalesUsers();

	const [subject, setSubject] = useState(initialSubject ?? '');
	const [status, setStatus] = useState('draft');
	const [contact, setContact] = useState<ContactSummary | null>(null);
	const [date, setDate] = useState(today());
	const [openTill, setOpenTill] = useState(weekFromToday());
	const [currency, setCurrency] = useState(
		initialCurrency ?? config.getCurrency() ?? 'USD'
	);
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
	const [assignedUserId, setAssignedUserId] = useState<number | null>(null);
	const [lineItems, setLineItems] = useState<LineItem[]>(() =>
		isNew && initialLineItems?.length ? initialLineItems : []
	);
	const [template, setTemplate] = useState(DEFAULT_TEMPLATE_ID);
	const [templateColor, setTemplateColor] = useState<string | null>(null);
	const [templatePicked, setTemplatePicked] = useState(!isNew);
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const hydratedContactIdRef = useRef<number | null>(null);
	const prefilledContactFromUrlRef = useRef(false);

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

	const handleTemplateSelection = useCallback(
		({
			templateId,
			templateColor: color,
		}: {
			templateId: number;
			templateColor: string | null;
		}) => {
			setTemplate(templateId);
			setTemplateColor(color);
		},
		[]
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
				handleContactPick(String(contactId), normalizeSalesContact(full));
			} catch {
				prefilledContactFromUrlRef.current = false;
			}
		})();
	}, [isNew, location.search, handleContactPick, initialContactId]);

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
		setAssignedUserId(existing.assigned_user_id ?? null);
		hydratedContactIdRef.current = existing.contact_id ?? null;
		setLineItems(existing.line_items?.length ? existing.line_items : []);
		setTemplate(normalizeTemplateId(existing.template));
		setTemplateColor(normalizeTemplateColor(existing.template_color));
		setTemplatePicked(true);
	}, [existing]);

	useEffect(() => {
		if (!isNew || templatePicked || !salesSettings) {
			return;
		}
		setTemplate(
			normalizeTemplateId(
				salesSettings.default_proposal_template ?? DEFAULT_TEMPLATE_ID
			)
		);
	}, [isNew, templatePicked, salesSettings]);

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
		assigned_user_id: assignedUserId,
		line_items: lineItems,
		template,
		template_color: templateColor,
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

		const subtotal = computeLineItemsTotals(lineItems, 'none', 0, 0).subtotal;
		const discountError = getDiscountValidationError(discountType, discountValue, subtotal);
		if (discountError) {
			setError(discountError);
			return false;
		}

		return true;
	};

	const [sendOpen, setSendOpen] = useState(false);
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
		'proposal',
		status,
		approval,
		existing ?? undefined
	);
	const showSend = showDirectSendAction(
		workflowEnabled,
		'proposal',
		status,
		approval,
		status === 'declined',
		existing ?? undefined
	);

	const persistProposal = async (): Promise<number | null> => {
		if (!validateForm()) {
			return null;
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
			return id ?? null;
		} catch (err: unknown) {
			setError(
				formatSalesRestError(err, __('Save failed.', 'doublescale'), {
					approval_pending: __(
						'This proposal is pending approval and cannot be edited.',
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
		const id = await persistProposal();
		if (id) {
			handleSaveSuccess(id);
		}
	};

	const handleSaveAndSend = async (message: string) => {
		const id = await persistProposal();
		if (!id) {
			return;
		}

		setSaving(true);
		setError(null);
		try {
			await sendProposal(id, message);
			handleSaveSuccess(id);
		} catch (err: unknown) {
			setError(
				formatSalesRestError(err, __('Send failed.', 'doublescale'), {
					approval_required: __(
						'This proposal must be approved before it can be sent. Use Submit for Approval first.',
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
		const id = await persistProposal();
		if (!id) {
			return;
		}

		setSubmittingApproval(true);
		setError(null);
		try {
			await submitProposalForApproval(id);
			await refetch();
		} catch (err: unknown) {
			setError(
				formatSalesRestError(err, __('Failed to submit for approval.', 'doublescale'))
			);
		} finally {
			setSubmittingApproval(false);
		}
	};

	const canAssignSalesRep =
		config.getUserCapabilities().doublescale_can_assign_sales_rep === true;
	const assigneeReadOnly =
		assignableUsers.length === 0 ||
		(!canAssignSalesRep && assignableUsers.length <= 1);

	const handleClose = goBack;

	const pageTitle = isNew
		? __('Create New Proposal', 'doublescale')
		: __('Edit Proposal', 'doublescale');

	const breadcrumbItems = [
		{ label: __('Sales (Proposals)', 'doublescale'), href: 'sales/proposals' },
		{ label: pageTitle },
	];

	const panelShell = (children: React.ReactNode) => (
		<PanelLayout
			items={breadcrumbItems}
			showPanelClose
			onClosePanel={goBack}
			handleNavigate={(href) => navigate(getToLink(href))}
		>
			{children}
		</PanelLayout>
	);

	const dialogScrollShell = (children: React.ReactNode) => (
		<div className="mx-auto flex min-h-0 w-full max-w-[1680px] flex-1 flex-col overflow-hidden p-6">
			<div className="doublescale-contact-page-column-scroll min-h-0 flex-1 overflow-y-auto p-2 sm:p-4">
				{children}
			</div>
		</div>
	);

	if (!isNew && loading) {
		if (isDialog) {
			return dialogScrollShell(
				<div className="p-2 text-muted-foreground">
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

	if (isNew && !templatePicked) {
		const gallery = (
			<TemplateGallery
				docType="proposal"
				value={template}
				colorValue={templateColor}
				onSelect={({ templateId, templateColor: color }) => {
					setTemplate(templateId);
					setTemplateColor(color);
					setTemplatePicked(true);
				}}
				onCancel={goBack}
			/>
		);
		if (isDialog) {
			return dialogScrollShell(gallery);
		}
		return panelShell(gallery);
	}

	const buildDraftProposal = (): Proposal => {
		const totals = computeLineItemsTotals(
			lineItems,
			discountType,
			discountValue,
			adjustment
		);
		return {
			id: proposalId || 0,
			proposal_number:
				existing?.proposal_number || __('Draft', 'doublescale'),
			hash: existing?.hash || '',
			subject,
			status,
			template,
			template_color: templateColor,
			contact_id: contact?.id || 0,
			assigned_user_id: assignedUserId,
			date,
			open_till: openTill,
			currency,
			discount_type: discountType,
			discount_value: discountValue,
			line_items: lineItems,
			subtotal: totals.subtotal,
			adjustment,
			total: totals.total,
			to_name: toName,
			address,
			city,
			state,
			country,
			zip,
			email,
			phone,
			created_at: existing?.created_at ?? null,
			updated_at: existing?.updated_at ?? null,
			contact: contact ?? null,
		} as Proposal;
	};

	const editorSidebarProps = {
		templateId: template,
		templateColor,
		onColorChange: setTemplateColor,
		onTemplateChange: handleTemplateSelection,
		templateChangeDisabled: fieldsLocked,
	};

	const draftProposal = buildDraftProposal();

	const inlinePreview = (
		<div className="mb-6 rounded-2xl border border-border bg-[#FAFBFC] p-4">
			<div className="mb-3 flex flex-wrap items-center justify-between gap-2">
				<h2 className="text-sm font-semibold text-foreground">
					{__('Live Design Preview', 'doublescale')}
				</h2>
			</div>
			<div className="overflow-x-auto rounded-lg border border-border bg-white p-2 md:p-4">
				<ProposalDocumentPreview proposal={draftProposal} />
			</div>
		</div>
	);

	const formBody = (
		<div className="space-y-6">
			{isDialog ? (
				<>
					<DocumentEditorSteps activeStep="content" className="mb-4" />
					<h2 className="mb-6 text-xl font-semibold tracking-tight text-[#29292E]">
						{pageTitle}
					</h2>
				</>
			) : (
				<h1 className="text-2xl font-semibold text-foreground">{pageTitle}</h1>
			)}

			{error ? <div className="text-sm text-red-600">{error}</div> : null}

			<ApprovalStatusBanner
				approval={approval}
				showReapprovalWarning={showReapprovalWarning}
			/>

			{!isDialog ? (
			<DesignPickerRow
				docType="proposal"
				templateId={template}
				templateColor={templateColor}
				disabled={fieldsLocked}
				onChange={({ templateId, templateColor: color }) => {
					setTemplate(templateId);
					setTemplateColor(color);
				}}
			/>
			) : null}

			{!isDialog ? (
				<>
					<TemplateStyleEditor
						value={templateColor}
						onChange={setTemplateColor}
						compact
					/>
					{inlinePreview}
				</>
			) : null}

			<fieldset disabled={fieldsLocked} className="m-0 min-w-0 space-y-0 border-0 p-0">
			<div className="grid grid-cols-1 lg:grid-cols-2 mb-6">
				<div className="space-y-4 lg:border-r lg:border-[#DEE1E6] lg:pr-8">
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

					<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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

					<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
								max={isPercentDiscountType(discountType) ? 100 : undefined}
								step="0.01"
								value={discountValue}
								onChange={(e) =>
									setDiscountValue(parseDiscountInput(e.target.value))
								}
								className="!rounded-lg !border-border "
							/>
						</FormField>
					) : null}
				</div>

				<div className="space-y-4 lg:pl-8 pt-6 lg:pt-0">
					<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
								<div className="border rounded-lg border-border px-3 py-2 bg-slate-50 text-sm h-10 flex items-center">
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

					<FormField label={__('To', 'doublescale')} required className="!mb-0">
						<Input value={toName} onChange={(e) => setToName(e.target.value)} />
					</FormField>

					<FormField label={__('Address', 'doublescale')} className="!mb-0">
						<Textarea value={address} onChange={(e) => setAddress(e.target.value)} rows={3} />
					</FormField>

					<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
						<FormField label={__('City', 'doublescale')} className="!mb-0">
							<Input value={city} onChange={(e) => setCity(e.target.value)} />
						</FormField>
						<FormField label={__('State', 'doublescale')} className="!mb-0">
							<Input value={state} onChange={(e) => setState(e.target.value)} />
						</FormField>
					</div>

					<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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

					<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
						<FormField label={__('Email', 'doublescale')} required className="!mb-0">
							<Input type="email" value={email} className="!rounded-lg !border-border" onChange={(e) => setEmail(e.target.value)} />
						</FormField>
						<FormField label={__('Phone', 'doublescale')} className="!mb-0">
							<Input value={phone} onChange={(e) => setPhone(e.target.value)} />
						</FormField>
					</div>
				</div>
			</div>

			<div className="border-t border-[#DEE1E6] pt-6">
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
				readOnly={fieldsLocked}
			/>
			</div>
			</fieldset>

			{isDialog ? (
				<div className="mt-6 space-y-4 border-t border-border pt-6 lg:hidden">
					<DocumentEditorSidebar
						docType="proposal"
						{...editorSidebarProps}
						preview={
							<ProposalDocumentPreview proposal={draftProposal} />
						}
					/>
				</div>
			) : null}

		</div>
	);

	const formFooter = (
		<div className="flex flex-col-reverse gap-3 sm:flex-row items-center sm:justify-between">
			<Button
				variant={isDialog ? 'secondaryDeepBlue' : 'outline'}
				onClick={handleClose}
				className={isDialog ? 'rounded-lg' : 'border-primary text-primary bg-white'}
			>
				{__('Cancel', 'doublescale')}
			</Button>
			<div className="flex flex-wrap justify-center sm:justify-end gap-2">
				<Button
					variant={isDialog ? 'secondaryDeepBlue' : 'outline'}
					className={isDialog ? 'rounded-lg' : 'border-primary text-primary bg-white'}
					onClick={() => void handleSave()}
					disabled={saving || submittingApproval || fieldsLocked}
				>
					{saving ? __('Saving…', 'doublescale') : __('Save', 'doublescale')}
				</Button>
				{showSubmitApproval ? (
					<Button
						variant={isDialog ? 'gradient' : 'default'}
						className={isDialog ? 'rounded-lg' : undefined}
						onClick={() => void handleSubmitForApproval()}
						disabled={saving || submittingApproval}
					>
						{submittingApproval
							? __('Submitting…', 'doublescale')
							: __('Save & Submit for Approval', 'doublescale')}
					</Button>
				) : null}
				{showSend ? (
					<Button
						variant={isDialog ? 'gradient' : 'default'}
						className={isDialog ? 'rounded-lg' : undefined}
						onClick={() => setSendOpen(true)}
						disabled={saving || submittingApproval}
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
				<div className="flex min-h-0 flex-1 overflow-hidden rounded-[20px] bg-white shadow-[0_4px_20px_0_rgba(59,130,246,0.14)]">
					<div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
						<div className="doublescale-contact-page-column-scroll min-h-0 flex-1 overflow-y-auto p-6 lg:pr-4">
							{formBody}
						</div>
						<div className="shrink-0 border-t border-border bg-white px-6 py-4">
							{formFooter}
						</div>
					</div>
					<div className="doublescale-contact-page-column-scroll hidden min-h-0 w-[min(420px,36vw)] shrink-0 overflow-y-auto border-l border-border bg-[#F4F6F9] p-4 lg:block">
						<DocumentEditorSidebar
							docType="proposal"
							{...editorSidebarProps}
							preview={
								<ProposalDocumentPreview proposal={draftProposal} />
							}
						/>
					</div>
				</div>
				<SendDocumentDialog
					open={sendOpen}
					onOpenChange={setSendOpen}
					icon={<GradientProposalsIcon width={32} height={32} />}
					title={__('Save & Send Proposal', 'doublescale')}
					description={__(
						'Save this proposal and email it to the customer. Add an optional personal note below.',
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
				icon={<GradientProposalsIcon width={32} height={32} />}
				title={__('Save & Send Proposal', 'doublescale')}
				description={__(
					'Save this proposal and email it to the customer. Add an optional personal note below.',
					'doublescale'
				)}
				confirmLabel={__('Save & Send', 'doublescale')}
				busy={saving}
				onConfirm={handleSaveAndSend}
			/>
		</>
	);
};

export { ProposalForm };
export default ProposalForm;
