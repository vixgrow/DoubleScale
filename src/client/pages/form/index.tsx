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
	PanelSettings,
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
	const tab = useParams().tab;
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
	const [currentStep, setCurrentStep] = useState(0);
	const [formFields, setFormFields] = useState<
		FormType['fields_settings']['fields'] | null
	>(null);
	const [formWasSaved, setFormWasSaved] = useState(false);
	const isEditMode = !isNewForm;

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
		setIsSaving(true);
		const newForm = { ...form, ...data };

		if (newForm.post_id) {
			newForm.form_id = `${newForm.post_id}:${newForm.form_id}`;
		}

		try {
			let response: FormType;

			if (isNewForm && (!newForm.id || newForm.id === 0)) {
				// Create new form
				response = (await apiFetch({
					path: '/doublescale/v1/forms',
					method: 'POST',
					data: newForm,
				})) as FormType;
			} else {
				// Update existing form
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
			};
		}

		return form;
	};

	// Modify the handleNext function in the Form component
	const handleNext = async () => {
		if (currentStep === 0) {
			if (!form?.name || !form?.form_type || !form?.form_id) {
				showNotice(
					'error',
					__('Please fill all required fields', 'doublescale')
				);
				return;
			}
			try {
				await saveForm();
				setFormWasSaved(true); // Mark that form was saved
				closeNotice(); // Clear any existing notices when moving to step 2
				setCurrentStep(1);
			} catch (error: any) {
				showNotice('error', error.message);
			}
		} else if (currentStep === 1) {
			// Validate that required contact fields are mapped
			const mappedFields = (form?.data as any)?.mapped_fields || {};

			// Required contact fields that must be mapped
			const requiredContactFields = ['email'];

			// Check if all required contact fields have valid mappings
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

			try {
				await saveForm({ status: 'active' });
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

				// Close the form after activation
				if (onClose) {
					onClose();
				} else {
					// In edit mode, navigate with success message in URL
					const successType = isNewForm ? 'created' : 'updated';
					const formsLink = getToLink('forms');
					const separator = formsLink.includes('?') ? '&' : '?';
					navigate(`${formsLink}${separator}success=${successType}`);
				}
			} catch (error: any) {
				showNotice('error', error.message);
			}
		}
	};

	// Modify the handleBack function to handle cancellation properly
	const handleBack = () => {
		if (currentStep > 0) {
			// Just go back to previous step
			setCurrentStep(currentStep - 1);
		} else {
			// When closing from step 0, only show success if form was actually saved
			if (formWasSaved) {
				// Form was saved during this session, show success message and refresh
				if (onSuccess) {
					const onSuccessMessage = isNewForm
						? __('Form created successfully', 'doublescale')
						: __('Form updated successfully', 'doublescale');
					onSuccess(onSuccessMessage);
				}
			}

			// For existing forms, navigate back to forms list
			if (!isNewForm) {
				// If form was saved during this session, add success parameter to URL
				if (formWasSaved) {
					const formsLink = getToLink('forms');
					const separator = formsLink.includes('?') ? '&' : '?';
					navigate(`${formsLink}${separator}success=updated`);
				} else {
					navigate(getToLink('forms'));
				}
			}
			// For new forms in modal, just close
			if (isNewForm && onClose) {
				onClose();
			}
		}
	};

	const handleSaveDraft = async () => {
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

	const stepTitles = [
		__('Form Information', 'doublescale'),
		__('Mappping Fields', 'doublescale'),
	];

	const breadcrumbItems = isNewForm
		? [
				{
					label: __('Create Forms', 'doublescale'),
					href: 'forms',
				},
				{
					label: stepTitles[currentStep],
				},
			]
		: [
				{
					label: __('Edit Form', 'doublescale'),
					href: 'forms',
				},
				{
					label: stepTitles[currentStep],
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
				panelbtns={[
					<Button key="tutorial" variant="secondaryDeepBlue">
						<PlayIcon />
						{__('Watch Tutorial', 'doublescale')}
					</Button>,
				]}
				totalSteps={2}
				currentStep={currentStep}
				onNext={handleNext}
				onBack={handleBack}
				onSaveDraft={handleSaveDraft}
				nextLabel={
					currentStep === 1
						? __('Activate', 'doublescale')
						: isEditMode
							? __('Update Form', 'doublescale')
							: __('Create Form', 'doublescale')
				}
				backLabel={
					currentStep === 0
						? __('Cancel', 'doublescale')
						: __('Back', 'doublescale')
				}
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
				<div className="flex gap-6">
					<PanelSettings
						title={stepTitles[currentStep]}
						description={__(
							'Add The Following data below to continue creating new form.',
							'doublescale'
						)}
						icon={<CreateFormsIcon />}
						iconVariant={'white'}
						className="w-full"
					>
						{currentStep === 0 && <InitialStep />}
						{currentStep === 1 && <SettingsStep />}
					</PanelSettings>
				</div>
			</PanelLayout>
		</Provider>
	);
};

export default Form;
