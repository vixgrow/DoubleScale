/**
 * Full-screen connection wizard dialog (Add / Edit SMTP connection).
 * Also contains the tightly-coupled Edit Account modal and Save Feedback dialog.
 */
import { __, sprintf } from '@wordpress/i18n';
import { CheckCheck, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import {
	getSmtpMailerLogoUrl,
	getSmtpMailerOptionLabel,
	getSmtpMailerUiMeta,
	isSmtpOAuthMailer,
	SMTP_MAILER_CATEGORY_LABEL,
	SMTP_MAILER_OPTIONS,
} from '../mailer-options';
import { mailerUsesFetchedFromEmails, type MailerFromEmailOption } from '../smtp-api';
import type { SmtpConnection } from '../types';
import AwsIdentitiesPanel from '../aws-identities-panel';
import TrashIcon from '@doublescale/shared/icons/trash';
import { EditIcon, PlusIcon } from '@doublescale/components';
import AccordingRightIcon from '@doublescale/shared/icons/according-right';
import NoSearchIcon from '@doublescale/shared/icons/no-search';
import {
	mailerInitialsFromLabel,
	mailerAccountSelectLabel,
	resolveFromEmailForSelect,
	shallowSnapshotWizardForm,
	SMTP_CONNECTION_INPUT_CLASS,
	SMTP_CONNECTION_SELECT_TRIGGER_CLASS,
	WIZARD_LAST_STEP,
	type MailerAccountRowMeta,
	type ApplyStoredRowOpts,
} from './form-utils';
import { OAuthCredentialFields, ApiCredentialFields } from './wizard-credential-fields';


export type ConnectionWizardDialogProps = {
	/** Main wizard open state */
	open: boolean;
	onOpenChange: (open: boolean) => void;

	/** Which connection is being edited ('__new__' for add flow) */
	editingId: string | null;
	wizardStep: number;

	form: SmtpConnection;
	setForm: React.Dispatch<React.SetStateAction<SmtpConnection>>;

	saving: boolean;

	/** Step navigation */
	goWizardNext: () => void;
	goWizardPrev: () => void;
	saveConnection: () => Promise<void>;
	saveProviderAccountOnly: () => Promise<void>;
	applyMailerSelection: (slug: string) => void;

	/** Step-3 account list */
	mailerAccountsLoading: boolean;
	staleLinkedVaultAccount: boolean;
	providerAccountEntriesForList: [string, MailerAccountRowMeta][];
	reuseStoredProviderAccount: boolean;
	oauthAuthorizeHref: string | null;
	handleOpenOAuthAuthorize: () => Promise<void>;
	deletingProviderAccount: boolean;
	providerAccountToDelete: { mailerSlug: string; accountId: string; label: string } | null;
	setProviderAccountToDelete: React.Dispatch<
		React.SetStateAction<{ mailerSlug: string; accountId: string; label: string } | null>
	>;
	selectLinkedAccountOnly: (accId: string) => void;
	selectVaultAccountRow: (
		accId: string,
		meta: MailerAccountRowMeta | undefined,
		slug: string,
		opts?: ApplyStoredRowOpts
	) => void;
	accountEditWizardSnapshotRef: React.MutableRefObject<SmtpConnection | null>;
	rightAccountPanelMode: 'add' | 'edit';
	setRightAccountPanelMode: React.Dispatch<React.SetStateAction<'add' | 'edit'>>;

	/** Edit Account modal */
	accountEditModalOpen: boolean;
	setAccountEditModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
	restoreWizardAfterClosingEditAccountModal: () => void;

	/** Save feedback dialog */
	connectionSaveFeedback: {
		variant: 'error' | 'success';
		title: string;
		lines: string[];
		closeWizardOnDismiss?: boolean;
	} | null;
	dismissConnectionSaveFeedback: () => void;

	/** Step-4 from-email */
	wizardFromEmailOptions: MailerFromEmailOption[];
	wizardFromEmailsLoading: boolean;
	wizardFromEmailsFetchFailed: boolean;
};

//  ---------------------------------------------------------------------------

export function ConnectionWizardDialog({
	open,
	onOpenChange,
	editingId,
	wizardStep,
	form,
	setForm,
	saving,
	goWizardNext,
	goWizardPrev,
	saveConnection,
	saveProviderAccountOnly,
	applyMailerSelection,
	mailerAccountsLoading,
	staleLinkedVaultAccount,
	providerAccountEntriesForList,
	reuseStoredProviderAccount,
	oauthAuthorizeHref,
	handleOpenOAuthAuthorize,
	deletingProviderAccount,
	providerAccountToDelete,
	setProviderAccountToDelete,
	selectLinkedAccountOnly,
	selectVaultAccountRow,
	accountEditWizardSnapshotRef,
	rightAccountPanelMode,
	setRightAccountPanelMode,
	accountEditModalOpen,
	setAccountEditModalOpen,
	restoreWizardAfterClosingEditAccountModal,
	connectionSaveFeedback,
	dismissConnectionSaveFeedback,
	wizardFromEmailOptions,
	wizardFromEmailsLoading,
	wizardFromEmailsFetchFailed,
}: ConnectionWizardDialogProps) {
	const step3MailerMeta = getSmtpMailerUiMeta(form.mailer || 'smtp');
	const fromEmailsApiActive =
		mailerUsesFetchedFromEmails(form.mailer || '') &&
		String(form.account_id || '').trim() !== '' &&
		!wizardFromEmailsFetchFailed;
	const showWizardFromEmailSelect =
		fromEmailsApiActive &&
		(wizardFromEmailsLoading || wizardFromEmailOptions.length > 0);

	const isSmtpRelay = form.mailer === 'smtp';

	const STEPS = [
		{ step: 1, num: 1, label: __('Basic Info', 'doublescale') },
		{ step: 2, num: 2, label: __('Mail provider', 'doublescale') },
		{ step: 3, num: 3, label: __('Provider account', 'doublescale') },
		{ step: 4, num: 4, label: __('Sender identity', 'doublescale') },
	];
	const currentStepMeta = STEPS.find((item) => item.step === wizardStep);
	const mobileStepProgress = (wizardStep / WIZARD_LAST_STEP) * 100;

	return (
		<>
			{/* Main Wizard Dialog                                                  */}
			<Dialog open={open} onOpenChange={onOpenChange}>
				<DialogContent
					className={cn(
						'!left-0 !top-0 flex !h-screen !max-h-none !w-screen !max-w-none !translate-x-0 !translate-y-0 flex-col gap-0 overflow-hidden !rounded-none !border-0 !p-0 bg-muted'
					)}
				>
					<DialogHeader className="shrink-0 space-y-0 border-b border-border bg-white px-0 py-0">
						<DialogTitle className="sr-only">
							{editingId === '__new__'
								? __('Add connection', 'doublescale')
								: __('Edit connection', 'doublescale')}
						</DialogTitle>
						<div className="flex items-center gap-2.5 px-6 py-3 pr-14">
							<p className="text-sm font-medium leading-7 text-foreground">
								{__('Connections', 'doublescale')}
							</p>
							<AccordingRightIcon />
							<span className="leading-7 text-muted-foreground">
								{editingId === '__new__'
									? __('Add connection', 'doublescale')
									: __('Edit connection', 'doublescale')}
							</span>
						</div>
					</DialogHeader>

					<div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-muted">
						<div
							className={cn(
								'mx-6 mb-6 mt-6 flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl',

								'shadow-[0px_8px_30px_0px_rgba(59,130,246,0.12)]'
							)}
						>
							<div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-white">
								{/* Mobile step header */}
								<div className="shrink-0 sm:hidden">
									<div className="flex items-center gap-3 px-4 pb-3 pt-4">
										<div
											className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brandPrimary text-sm font-semibold text-white"
											aria-current="step"
										>
											{wizardStep}
										</div>
										<div className="min-w-0">
											<p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
												{sprintf(
													__('Step %1$d/%2$d', 'doublescale'),
													wizardStep,
													WIZARD_LAST_STEP
												)}
											</p>
											<p className="truncate text-base font-semibold text-foreground">
												{currentStepMeta?.label ?? ''}
											</p>
										</div>
									</div>
									<div
										className="h-1 w-full bg-border"
										role="progressbar"
										aria-valuenow={wizardStep}
										aria-valuemin={1}
										aria-valuemax={WIZARD_LAST_STEP}
										aria-label={sprintf(
											__('Step %1$d of %2$d', 'doublescale'),
											wizardStep,
											WIZARD_LAST_STEP
										)}
									>
										<div
											className="h-full bg-brandPrimary transition-all duration-300"
											style={{ width: `${mobileStepProgress}%` }}
										/>
									</div>
								</div>

								<div className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden p-4 sm:flex-row sm:items-stretch sm:gap-5 sm:p-6">
								{/* Left Stepper */}
								<aside className="hidden w-full shrink-0 flex-col self-start rounded-2xl border border-border bg-muted p-6 sm:flex sm:w-[240px] sm:max-w-[280px]">
									<div className="flex flex-col gap-0">
										{STEPS.map((item, idx, arr) => {
											const isActive = wizardStep === item.step;
											const isDone = wizardStep > item.step;
											const showConnector = idx < arr.length - 1;
											return (
												<div key={item.step} className="flex gap-3">
													<div className="flex flex-col items-center">
														<div
															className={cn(
																'flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 text-sm font-semibold transition-colors',
																isDone &&
																	'border-transparent bg-[#16A34A] text-white',
																isActive &&
																	!isDone &&
																	'border-brandPrimary bg-brandPrimary text-white',
																!isActive &&
																	!isDone &&
																	'border-border bg-background text-foreground'
															)}
															aria-current={isActive ? 'step' : undefined}
														>
															{isDone ? (
																<CheckCheck
																	className="h-4 w-4"
																	strokeWidth={2.5}
																	aria-hidden
																/>
															) : (
																item.num
															)}
														</div>
														{showConnector ? (
															<div
																className={cn(
																	'my-1 h-7 w-0.5 shrink-0 rounded-full',
																	isDone
																		? 'bg-[#16A34A]'
																		: isActive
																			? 'bg-brandPrimary'
																			: 'bg-border'
																)}
																aria-hidden
															/>
														) : null}
													</div>
													<div
														className={cn(
															'min-w-0 pt-1.5 text-sm font-semibold leading-snug',
															idx < arr.length - 1 && 'pb-6',
															isDone && 'text-[#16A34A]',
															isActive && !isDone && 'text-brandPrimary',
															!isDone && !isActive && 'text-muted-foreground'
														)}
													>
														{item.label}
													</div>
												</div>
											);
										})}
									</div>
								</aside>

								{/* Right Content Panel */}
								<div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-2xl border border-border bg-muted shadow-sm sm:min-h-0 sm:self-stretch">
									<div className="min-h-0 flex-1 overflow-y-auto px-4 py-6 sm:px-6">
										<div className="space-y-5">
											{/* Step 1 – Connection name */}
											{wizardStep === 1 && (
												<div className="space-y-6">
													<section className="rounded-xl border border-border bg-white p-6">
														<h3 className="text-base font-semibold text-foreground">
															{__(
																"Let's start with the connection name",
																'doublescale'
															)}
														</h3>
														<p className="mt-3 text-sm text-muted-foreground">
															{__(
																'The connection name is used to identify the connection in the connection list.',
																'doublescale'
															)}
														</p>
														<div className="mt-5 space-y-2">
															<Label htmlFor="smtp-conn-name">
																{__('Connection name', 'doublescale')}
																<span className="text-destructive"> *</span>
															</Label>
															<Input
																id="smtp-conn-name"
																value={form.connection_name || ''}
																onChange={(e) =>
																	setForm((f) => ({
																		...f,
																		connection_name: e.target.value,
																	}))
																}
																placeholder={__('Connection name', 'doublescale')}
																autoComplete="off"
															/>
														</div>
													</section>
												</div>
											)}

											{/* Step 2 – Mail provider */}
											{wizardStep === 2 && (
												<div className="space-y-6">
													<section className="rounded-xl border border-border bg-white p-6">
														<div>
															<h3 className="text-base font-semibold text-foreground">
																{__('Select your mail provider', 'doublescale')}
															</h3>
															<p className="mt-3 text-sm text-muted-foreground">
																{__(
																	'Pick how this connection sends mail. If you do not see your provider, choose Other SMTP.',
																	'doublescale'
																)}
															</p>
														</div>
														<div className="mt-5 pr-1">
															<div className="grid grid-cols-2 gap-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
																{SMTP_MAILER_OPTIONS.map((o) => {
																	const selected = form.mailer === o.value;
																	const logoSrc = getSmtpMailerLogoUrl(o.value);
																	return (
																		<button
																			key={o.value}
																			type="button"
																			title={o.label}
																			onClick={() => applyMailerSelection(o.value)}
																			className={cn(
																				'flex flex-col items-center gap-2 rounded-xl border border-border bg-muted p-4 text-center transition-shadow hover:border-primary/50 hover:shadow-sm',
																				selected &&
																					'border-brandPrimary bg-[rgba(101,73,202,0.06)] ring-1 ring-brandPrimary shadow-sm'
																			)}
																		>
																			<div className="flex h-14 w-full items-center justify-center px-1">
																				{logoSrc ? (
																					<img
																						src={logoSrc}
																						alt=""
																						className="max-h-14 w-auto max-w-[120px] object-contain"
																						loading="lazy"
																						decoding="async"
																					/>
																				) : (
																					<span
																						className={cn(
																							'flex p-4 items-center justify-center rounded-lg text-[11px] font-bold',
																							selected
																								? 'bg-brandPrimary text-white'
																								: 'bg-muted text-muted-foreground'
																						)}
																						aria-hidden
																					>
																						{mailerInitialsFromLabel(o.label)}
																					</span>
																				)}
																			</div>
																		</button>
																	);
																})}
															</div>
														</div>
													</section>
												</div>
											)}

											{/* Step 3 – Provider account */}
											{wizardStep === 3 && (
												<div className="flex flex-col gap-6 bg-white border border-border rounded-xl p-6">
													<div>
														<h3 className="text-lg font-semibold tracking-tight">
															{__('Configure provider account', 'doublescale')}
														</h3>
														<p className="mt-3 text-sm text-muted-foreground leading-relaxed">
															{step3MailerMeta.accountSetupDescription}
														</p>
														<div className="mt-3 flex flex-wrap items-center gap-2">
															<Badge
																variant="secondary"
																className="shrink-0 font-normal"
															>
																{getSmtpMailerOptionLabel(form.mailer || 'smtp')}
															</Badge>
															<Badge
																variant="outline"
																className="shrink-0 font-normal capitalize"
															>
																{
																	SMTP_MAILER_CATEGORY_LABEL[
																		step3MailerMeta.category
																	]
																}
															</Badge>
															{step3MailerMeta.docUrl ? (
																<a
																	href={step3MailerMeta.docUrl}
																	target="_blank"
																	rel="noopener noreferrer"
																	className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
																>
																	<ExternalLink
																		className="h-3.5 w-3.5 shrink-0"
																		aria-hidden
																	/>
																	{step3MailerMeta.docLabel ||
																		__('View documentation', 'doublescale')}
																</a>
															) : null}
														</div>
													</div>

													<div className="rounded-lg border border-border bg-muted px-3 py-2 text-sm">
														<span className="text-muted-foreground">
															{__('Connection', 'doublescale')}
														</span>{' '}
														<span className="font-medium">
															{String(form.connection_name || '').trim() ||
																__('(unnamed)', 'doublescale')}
														</span>
													</div>

													{form.mailer === 'phpmailer' ? (
														<div className="space-y-2">
															<Label htmlFor="smtp-acc-name">
																{__('Account name', 'doublescale')}
															</Label>
															<Input
																id="smtp-acc-name"
																className={SMTP_CONNECTION_INPUT_CLASS}
																value={form.account_name || ''}
																onChange={(e) =>
																	setForm((f) => ({
																		...f,
																		account_name: e.target.value,
																	}))
																}
																placeholder={__(
																	'Friendly name stored with the provider (defaults to From name)',
																	'doublescale'
																)}
															/>
															<p className="text-xs text-muted-foreground">
																{step3MailerMeta.accountNameHint ||
																	__(
																		'This is used to identify the account in the connection list.',
																		'doublescale'
																	)}
															</p>
														</div>
													) : (
														<div className="overflow-hidden rounded-lg border border-border bg-muted p-4">
															<div className="grid gap-4 lg:grid-cols-2 lg:gap-5 lg:items-stretch">
																{/* Left: Existing account list */}
																<div className="flex min-h-0 flex-col gap-3">
																	<p className="m-0 text-sm font-semibold text-foreground">
																		{editingId !== '__new__'
																			? __('Linked account', 'doublescale')
																			: __('All Accounts', 'doublescale')}
																	</p>
																	<div className="flex min-h-0 flex-1 flex-col rounded-lg border border-border bg-white p-4">
																		{mailerAccountsLoading ? (
																			<p className="text-xs text-muted-foreground">
																				{__(
																					'Loading accounts…',
																					'doublescale'
																				)}
																			</p>
																		) : null}
																		{!mailerAccountsLoading &&
																		staleLinkedVaultAccount ? (
																			<div className="flex min-h-[120px] flex-1 flex-col items-center justify-center gap-2 px-2 py-3 text-center">
																				<NoSearchIcon />
																				<p className="max-w-[410px] text-sm leading-relaxed text-muted-foreground">
																					{__(
																						'The linked stored account was not found. Try authorizing again with your provider.',
																						'doublescale'
																					)}
																				</p>
																			</div>
																		) : null}
																		{!mailerAccountsLoading &&
																		!staleLinkedVaultAccount &&
																		providerAccountEntriesForList.length === 0 ? (
																			<div className="flex min-h-[120px] flex-1 flex-col items-center justify-center gap-2 px-2 py-3 text-center">
																				<NoSearchIcon />
																				<p className="max-w-[410px] text-sm leading-relaxed text-muted-foreground">
																					{sprintf(
																						__(
																							"Looks like you don't have any %s accounts configured. Please add an account to continue.",
																							'doublescale'
																						),
																						getSmtpMailerOptionLabel(
																							form.mailer || 'smtp'
																						)
																					)}
																				</p>
																			</div>
																		) : null}
																		{!mailerAccountsLoading &&
																		!staleLinkedVaultAccount &&
																		providerAccountEntriesForList.length > 0 ? (
																			<div className="flex min-h-0 flex-1 flex-col">
																				<div className="min-h-0 flex-1 space-y-4 overflow-y-auto pr-0.5">
																					{providerAccountEntriesForList.map(
																						([accId, meta]) => {
																							const rowLabel =
																								mailerAccountSelectLabel(
																									accId,
																									meta
																								);
																							const busy =
																								deletingProviderAccount &&
																								providerAccountToDelete?.accountId ===
																									accId;
																							const selected =
																								String(
																									form.account_id || ''
																								).trim() === accId;
																							return (
																								<div
																									key={accId}
																									role="radio"
																									tabIndex={0}
																									onClick={() =>
																										selectLinkedAccountOnly(
																											accId
																										)
																									}
																									onKeyDown={(e) => {
																										if (
																											e.key !== 'Enter' &&
																											e.key !== ' '
																										) {
																											return;
																										}
																										e.preventDefault();
																										selectLinkedAccountOnly(
																											accId
																										);
																									}}
																									className={cn(
																										'flex cursor-pointer items-center gap-2 rounded-lg border border-border bg-muted p-4 transition-colors outline-none hover:bg-muted/80 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1'
																									)}
																									aria-checked={selected}
																									aria-label={sprintf(
																										__(
																											'Select stored account %s',
																											'doublescale'
																										),
																										rowLabel
																									)}
																								>
																									<span
																										aria-hidden
																										className={cn(
																											'flex h-4 w-4 shrink-0 items-center justify-center rounded-full border',
																											selected
																												? 'border-brandPrimary'
																												: 'border-[#B7BBC5]'
																										)}
																									>
																										<span
																											className={cn(
																												'h-2 w-2 rounded-full transition-colors',
																												selected
																													? 'bg-brandPrimary'
																													: 'bg-transparent'
																											)}
																										/>
																									</span>
																									<div className="min-w-0 flex-1 py-0 text-left text-sm font-medium leading-tight text-foreground sm:text-[13px]">
																										<span className="block truncate">
																											{rowLabel}
																										</span>
																									</div>
																									<div className="flex shrink-0 items-center gap-0">
																										<Button
																											type="button"
																											variant="ghost"
																											size="icon"
																											className="text-[#2563EB] hover:bg-[#EFF6FF] hover:text-[#1D4ED8]"
																											disabled={
																												saving ||
																												deletingProviderAccount ||
																												mailerAccountsLoading
																											}
																											aria-label={sprintf(
																												__(
																													'Edit stored account %s',
																													'doublescale'
																												),
																												rowLabel
																											)}
																											onClick={(e) => {
																												e.stopPropagation();
																												const slug =
																													form.mailer || 'smtp';
																												accountEditWizardSnapshotRef.current =
																													shallowSnapshotWizardForm(
																														form
																													);
																												selectVaultAccountRow(
																													accId,
																													meta,
																													slug,
																													{
																														allowToggleOff: false,
																													}
																												);
																												setRightAccountPanelMode(
																													'add'
																												);
																												setAccountEditModalOpen(
																													true
																												);
																											}}
																										>
																											<EditIcon
																												width={24}
																												height={24}
																											/>
																										</Button>
																										<Button
																											type="button"
																											variant="ghost"
																											size="icon"
																											className="shrink-0 rounded-full text-destructive hover:bg-destructive/[0.12] hover:text-destructive"
																											disabled={
																												saving ||
																												deletingProviderAccount ||
																												mailerAccountsLoading
																											}
																											aria-label={sprintf(
																												__(
																													'Delete stored account %s',
																													'doublescale'
																												),
																												rowLabel
																											)}
																											onClick={(e) => {
																												e.stopPropagation();
																												setProviderAccountToDelete(
																													{
																														mailerSlug:
																															form.mailer ||
																															'smtp',
																														accountId: accId,
																														label: rowLabel,
																													}
																												);
																											}}
																										>
																											{busy ? (
																												<span
																													className="text-xs"
																													aria-hidden
																												>
																													…
																												</span>
																											) : (
																												<TrashIcon
																													width={24}
																													height={24}
																												/>
																											)}
																										</Button>
																									</div>
																								</div>
																							);
																						}
																					)}
																				</div>
																			</div>
																		) : null}

																		{isSmtpOAuthMailer(form.mailer) &&
																		oauthAuthorizeHref ? (
																			<div className="pt-1">
																				<Button
																					type="button"
																					variant="secondary"
																					size="sm"
																					className="w-full sm:w-auto"
																					onClick={() =>
																						void handleOpenOAuthAuthorize()
																					}
																					disabled={saving}
																				>
																					{__(
																						'Save OAuth app & authorize (opens wp-admin)',
																						'doublescale'
																					)}
																				</Button>
																			</div>
																		) : null}
																	</div>
																</div>

																{/* Right: New account form */}
																<div className="flex min-h-0 flex-col gap-3 lg:min-h-[260px]">
																	<p className="text-sm font-semibold text-foreground">
																		{editingId === '__new__'
																			? __('Adding new account', 'doublescale')
																			: rightAccountPanelMode === 'edit'
																				? __('Edit account', 'doublescale')
																				: __('Adding new account', 'doublescale')}
																	</p>
																	<div
																		className="flex min-h-[180px] flex-1 flex-col rounded-xl border border-border bg-white p-4 lg:min-h-[240px]"
																		data-linked-account-selected={
																			reuseStoredProviderAccount ? 'yes' : 'no'
																		}
																	>
																		<div className="min-h-0 flex-1 space-y-4 overflow-y-auto">
																			<div className="space-y-2">
																				<Label htmlFor="smtp-acc-name">
																					{__('Account name', 'doublescale')}
																					<span className="text-destructive">
																						{' '}
																						*
																					</span>
																				</Label>
																				<Input
																					id="smtp-acc-name"
																					className={SMTP_CONNECTION_INPUT_CLASS}
																					value={form.account_name || ''}
																					onChange={(e) =>
																						setForm((f) => ({
																							...f,
																							account_name: e.target.value,
																						}))
																					}
																					placeholder={__(
																						'Account name',
																						'doublescale'
																					)}
																					autoComplete="off"
																				/>
																				<p className="text-xs text-muted-foreground">
																					{step3MailerMeta.accountNameHint ||
																						__(
																							'This is used to identify the account in the connection list.',
																							'doublescale'
																						)}
																				</p>
																			</div>
																			<OAuthCredentialFields
																				mailer={form.mailer || 'smtp'}
																				form={form}
																				setForm={setForm}
																			/>
																			<ApiCredentialFields
																				mailer={form.mailer || 'smtp'}
																				form={form}
																				setForm={setForm}
																			/>
																		</div>
																		<div className="mt-4 flex justify-end">
																			<Button
																				type="button"
																				variant="outline"
																				size="sm"
																				className="border-brandPrimary text-sm font-medium leading-6 bg-white text-brandPrimary hover:bg-brandPrimary/10"
																				disabled={saving}
																				onClick={() =>
																					void saveProviderAccountOnly()
																				}
																			>
																				{editingId === '__new__' ? (
																					<>
																						<PlusIcon width={24} height={24} />{' '}
																						{__('Add', 'doublescale')}
																					</>
																				) : rightAccountPanelMode === 'edit' ? (
																					__('Save provider account', 'doublescale')
																				) : (
																					<>
																						<PlusIcon width={24} height={24} />{' '}
																						{__(
																							'Save provider account',
																							'doublescale'
																						)}
																					</>
																				)}
																			</Button>
																		</div>
																	</div>
																</div>
															</div>
														</div>
													)}

													{form.mailer === 'aws' &&
													String(form.account_id || '').trim() ? (
														<AwsIdentitiesPanel
															accountId={String(form.account_id).trim()}
														/>
													) : null}

													{/* SMTP relay fields */}
													{isSmtpRelay && (
														<>
															<div className="space-y-2">
																<Label htmlFor="smtp-host">
																	{__('SMTP host', 'doublescale')}
																</Label>
																<Input
																	id="smtp-host"
																	value={(form.host as string) || ''}
																	onChange={(e) =>
																		setForm((f) => ({
																			...f,
																			host: e.target.value,
																		}))
																	}
																/>
															</div>
															<div className="space-y-2">
																<Label htmlFor="smtp-port">
																	{__('SMTP port', 'doublescale')}
																</Label>
																<Input
																	id="smtp-port"
																	value={String(form.port ?? '')}
																	onChange={(e) =>
																		setForm((f) => ({
																			...f,
																			port: e.target.value,
																		}))
																	}
																/>
															</div>
															<div className="space-y-2">
																<Label>{__('Encryption', 'doublescale')}</Label>
																<Select
																	value={(form.encryption as string) || 'tls'}
																	onValueChange={(v) =>
																		setForm((f) => ({ ...f, encryption: v }))
																	}
																>
																	<SelectTrigger>
																		<SelectValue />
																	</SelectTrigger>
																	<SelectContent>
																		<SelectItem value="none">None</SelectItem>
																		<SelectItem value="ssl">SSL</SelectItem>
																		<SelectItem value="tls">TLS</SelectItem>
																	</SelectContent>
																</Select>
															</div>
															<div className="flex items-center justify-between gap-4">
																<Label htmlFor="smtp-auth">
																	{__('Authentication', 'doublescale')}
																</Label>
																<Switch
																	id="smtp-auth"
																	checked={Boolean(form.auth)}
																	onCheckedChange={(v) =>
																		setForm((f) => ({ ...f, auth: v }))
																	}
																/>
															</div>
															<div className="space-y-2">
																<Label htmlFor="smtp-user">
																	{__('SMTP username', 'doublescale')}
																</Label>
																<Input
																	id="smtp-user"
																	value={(form.user as string) || ''}
																	onChange={(e) =>
																		setForm((f) => ({
																			...f,
																			user: e.target.value,
																		}))
																	}
																/>
															</div>
															<div className="space-y-2">
																<Label htmlFor="smtp-pass">
																	{__('SMTP password', 'doublescale')}
																</Label>
																<Input
																	id="smtp-pass"
																	type="password"
																	autoComplete="new-password"
																	value={(form.pass as string) || ''}
																	onChange={(e) =>
																		setForm((f) => ({
																			...f,
																			pass: e.target.value,
																		}))
																	}
																/>
															</div>
														</>
													)}
												</div>
											)}

											{/* Step 4 – Sender identity */}
											{wizardStep === 4 && (
												<div className="flex flex-col gap-6 bg-white border border-border rounded-xl p-6">
													<div>
														<h3 className="text-lg font-semibold tracking-tight">
															{__('Sender identity', 'doublescale')}
														</h3>
														<p className="mt-3 text-sm text-muted-foreground leading-relaxed">
															{__(
																'Set the default From address for this connection, then save. You can store provider credentials on the previous step without saving the connection yet.',
																'doublescale'
															)}
														</p>
													</div>
													<div className="rounded-lg border border-border bg-muted px-3 py-2 text-sm">
														<span className="text-muted-foreground">
															{__('Connection', 'doublescale')}
														</span>{' '}
														<span className="font-medium">
															{String(form.connection_name || '').trim() ||
																__('(unnamed)', 'doublescale')}
														</span>
														{' · '}
														<span className="font-medium">
															{getSmtpMailerOptionLabel(form.mailer || 'smtp')}
														</span>
													</div>
													<div className="space-y-2">
														<Label htmlFor="smtp-from-email">
															{__('From email', 'doublescale')}
														</Label>
														{showWizardFromEmailSelect ? (
															<>
																<Select
																	value={resolveFromEmailForSelect(
																		form.from_email,
																		wizardFromEmailOptions
																	)}
																	onValueChange={(v) =>
																		setForm((f) => ({
																			...f,
																			from_email: v,
																		}))
																	}
																	disabled={wizardFromEmailsLoading}
																>
																	<SelectTrigger
																		id="smtp-from-email"
																		className={
																			SMTP_CONNECTION_SELECT_TRIGGER_CLASS
																		}
																	>
																		<SelectValue
																			placeholder={__(
																				'Select…',
																				'doublescale'
																			)}
																		/>
																	</SelectTrigger>
																	<SelectContent>
																		{wizardFromEmailOptions.map((opt, idx) => (
																			<SelectItem
																				key={`${opt.value}-${idx}`}
																				value={opt.value}
																			>
																				{opt.label || opt.value}
																			</SelectItem>
																		))}
																	</SelectContent>
																</Select>
																{wizardFromEmailsLoading ? (
																	<p className="text-xs text-muted-foreground">
																		{__(
																			'Loading sender addresses from the provider…',
																			'doublescale'
																		)}
																	</p>
																) : (
																	<p className="text-xs text-muted-foreground">
																		{__(
																			'If left blank, the default WordPress from email will be used.',
																			'doublescale'
																		)}
																	</p>
																)}
															</>
														) : (
															<>
																<Input
																	id="smtp-from-email"
																	className={SMTP_CONNECTION_INPUT_CLASS}
																	type="email"
																	value={form.from_email || ''}
																	onChange={(e) =>
																		setForm((f) => ({
																			...f,
																			from_email: e.target.value,
																		}))
																	}
																/>
																{wizardFromEmailsFetchFailed &&
																mailerUsesFetchedFromEmails(
																	form.mailer || ''
																) &&
																String(form.account_id || '').trim() !== '' ? (
																	<p className="text-xs text-muted-foreground">
																		{__(
																			'Could not load sender addresses from the provider. Enter the From email manually.',
																			'doublescale'
																		)}
																	</p>
																) : (
																	<p className="text-xs text-muted-foreground">
																		{__(
																			'If left blank, the default WordPress from email will be used.',
																			'doublescale'
																		)}
																	</p>
																)}
															</>
														)}
													</div>
													<div className="space-y-2">
														<Label htmlFor="smtp-from-name">
															{__('From name', 'doublescale')}
														</Label>
														<Input
															id="smtp-from-name"
															className={SMTP_CONNECTION_INPUT_CLASS}
															value={form.from_name || ''}
															onChange={(e) =>
																setForm((f) => ({
																	...f,
																	from_name: e.target.value,
																}))
															}
														/>
													</div>
													<div className="flex items-center justify-between gap-4">
														<Label htmlFor="smtp-force-email">
															{__('Force from email', 'doublescale')}
														</Label>
														<Switch
															id="smtp-force-email"
															checked={Boolean(form.force_from_email)}
															onCheckedChange={(v) =>
																setForm((f) => ({
																	...f,
																	force_from_email: v,
																}))
															}
														/>
													</div>
													<div className="flex items-center justify-between gap-4">
														<Label htmlFor="smtp-force-name">
															{__('Force from name', 'doublescale')}
														</Label>
														<Switch
															id="smtp-force-name"
															checked={Boolean(form.force_from_name)}
															onCheckedChange={(v) =>
																setForm((f) => ({
																	...f,
																	force_from_name: v,
																}))
															}
														/>
													</div>
												</div>
											)}
										</div>
									</div>
								</div>
								</div>
							</div>

							<DialogFooter className="mt-0 shrink-0 flex-row items-center justify-between gap-3 bg-white px-4 py-3 pt-4 sm:justify-between sm:space-x-0 sm:px-6">
								<Button
									type="button"
									variant="outline"
									className="shrink-0 bg-background border-border"
									onClick={() => onOpenChange(false)}
								>
									{__('Cancel', 'doublescale')}
								</Button>
								<div className="flex shrink-0 flex-wrap items-center justify-end gap-3 sm:gap-6">
									{wizardStep > 1 && (
										<Button
											type="button"
											variant="outline"
											className="border-brandPrimary text-brandPrimary"
											onClick={goWizardPrev}
										>
											{__('Back', 'doublescale')}
										</Button>
									)}
									{wizardStep < WIZARD_LAST_STEP ? (
										<Button
											onClick={goWizardNext}
											className="bg-brandPrimary hover:bg-brandPrimary focus:hover:bg-brandPrimary"
										>
											{__('Next', 'doublescale')}
										</Button>
									) : (
										<Button
											disabled={saving}
											className="bg-brandPrimary hover:bg-brandPrimary focus:hover:bg-brandPrimary"
											onClick={() => void saveConnection()}
										>
											{saving
												? __('Saving…', 'doublescale')
												: __('Save connection', 'doublescale')}
										</Button>
									)}
								</div>
							</DialogFooter>
						</div>
					</div>
				</DialogContent>
			</Dialog>

			{/* ------------------------------------------------------------------ */}
			{/* Save Feedback Dialog                                                */}
			{/* ------------------------------------------------------------------ */}
			<Dialog
				open={!!connectionSaveFeedback}
				onOpenChange={(open) => {
					if (!open) {
						dismissConnectionSaveFeedback();
					}
				}}
			>
				<DialogContent className="'!flex !flex-col mx-1 w-[calc(100%-2rem)] max-w-xl max-h-[calc(100dvh-2rem)] overflow-hidden  rounded-xl p-4 sm:mx-auto sm:w-full sm:p-8 !translate-x-[-50%] !translate-y-[-50%]' gap-3">
					<DialogHeader>
						<DialogTitle
							className={
								connectionSaveFeedback?.variant === 'error'
									? 'text-destructive'
									: ''
							}
						>
							{connectionSaveFeedback?.title}
						</DialogTitle>
					</DialogHeader>
					<div
						className={cn(
							'min-h-0 flex-1 overflow-y-auto rounded-md border bg-muted/40 p-3 text-sm',
							connectionSaveFeedback?.variant === 'error' &&
								'border-destructive/40 bg-destructive/5'
						)}
					>
						<ul className="space-y-3 list-none m-0 p-0">
							{(connectionSaveFeedback?.lines || []).map((line, idx) => (
								<li key={idx}>
									<pre className="whitespace-pre-wrap break-words font-sans text-xs leading-relaxed m-0">
										{line}
									</pre>
								</li>
							))}
						</ul>
					</div>
					<DialogFooter className='flex flex-row justify-end mt-2'>
						<Button
							type="button"
							variant='default'
							onClick={() => dismissConnectionSaveFeedback()}
						>
							{connectionSaveFeedback?.variant === 'success'
								? __('Close', 'doublescale')
								: __('OK', 'doublescale')}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* ------------------------------------------------------------------ */}
			{/* Edit Account Modal                                                  */}
			{/* ------------------------------------------------------------------ */}
			<Dialog
				open={accountEditModalOpen}
				onOpenChange={(open) => {
					setAccountEditModalOpen(open);
					if (!open) {
						restoreWizardAfterClosingEditAccountModal();
					}
				}}
			>
				<DialogContent className="max-w-xl">
					<DialogHeader>
						<DialogTitle className="text-left text-xl font-semibold text-foreground">
							{__('Edit Account', 'doublescale')}
						</DialogTitle>
					</DialogHeader>
					<div className="space-y-4">
						<div className="space-y-2">
							<Label htmlFor="smtp-edit-account-name">
								{__('Account Name', 'doublescale')}
								<span className="text-destructive"> *</span>
							</Label>
							<Input
								id="smtp-edit-account-name"
								className={SMTP_CONNECTION_INPUT_CLASS}
								value={form.account_name || ''}
								onChange={(e) =>
									setForm((f) => ({
										...f,
										account_name: e.target.value,
									}))
								}
								placeholder={__('Account Name', 'doublescale')}
								autoComplete="off"
							/>
						</div>
						<OAuthCredentialFields
							mailer={form.mailer || 'smtp'}
							form={form}
							setForm={setForm}
						/>
						<ApiCredentialFields
							mailer={form.mailer || 'smtp'}
							form={form}
							setForm={setForm}
						/>
					</div>
					<DialogFooter className="gap-3 sm:justify-end">
						<Button
							type="button"
							variant="outline"
							className="border-brandPrimary text-brandPrimary hover:bg-brandPrimary/10"
							onClick={() => setAccountEditModalOpen(false)}
						>
							{__('Cancel', 'doublescale')}
						</Button>
						<Button
							type="button"
							className="bg-brandPrimary text-white hover:bg-brandPrimary/90"
							disabled={saving}
							onClick={async () => {
								await saveProviderAccountOnly();
								accountEditWizardSnapshotRef.current = null;
								setAccountEditModalOpen(false);
							}}
						>
							{__('Edit Account', 'doublescale')}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</>
	);
}
