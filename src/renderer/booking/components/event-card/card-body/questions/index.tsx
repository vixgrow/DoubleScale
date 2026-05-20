import { __ } from '@wordpress/i18n';
import { AdvancedSettings, Fields, RendererAdvancedSettings } from '@/types/booking';
import './style.scss';
import LeftArrowIcon from '../../../../icons/left-arrow-icon';
import { Alert, Form, Spin } from 'antd';
import FormField from '../../../inputs';
import { useEffect, useState } from 'react';
import { useApi } from '@/hooks/booking';
import { css } from '@emotion/css';
import { applyFilters } from '@wordpress/hooks';

const defaultFields: Fields = {
	system: {
		name: {
			type: 'text',
			label: __('Name', 'doublescale'),
			required: true,
			order: 1,
			enabled: true,
		},
		email: {
			type: 'email',
			label: __('Email', 'doublescale'),
			required: true,
			order: 2,
			enabled: true,
		},
	},
	location: {},
	custom: {},
	other: {},
};

interface BookingFormProps {
	fields?: Fields;
	setStep: (step: number) => void;
	onSubmit: (values: any) => void;
	baseColor: string;
	darkColor: string;
	prefilledData?: { name?: string; email?: string };
	advancedSettings?: AdvancedSettings | RendererAdvancedSettings;
	submitButtonFallback?: string;
	loadingText?: string;
	isWaitingListSlot?: boolean;
}

const BookingForm: React.FC<BookingFormProps> = ({
	fields,
	setStep,
	onSubmit,
	baseColor,
	darkColor,
	prefilledData,
	advancedSettings,
	submitButtonFallback = 'Schedule Event',
	loadingText,
	isWaitingListSlot = false,
}) => {
	const [form] = Form.useForm();
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [submissionError, setSubmissionError] = useState<string | null>(null);
	const [countryCode, setCountryCode] = useState<string>('us');
	const { callApi } = useApi();

	const activeFields = fields && Object.keys(fields.system || {}).length > 0
		? fields
		: defaultFields;

	const defaultButtonText = __(
		advancedSettings?.submit_button_text || submitButtonFallback,
		'doublescale'
	);

	const submitButtonText = applyFilters(
		'doublescale_booking_renderer_submit_button_text',
		defaultButtonText,
		isWaitingListSlot
	) as string;

	const submittingText = loadingText || __('Submitting...', 'doublescale');

	const waitingListNotice = applyFilters(
		'doublescale_booking_renderer_booking_form_notice',
		null,
		isWaitingListSlot
	) as React.ReactNode;

	const allFields = {
		...activeFields.system,
		...(activeFields.location?.['location-select']
			? { 'location-select': activeFields.location['location-select'] }
			: { ...activeFields.location }),
		...activeFields.custom,
	};

	const sortedFields = Object.keys(allFields).sort(
		(a, b) => allFields[a].order - allFields[b].order
	);

	const handleFinish = async (values: Record<string, any>) => {
		try {
			setIsSubmitting(true);
			setSubmissionError(null);
			await onSubmit(values);
		} catch (error) {
			const message =
				error instanceof Error
					? error.message
					: __('Something went wrong. Please try again.', 'doublescale');
			setSubmissionError(message);
		} finally {
			setIsSubmitting(false);
		}
	};

	useEffect(() => {
		callApi({
			path: 'settings',
			method: 'GET',
			onSuccess: (data) => {
				setCountryCode(data.general.default_country_code.toLowerCase());
			},
			onError: (error) => {
				console.error('Error fetching country code:', error);
			},
		});
	}, []);

	useEffect(() => {
		if (prefilledData) {
			const initialValues: Record<string, any> = {};
			if (prefilledData.name) initialValues.name = prefilledData.name;
			if (prefilledData.email) initialValues.email = prefilledData.email;

			if (Object.keys(initialValues).length > 0) {
				form.setFieldsValue(initialValues);
			}
		}
	}, [prefilledData, form]);

	return (
		<div className="questions-container">
			<div className="questions-header">
				<div
					className="questions-header-icon"
					onClick={() => setStep(1)}
				>
					<LeftArrowIcon />
				</div>
				<p>{__('Enter Details', 'doublescale')}</p>
			</div>
			{waitingListNotice}
			{sortedFields.length > 0 && (
				<Form
					layout="vertical"
					onFinish={handleFinish}
					form={form}
					requiredMark={false}
				>
					{sortedFields.map(
						(fieldKey, index) =>
							(allFields[fieldKey].enabled ||
								allFields[fieldKey].enabled === undefined) && (
								<FormField
									key={index}
									id={fieldKey}
									field={allFields[fieldKey]}
									countryCode={countryCode}
								/>
							)
					)}
					{submissionError && (
						<Alert
							message={submissionError}
							type="error"
							showIcon
							closable
							onClose={() => setSubmissionError(null)}
							style={{ marginBottom: 16 }}
						/>
					)}
					<Form.Item className="schedule-btn-container">
						<button
							className={`schedule-btn ${css`
								background-color: ${baseColor};
								&:hover {
									background-color: ${darkColor};
								}
							`}`}
							type="submit"
							disabled={isSubmitting}
						>
							{isSubmitting ? (
								<>
									<Spin
										size="small"
										style={{ marginRight: '8px' }}
									/>
									{submittingText}
								</>
							) : (
								submitButtonText
							)}
						</button>
					</Form.Item>
				</Form>
			)}
		</div>
	);
};

export default BookingForm;