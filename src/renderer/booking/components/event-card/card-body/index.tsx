import { useEffect, useState } from 'react';
import { RendererBooking, RendererEvent } from '@/types/booking';
import DateTimePicker from './date-time-picker';
import EventDetails from './event-details';
import Hosts from './hosts';
import './style.scss';
import { Dayjs } from 'dayjs';
import BookingForm from './questions';
import Reschedule from '../../reschedule';
import ShimmerLoader from '../../shimmer-loader';
import { get } from 'lodash';
import { get_location, resolvePaymentMethod, handleBookingResponse } from '@/utils/booking';
import tinycolor from 'tinycolor2';
import { applyFilters, doAction } from '@wordpress/hooks';
import { __ } from '@wordpress/i18n';

interface CardBodyProps {
	event: RendererEvent;
	ajax_url: string;
	type?: string;
	booking?: RendererBooking;
	url: string;
	globalCurrency: string;
	timeFormat: string;
}

const CardBody: React.FC<CardBodyProps> = ({
	event,
	ajax_url,
	type = 'schedule',
	booking,
	url,
	globalCurrency,
	timeFormat,
}) => {
	const baseColor = tinycolor(event.color);
	const lightColor = baseColor.lighten(40).toString();
	const [selectedDate, setSelectedDate] = useState<Dayjs | null>(null);
	const [selectedTime, setSelectedTime] = useState<string | null>(null);
	const [timeZone, setTimeZone] = useState<string>(
		event.limits_data?.timezone_lock?.enable
			? event.limits_data?.timezone_lock?.timezone
			: Intl.DateTimeFormat().resolvedOptions().timeZone
	);
	const [step, setStep] = useState<number>(1);
	const [selectedDuration, setSelectedDuration] = useState<number>(
		event.duration
	);
	const [bookingData, setBookingData] = useState<any>(null);
	const [isLoading, setIsLoading] = useState<boolean>(true);
	const [totalPrice, setTotalPrice] = useState<number>(0);
	const [hostIds, setHostIds] = useState<number[]>([]);
	const [isWaitingListSlot, setIsWaitingListSlot] = useState<boolean>(false);
	// Get prefilled data from URL parameters
	const [prefilledData, setPrefilledData] = useState<{
		name?: string;
		email?: string;
	}>({});

	useEffect(() => {
		const searchParams = new URLSearchParams(window.location.search);
		const prefilledName = searchParams.get('username');
		const prefilledEmail = searchParams.get('email');

		if (prefilledName || prefilledEmail) {
			setPrefilledData({
				name: prefilledName || undefined,
				email: prefilledEmail || undefined,
			});
		}
	}, []);

	// Calculate price based on whether it's multi-duration or not
	const calculatePrice = () => {
		const isMultiDurations =
			event.additional_settings?.allow_attendees_to_select_duration;
		const paymentSettings = get(event, 'payments_settings', {});
		const isPaymentEnabled = get(paymentSettings, 'enable_payment', false);

		if (!isPaymentEnabled) return 0;

		if (isMultiDurations && selectedDuration) {
			const durationStr = selectedDuration.toString();
			return get(
				paymentSettings,
				['multi_duration_items', durationStr, 'price'],
				0
			);
		} else {
			const items = get(paymentSettings, 'items', []) as Array<{
				item: string;
				price: number;
			}>;
			if (items.length > 0) {
				return items[0].price;
			}
		}

		return 0;
	};

	// Update price when duration changes
	useEffect(() => {
		setTotalPrice(calculatePrice());
	}, [selectedDuration, event]);

	const proActive = (window as any).doublescale?.booking_pro_active === true;
	const requiresPayment = Boolean(
		event.payments_settings?.enable_payment && totalPrice > 0 && proActive
	);
	const hasPaymentGateways = Boolean(
		proActive && event.payments_settings?.enable_stripe
	);

	const handleSelectedTime = (time: string | null) => {
		setSelectedTime(time);
		if (!time) {
			setStep(1);
			return;
		}
		setStep(2);
	};

	const handleSave = async (values: any) => {
		try {
			const currentUrlParams = new URLSearchParams(window.location.search);
			const prefilledName = currentUrlParams.get('username');
			const prefilledEmail = currentUrlParams.get('email');

			const finalName = prefilledName || values['name'];
			const finalEmail = prefilledEmail || values['email'];

			const formData = new FormData();
			formData.append('action', 'doublescale_booking_booking');
			formData.append('nonce', (window as any)['doublescale_booking_config']?.nonce || '');
			formData.append('id', event.id.toString());
			formData.append('timezone', timeZone || '');
			formData.append(
				'start_date',
				(selectedDate ? selectedDate.format('YYYY-MM-DD') : '') +
					' ' +
					(selectedTime + ':00' || '')
			);
			formData.append('duration', selectedDuration.toString());

			if (hostIds.length > 0) {
				formData.append('host_ids', hostIds.join(','));
			}

			const { paymentMethod, status: paymentStatus } = resolvePaymentMethod(
				event.payments_settings,
				requiresPayment,
				hasPaymentGateways
			);

			if (paymentMethod) {
				formData.append('status', paymentStatus);
				formData.append('payment_method', paymentMethod);
			}

			formData.append(
				'invitees',
				JSON.stringify([{ name: finalName, email: finalEmail }])
			);

			const location = get_location(
				event.location,
				values.location,
				values['location-data']
			);
			formData.append('location', JSON.stringify(location));

			const filteredValues = { ...values };
			delete filteredValues['name'];
			delete filteredValues['email'];
			delete filteredValues['field'];
			delete filteredValues['location'];
			if (filteredValues['location-data']) {
				delete filteredValues['location-data'];
			}
			if (values['location-select']) {
				delete filteredValues['location-select'];
			}
			if (values['field'] && values['field']['location-select']) {
				filteredValues['location'] = values['field']['location-select'];
			}

			formData.append('fields', JSON.stringify(filteredValues));

			const response = await fetch(ajax_url, {
				method: 'POST',
				body: formData,
			});

			if (!response.ok) {
				throw new Error(`HTTP error! Status: ${response.status}`);
			}

			const data = await response.json();

			if (!data.success) {
				throw new Error(data.data?.message || 'Unknown error occurred');
			}

			doAction('DoubleScale.BookingCompleted', {
				data: {
					calendar_id: event.calendar_id,
					event_id: event.id,
				},
			});

			const embedUrlParams = new URLSearchParams(window.location.search);

			const bookingRedirectUrl = data.data?.booking?.booking_redirect_url;
			const eventRedirectAfterSubmit = event.advanced_settings?.redirect_after_submit;
			const customRedirect = (bookingRedirectUrl && eventRedirectAfterSubmit) ? bookingRedirectUrl : null;

			handleBookingResponse(data, {
				url,
				requiresPayment,
				hasPaymentGateways,
				paymentSettings: event.payments_settings,
				paymentMethod,
				proActive,
				setBookingData,
				setStep,
				customRedirectUrl: customRedirect,
				onConfirmation: (bookingData) => {
					const confirmationData = {
						type: 'doublescale_booking_confirmation',
						blockId: embedUrlParams.get('blockId') || 'unknown',
						bookingId: bookingData.hash_id,
						eventId: event.id || 'unknown',
						bookingDate: selectedDate,
						bookingTime: selectedTime,
						status: 'confirmed',
						bookingData,
					};

					if (window.parent && window.parent !== window) {
						window.parent.postMessage(
							JSON.stringify(confirmationData),
							'*'
						);
					}

					window.dispatchEvent(
						new CustomEvent('doublescale_booking_confirmation', {
							detail: confirmationData,
						})
					);

					document.body.innerHTML = `
						<div style="display:flex;align-items:center;justify-content:center;height:100vh;font-family:sans-serif;color:#28a745;text-align:center;background:#f8f9fa;">
							<div style="padding: 40px; background: white; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); max-width: 400px;">
								<div style="font-size:48px;margin-bottom:16px;">&#x2705;</div>
								<h2 style="margin: 0 0 16px 0; color: #28a745;">Booking Confirmed!</h2>
								<p style="margin: 0; color: #6c757d;">Your appointment has been successfully scheduled.</p>
								<div style="margin-top: 20px; padding: 15px; background: #f8f9fa; border-radius: 4px; font-size: 14px; color: #495057;">
									<strong>Booking ID:</strong> ${bookingData.hash_id}<br/>
									<strong>Date:</strong> ${selectedDate}<br/>
									<strong>Time:</strong> ${selectedTime}
								</div>
							</div>
						</div>
					`;
				},
			});
		} catch (error) {
			const message =
				error instanceof Error
					? error.message
					: __('Something went wrong. Please try again.', 'doublescale');
			throw new Error(message);
		}
	};

	useEffect(() => {
		if (event.additional_settings?.allow_attendees_to_select_duration) {
			setSelectedDuration(event.additional_settings.default_duration);
		}
	}, [event]);

	return (
		<>
			{isLoading && <ShimmerLoader />}

			<div
				className="event-card-details"
				style={{ display: isLoading ? 'none' : 'block' }}
			>
				<Hosts hosts={event.hosts} />
				<EventDetails
					event={event}
					selectedDuration={selectedDuration}
					setSelectedDuration={setSelectedDuration}
					step={step}
					selectedDate={selectedDate}
					selectedTime={selectedTime}
					booking={booking ?? null}
					globalCurrency={globalCurrency}
					timeFormat={timeFormat}
				/>
				{selectedTime && step === 2 ? (
					type === 'reschedule' ? (
						<Reschedule
							ajax_url={ajax_url}
							setStep={setStep}
							fields={event.fields}
							booking={booking ?? null}
							selectedDate={selectedDate}
							selectedTime={selectedTime}
							timezone={timeZone}
							url={url}
							baseColor={event.color}
							darkColor={tinycolor(event.color)
								.darken(20)
								.toString()}
						/>
					) : (
					<BookingForm
						fields={event.fields}
						setStep={setStep}
						onSubmit={handleSave}
						baseColor={event.color}
						darkColor={tinycolor(event.color)
							.darken(20)
							.toString()}
						prefilledData={prefilledData}
						advancedSettings={event.advanced_settings}
						submitButtonFallback="Schedule Event"
						loadingText={__('Scheduling...', 'doublescale')}
						isWaitingListSlot={isWaitingListSlot}
					/>
					)
				) : step === 3 &&
				  requiresPayment &&
				  hasPaymentGateways &&
				  bookingData &&
				  event.payments_settings?.enable_stripe && // Only show payment component for Stripe
				  (window as any).doublescale?.booking_pro_active === true ? (
					(() => {
						// Use the filter to get the payment component
						const paymentComponent = applyFilters(
							'doublescale_booking_renderer_payment_component',
							null,
							{
								ajax_url,
								setStep,
								bookingData,
								event,
								totalPrice,
								baseColor: event.color,
								darkColor: tinycolor(event.color)
									.darken(20)
									.toString(),
							}
						);
						return paymentComponent as React.ReactNode;
					})()
				) : (
					<DateTimePicker
						setIsLoading={setIsLoading}
						selectedTime={selectedTime}
						event={event}
						selectedDate={selectedDate}
						setSelectedDate={setSelectedDate}
						setHostIds={setHostIds}
						timeZone={timeZone}
						setTimeZone={setTimeZone}
						setSelectedTime={handleSelectedTime}
						ajax_url={ajax_url}
						selectedDuration={selectedDuration}
						baseColor={event.color}
						lightColor={lightColor}
						timeFormat={timeFormat}
						onWaitingListSlotSelected={setIsWaitingListSlot}
					/>
				)}
			</div>
		</>
	);
};

export default CardBody;
