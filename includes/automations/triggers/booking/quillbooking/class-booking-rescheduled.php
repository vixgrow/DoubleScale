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

use QuillCRM\Abstracts\Trigger_Pro;
use QuillCRM\Managers\Triggers_Manager;

/**
 * Booking Rescheduled Trigger
 */
class Booking_Rescheduled extends Trigger_Pro {

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
}

Triggers_Manager::instance()->register( new Booking_Rescheduled() );
