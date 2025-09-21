<?php

/**
 * QuillBooking Booking Rescheduled Trigger
 * This trigger will be fired when a booking is rescheduled.
 *
 * @since 1.0.0
 *
 * @package QuillCRM
 */

namespace QuillCRM\Automations\Triggers\Booking\QuillBooking;

use QuillCRM\Abstracts\Trigger;
use QuillCRM\Managers\Triggers_Manager;

/**
 * Booking Rescheduled Trigger
 */
class Booking_Rescheduled extends Trigger {



	/**
	 * Trigger Name
	 *
	 * @var string
	 */
	public $name = 'Booking Rescheduled';

	/**
	 * Trigger Slug
	 *
	 * @var string
	 */
	public $slug = 'quillbooking_booking_rescheduled';

	/**
	 * Trigger Description
	 *
	 * @var string
	 */
	public $description = 'This trigger will be fired when a booking is rescheduled in QuillBooking.';

	/**
	 * Trigger Attributes
	 *
	 * @var array
	 */
	public $attributes = array();

	/**
	 * Source
	 *
	 * @var string
	 */
	public $source = 'booking';

	/**
	 * Group
	 *
	 * @var string
	 */
	public $group = 'quillbooking';

	/**
	 * Load Hooks
	 *
	 * @since 1.0.0
	 *
	 * @return void
	 */
	public function load_hooks() {
		\add_action( 'quillbooking_booking_rescheduled', array( $this, 'booking_rescheduled' ), 10, 3 );
	}


	/**
	 * Booking Rescheduled
	 *
	 * @since 1.0.0
	 *
	 * @param \QuillBooking\Models\Booking_Model $booking Booking object.
	 * @return void
	 */
	public function booking_rescheduled( $booking ) {
		// Get guest information from the booking
		$guest       = $booking->guest ?? null;
		$guest_name  = '';
		$guest_email = '';

		if ( $guest ) {
			$guest_name  = $guest->name ?? '';
			$guest_email = $guest->email ?? '';
		}

		// Split name into first and last name if available
		$name_parts = explode( ' ', $guest_name, 2 );
		$first_name = $name_parts[0] ?? '';
		$last_name  = $name_parts[1] ?? '';

		$data = array(
			'first_name' => $first_name,
			'last_name'  => $last_name,
			'email'      => $guest_email,
			'data'       => array(
				'booking_id'     => $booking->id,
				'booking_data'   => $booking->toArray(),
				'trigger_action' => 'created',
			),
		);

		$this->process( $data );
	}

	/**
	 * Get fields
	 *
	 * @since 1.0.0
	 *
	 * @return array
	 */
	public function get_fields() {
		return array();
	}

	/**
	 * Get attributes schema
	 *
	 * @since 1.0.0
	 *
	 * @return array
	 */
	public function get_attributes_schema() {
		return array(
			'type'       => 'object',
			'properties' => array(),
		);
	}
}

Triggers_Manager::instance()->register( new Booking_Rescheduled() );
