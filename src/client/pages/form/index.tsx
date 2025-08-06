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
import { useNavigate, useParams, getToLink } from '@quillcrm/navigation';

/**
 * Internal dependencies
 */
import './style.scss';
import { Provider } from './state/context';
import reducer, { State } from './state/reducer';
import actions from './state/actions';
import { Form as FormType, NoticeMessage } from '@quillcrm/client';
import InitialStep from './steps/initial';
import SettingsStep from './steps/settings';
import {
	CreateFormsIcon,
	PanelLayout,
	PanelSettings,
	PlayIcon,
	NoticeBanner,
} from '@quillcrm/components';
import { Button } from '@quillcrm/components/ui/button';

interface FormProps {
	isNewForm?: boolean;
	onClose?: () => void;
	onSuccess?: (message: string) => void; // Callback to notify parent of success
}

const Form: React.FC<FormProps> = ({
	isNewForm = false,
	onClose,
	onSuccess,
}) => {
	const { id } = useParams<{ id: string }>();
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
	const navigate = useNavigate();
	const isEditMode = !isNewForm;

	// Notice state
	const [notice, setNotice] = useState<NoticeMessage | null>(null);

	// Helper function to show notice
	const showNotice = (type: 'success' | 'error', message: string) => {
		setNotice({ type, message });
	};

	// Helper function to close notice
	const closeNotice = () => {
		setNotice(null);
	};

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
				path: `/qc/v1/forms/${id}`,
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
					path: '/qc/v1/forms',
					method: 'POST',
					data: newForm,
				})) as FormType;
			} else {
				// Update existing form
				response = (await apiFetch({
					path: `/qc/v1/forms/${newForm.id}`,
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
			if (!form?.name || !form?.form_type) {
				showNotice(
					'error',
					__('Please fill required fields', 'quillcrm')
				);
				return;
			}
			try {
				await saveForm();
				setCurrentStep(1);
			} catch (error: any) {
				showNotice('error', error.message);
			}
		} else if (currentStep === 1) {
			try {
				const savedForm = await saveForm({ status: 'active' });

				// Show updated notice
				showNotice(
					'success',
					__('Form updated successfully', 'quillcrm')
				);

				// Close the form after activation
				if (onClose) {
					onClose();
				} else {
					navigate(getToLink('forms'));
				}

				if (onSuccess) {
					onSuccess(__('Form updated', 'quillcrm'));
				}
			} catch (error: any) {
				showNotice('error', error.message);
			}
		}
	};

	// Modify the handleBack function to handle cancellation properly
	const handleBack = () => {
		if (currentStep > 0) {
			setCurrentStep(currentStep - 1);
		} else {
			// For existing forms, navigate back to forms list
			if (!isNewForm) {
				navigate(getToLink('forms'));
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
					label: __('Create Forms', 'quillcrm'),
					href: 'forms',
				},
				{
					label: __('Form Information', 'quillcrm'),
				},
				{
					label: __('Form Settings', 'quillcrm'),
				},
			]
		: [
				{
					label: __('Edit Form', 'quillcrm'),
					href: 'forms',
				},
				{
					label: __('Form Information', 'quillcrm'),
				},
				{
					label: __('Form Settings', 'quillcrm'),
				},
			];

	const stepTitles = [
		__('Form Information', 'quillcrm'),
		__('Mappping Fields', 'quillcrm'),
	];

	return (
		<Provider
			value={{
				form: form as FormType,
				isLoading: loading,
				isSaving,
				setIsLoading: setLoading,
				setIsSaving: setIsSaving,
				saveForm,
				...$actions,
			}}
		>
			<PanelLayout
				items={breadcrumbItems}
				panelbtns={[
					<Button key="tutorial" variant="secondaryDeepBlue">
						<PlayIcon />
						{__('Watch Tutorial', 'quillcrm')}
					</Button>,
				]}
				totalSteps={2}
				currentStep={currentStep}
				onNext={handleNext}
				onBack={handleBack}
				onSaveDraft={handleSaveDraft}
				nextLabel={
					currentStep === 1
						? __('Activate', 'quillcrm')
						: isEditMode
							? __('Update Form', 'quillcrm')
							: __('Create Form', 'quillcrm')
				}
				backLabel={
					currentStep === 0 || isNewForm
						? __('Cancel', 'quillcrm')
						: __('Back', 'quillcrm')
				}
				showSaveDraft={true}
				isLoading={isSaving}
			>
				{notice && (
					<NoticeBanner notice={notice} closeNotice={closeNotice} />
				)}
				<div className="flex gap-6">
					<PanelSettings
						title={stepTitles[currentStep]}
						description={__(
							'Add The Following data below to continue creating new form.',
							'quillcrm'
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
