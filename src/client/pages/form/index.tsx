/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import apiFetch from '@wordpress/api-fetch';
import { useEffect, useState } from '@wordpress/element';

/**
 * External dependencies
 */
import { useReducer, useRef } from 'react';

/**
 * Internal dependencies
 */
import './style.scss';
import { Provider } from './state/context';
import reducer, { State } from './state/reducer';
import actions from './state/actions';
import { Form as FormType, NoticeMessage } from '@doublescale/client';
import InitialStep from './steps/initial';
import SettingsStep from './steps/settings';
import Overview from './overview';
import {
	CreateFormsIcon,
	PanelLayout,
	PlayIcon,
	NoticeBanner,
} from '@doublescale/components';
import { Button } from '@doublescale/components/ui/button';
import { getToLink, useNavigate, useParams } from '@doublescale/navigation';

interface FormProps {
	isNewForm?: boolean;
	onClose?: () => void;
	onSuccess?: (message: string) => void;
}

const Form: React.FC<FormProps> = ({
	isNewForm = false,
	onClose,
	onSuccess,
}) => {
	const id = useParams().id;
	const navigate = useNavigate();
	const [state, dispatch] = useReducer(reducer, {
		form: null,
	} as State);
	const stateRef = useRef<State>(state);
	stateRef.current = state;
	const $actions = actions(dispatch);
	const { setForm } = $actions;
	const { form } = state;
	const [loading, setLoading] = useState(!isNewForm);
	const [isSaving, setIsSaving] = useState(false);
	const isSavingRef = useRef(false);
	const [formFields, setFormFields] = useState<
		FormType['fields_settings']['fields'] | null
	>(null);
	const [formWasSaved, setFormWasSaved] = useState(false);
	// Notice state
	const [notice, setNotice] = useState<NoticeMessage | null>(null);
	const noticeBannerRef = useRef<HTMLDivElement>(null);
	// Helper function to show notice
	const showNotice = (type: 'success' | 'error', message: string) => {
		setNotice({ type, message });
	};

	// Helper function to close notice
	const closeNotice = () => {
		setNotice(null);
	};

	// Scroll to notice banner when notice appears
	useEffect(() => {
		if (notice && noticeBannerRef.current) {
			noticeBannerRef.current.scrollIntoView({
				behavior: 'smooth',
				block: 'nearest',
			});
		}
	}, [notice]);

	useEffect(() => {
		if (isNewForm) {
			// Initialize with empty form for new form creation
			setForm({
				id: 0, // Will be set by API after creation
				name: '',
				form_type: '',
				form_id: '',
				status: 'inactive',
				created_at: '',
				updated_at: '',
				data: {
					mapped_fields: {},
					lists: [],
					tags: [],
					update_existing_contact: false,
					update_blank_fields: false,
					mark_as_subscribed: false,
					enable_email_notification: false,
				},
				post_id: undefined,
			} as FormType);
			setLoading(false);
		} else if (id) {
			fetchForm();
		}
	}, [id, isNewForm]);

	const fetchForm = async () => {
		if (!id) return;

		setLoading(true);
		try {
			const response = (await apiFetch({
				path: `/doublescale/v1/forms/${id}`,
			})) as FormType;

			setForm(prepareForm(response));
		} catch (error: any) {
			showNotice('error', error.message);
		} finally {
			setLoading(false);
		}
	};

	const saveForm = async (data: Partial<FormType> = {}) => {
		const baseForm = stateRef.current.form as FormType | null;
		if (!baseForm) {
			return;
		}

		isSavingRef.current = true;
		setIsSaving(true);
		const newForm = { ...baseForm, ...data };

		if (newForm.post_id) {
			newForm.form_id = `${newForm.post_id}:${newForm.form_id}`;
		}

		try {
			let response: FormType;

			if (isNewForm && (!newForm.id || newForm.id === 0)) {
				response = (await apiFetch({
					path: '/doublescale/v1/forms',
					method: 'POST',
					data: newForm,
				})) as FormType;
			} else {
				response = (await apiFetch({
					path: `/doublescale/v1/forms/${newForm.id}`,
					method: 'POST',
					data: newForm,
				})) as FormType;
			}

			setForm(prepareForm(response));
			return response;
		} catch (error: any) {
			showNotice('error', error.message);
			throw error;
		} finally {
			setIsSaving(false);
			isSavingRef.current = false;
		}
	};

	const prepareForm = (form: FormType): FormType => {
		if (form.form_id?.includes(':')) {
			const [postId, formId] = form.form_id.split(':');
			form.post_id = parseInt(postId);
			form.form_id = formId;
		}

		// Ensure data object exists with proper structure
		if (!form.data) {
			form.data = {
				mapped_fields: {},
				lists: [],
				tags: [],
				update_existing_contact: false,
				update_blank_fields: false,
				mark_as_subscribed: false,
				enable_email_notification: false,
			};
		}

		return form;
	};

	const connectionIsComplete = (f: FormType | null) =>
		!!(
			f?.name?.trim() &&
			f.form_type &&
			f.form_id
		);

	// Persist connection (name + builder + form) shortly after edits so mapping can load.
	useEffect(() => {
		if (loading) {
			return;
		}
		const snap = stateRef.current.form as FormType | null;
		if (!snap || !connectionIsComplete(snap)) {
			return;
		}
		if (isSavingRef.current) {
			return;
		}

		const timer = window.setTimeout(async () => {
			if (isSavingRef.current) {
				return;
			}
			const latest = stateRef.current.form as FormType | null;
			if (!latest || !connectionIsComplete(latest)) {
				return;
			}
			try {
				await saveForm();
				setFormWasSaved(true);
			} catch {
				// saveForm surfaces notice
			}
		}, 900);

		return () => window.clearTimeout(timer);
	}, [form?.name, form?.form_type, form?.form_id, form?.post_id, loading]);

	const handleActivate = async () => {
		const snap = stateRef.current.form as FormType | null;
		if (!connectionIsComplete(snap)) {
			showNotice(
				'error',
				__('Please fill all required fields', 'doublescale')
			);
			return;
		}

		try {
			if (isNewForm && snap && (!snap.id || snap.id === 0)) {
				await saveForm();
				setFormWasSaved(true);
			}

			const mappedFields =
				(stateRef.current.form?.data as { mapped_fields?: Record<string, string> })
					?.mapped_fields || {};
			const requiredContactFields = ['email'];
			const allRequiredFieldsMapped = requiredContactFields.every(
				(key) => mappedFields[key] && mappedFields[key] !== ''
			);

			if (!allRequiredFieldsMapped) {
				showNotice(
					'error',
					__(
						'Please map all required contact fields (Email) before activating',
						'doublescale'
					)
				);
				return;
			}

			await saveForm({ status: 'active' });
			setFormWasSaved(true);

			const successMessage = isNewForm
				? __('Form created successfully', 'doublescale')
				: __('Form updated successfully', 'doublescale');

			showNotice('success', successMessage);

			if (onSuccess) {
				onSuccess(successMessage);
			}

			if (onClose) {
				onClose();
			} else {
				const successType = isNewForm ? 'created' : 'updated';
				const formsLink = getToLink('forms');
				const separator = formsLink.includes('?') ? '&' : '?';
				navigate(`${formsLink}${separator}success=${successType}`);
			}
		} catch (error: any) {
			showNotice('error', error.message);
		}
	};

	const handleBack = () => {
		if (formWasSaved) {
			if (onSuccess) {
				const onSuccessMessage = isNewForm
					? __('Form created successfully', 'doublescale')
					: __('Form updated successfully', 'doublescale');
				onSuccess(onSuccessMessage);
			}
		}

		if (!isNewForm) {
			if (formWasSaved) {
				const formsLink = getToLink('forms');
				const separator = formsLink.includes('?') ? '&' : '?';
				navigate(`${formsLink}${separator}success=updated`);
			} else {
				navigate(getToLink('forms'));
			}
		}
		if (isNewForm && onClose) {
			onClose();
		}
	};

	const handleSaveDraft = async () => {
		const snap = stateRef.current.form as FormType | null;
		if (!connectionIsComplete(snap)) {
			showNotice(
				'error',
				__('Please fill all required fields', 'doublescale')
			);
			return;
		}
		try {
			await saveForm({ status: 'inactive' });
			setFormWasSaved(true); // Mark that form was saved

			// Show appropriate notice based on whether it's a new form or edit
			const successMessage = isNewForm
				? __('Form created successfully', 'doublescale')
				: __('Form updated successfully', 'doublescale');

			showNotice('success', successMessage);

			// Call onSuccess first to refresh the forms list before closing
			if (onSuccess) {
				const onSuccessMessage = isNewForm
					? __('Form created successfully', 'doublescale')
					: __('Form updated successfully', 'doublescale');
				onSuccess(onSuccessMessage);
			}

			if (isNewForm && onClose) {
				onClose();
			} else {
				navigate(getToLink('forms'));
			}
		} catch (error: any) {
			showNotice('error', error.message);
		}
	};

	const breadcrumbItems = isNewForm
		? [
				{
					label: __('Forms', 'doublescale'),
					href: 'forms',
				},
				{
					label: __('New integration', 'doublescale'),
				},
			]
		: [
				{
					label: __('Forms', 'doublescale'),
					href: 'forms',
				},
				{
					label:
						form?.name?.trim() ||
						__('Edit integration', 'doublescale'),
				},
			];

	// // If tab is 'overview', show the overview page
	// if (tab === 'overview') {
	// 	// Don't render until form data is loaded
	// 	if (loading || !form) {
	// 		return (
	// 			<div className="flex justify-center items-center min-h-[400px]">
	// 				<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
	// 			</div>
	// 		);
	// 	}

	// 	return (
	// 		<Provider
	// 			value={{
	// 				form: form as FormType,
	// 				isLoading: loading,
	// 				isSaving,
	// 				formFields,
	// 				setIsLoading: setLoading,
	// 				setIsSaving: setIsSaving,
	// 				setFormFields,
	// 				saveForm,
	// 				...$actions,
	// 			}}
	// 		>
	// 			<Overview />
	// 		</Provider>
	// 	);
	// }

	// Otherwise show the step-based form creation/editing UI
	return (
		<Provider
			value={{
				form: form as FormType,
				isLoading: loading,
				isSaving,
				formFields,
				setIsLoading: setLoading,
				setIsSaving: setIsSaving,
				setFormFields,
				saveForm,
				...$actions,
			}}
		>
			<PanelLayout
				items={breadcrumbItems}
				type="form"
				showProgressBar={false}
				panelbtns={[
					<Button key="tutorial" variant="secondaryDeepBlue">
						<PlayIcon />
						{__('Watch Tutorial', 'doublescale')}
					</Button>,
				]}
				totalSteps={1}
				currentStep={0}
				onNext={handleActivate}
				onBack={handleBack}
				onSaveDraft={handleSaveDraft}
				nextLabel={__('Activate', 'doublescale')}
				backLabel={__('Cancel', 'doublescale')}
				showSaveDraft={true}
				isLoading={isSaving}
				handleNavigate={(href) => {
					// If navigating to forms, check if form was created/updated
					if (href === 'forms') {
						// If form was saved during this session, show success message and refresh
						if (formWasSaved && onSuccess) {
							const onSuccessMessage = isNewForm
								? __('Form created successfully', 'doublescale')
								: __('Form updated successfully', 'doublescale');
							onSuccess(onSuccessMessage);
						}
						// Close the form if it's a new form in modal, otherwise navigate
						if (isNewForm && onClose) {
							onClose();
						} else {
							// If form was saved during this session, add success parameter to URL
							if (formWasSaved) {
								const successType = isNewForm
									? 'created'
									: 'updated';
								const formsLink = getToLink(href);
								const separator = formsLink.includes('?')
									? '&'
									: '?';
								navigate(
									`${formsLink}${separator}success=${successType}`
								);
							} else {
								navigate(getToLink(href));
							}
						}
					} else {
						navigate(getToLink(href));
					}
				}}
			>
				{notice && (
					<NoticeBanner
						ref={noticeBannerRef}
						notice={notice}
						closeNotice={closeNotice}
					/>
				)}
				<div className="mx-auto w-full max-w-4xl space-y-8 pb-6">
					<div className="relative overflow-hidden rounded-2xl border border-border/40 bg-card px-6 py-8 shadow-lg shadow-primary/[0.04] ring-1 ring-border/30 sm:px-10 sm:py-9">
						<div
							className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_120%_80%_at_0%_-20%,rgba(59,130,246,0.08),transparent_50%),radial-gradient(ellipse_80%_60%_at_100%_0%,rgba(139,92,246,0.06),transparent_45%)]"
							aria-hidden
						/>
						<div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:gap-8">
							<div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-primary/15 bg-gradient-to-br from-primary/10 to-primary/[0.02] shadow-inner">
								<span className="text-primary [&>svg]:h-8 [&>svg]:w-8">
									<CreateFormsIcon />
								</span>
							</div>
							<div className="min-w-0 flex-1 space-y-2">
								<p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
									{__('Form sync', 'doublescale')}
								</p>
								<h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-[1.65rem]">
									{isNewForm
										? __('New form integration', 'doublescale')
										: __('Edit form integration', 'doublescale')}
								</h1>
								<p className="max-w-xl text-sm leading-relaxed text-muted-foreground">
									{__(
										'Link your WordPress form, map fields to contacts, then activate or save a draft. Your connection saves automatically so field lists stay in sync.',
										'doublescale'
									)}
								</p>
							</div>
						</div>
					</div>

					<div className="overflow-hidden rounded-2xl border border-border/50 bg-card shadow-md ring-1 ring-border/25">
						<div className="space-y-0">
							<div className="px-6 py-8 sm:px-9 sm:py-9">
								<InitialStep />
							</div>
							<div className="border-t border-border/50 bg-muted/[0.35] px-6 py-8 sm:px-9 sm:py-10">
								<p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
									{__('Mapping', 'doublescale')}
								</p>
								<h2 className="mt-1.5 text-lg font-semibold text-foreground">
									{__('Fields & contact options', 'doublescale')}
								</h2>
								<p className="mt-1 max-w-xl text-sm text-muted-foreground">
									{__(
										'Match each CRM field to a form question. Email is required before activation.',
										'doublescale'
									)}
								</p>
								<div className="mt-7">
									<SettingsStep />
								</div>
							</div>
						</div>
					</div>
				</div>
			</PanelLayout>
		</Provider>
	);
};

export default Form;
