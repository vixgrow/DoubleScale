<?php

/**
 * Cancel Page Renderer
 */

namespace DoubleScale\Modules\Booking\Renderer;


defined( 'ABSPATH' ) || exit;

class CancelPageRenderer extends BaseTemplateRenderer {

	private string $eventModelClass;

	public function __construct( string $eventModelClass ) {
		parent::__construct();
		$this->eventModelClass = $eventModelClass;
	}

	public function render( $booking ) {
		$calendar = $booking ? $booking->calendar : null;
		if ( ! $calendar || 'active' !== $calendar->status ) {
			return $this->render_unavailable();
		}

		$other_fields = array();

		if ( $booking->event_id && $booking->event ) {
			$event = $this->eventModelClass::where( 'id', $booking->event_id )->first();
			if ( $event ) {
				$fields       = $event->getFieldsAttribute();
				$other_fields = $fields['other'] ?? array();
			}
		}

		if ( ! isset( $other_fields['cancellation_reason'] ) ) {
			$other_fields['cancellation_reason'] = array(
				'enabled'     => true,
				'required'    => false,
				'label'       => __( 'Reason for cancellation', 'doublescale' ),
				'placeholder' => __( 'Let us know why you are cancelling...', 'doublescale' ),
			);
		}

		$time_format            = $this->get_time_format();
		$booking_array          = $this->dataFormatter->format_booking_data( $booking, $time_format );
		$booking_array['hosts'] = $this->format_hosts_data( $booking );

		$template_path = __DIR__ . '/templates/cancel.php';

		$advanced_settings = $booking->getAdvancedSettings();
		$timezone          = $booking_array['timezone'] ?? 'UTC';

		$cancel_permissions = $this->check_cancellation_permissions( $advanced_settings, $booking_array, $timezone );

		return $this->render_template_page(
			$template_path,
			array(
				'booking_array'         => $booking_array,
				'fields'                => $other_fields,
				'title'                 => __( 'Cancel Booking', 'doublescale' ),
				'can_cancel'            => $cancel_permissions['can_cancel'],
				'cancel_denied_message' => $cancel_permissions['message'],
			)
		);
	}
}
