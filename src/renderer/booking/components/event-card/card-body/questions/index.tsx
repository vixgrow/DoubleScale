import { __ } from '@wordpress/i18n';
import { AdvancedSettings, Fields, RendererAdvancedSettings } from '@/types/booking';
import './style.scss';
import LeftArrowIcon from '../../../../icons/left-arrow-icon';
import FormField from '../../../inputs';
import { BookingForm as RendererForm } from '../../../inputs/form-bridge';
import { useEffect, useMemo, useState } from 'react';
import { Alert, AlertDescription } from '@doublescale/shared/ui/alert';
import { Spinner } from '@doublescale/shared/ui/spinner';
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

	const prefilledValues = useMemo(() => {
		const values: Record<string, string> = {};

		if (prefilledData?.name) {
			values.name = prefilledData.name;
		}
		if (prefilledData?.email) {
			values.email = prefilledData.email;
		}

		return values;
	}, [prefilledData?.email, prefilledData?.name]);

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
				<RendererForm
					initialValues={prefilledValues}
					onSubmit={handleFinish}
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
							variant="destructive"
							className="mb-4"
						>
							<AlertDescription>{submissionError}</AlertDescription>
						</Alert>
					)}
					<div className="schedule-btn-container">
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
									<Spinner className="mr-2" />
									{submittingText}
								</>
							) : (
								submitButtonText
							)}
						</button>
					</div>
				</RendererForm>
			)}
		</div>
	);
};

export default BookingForm;
