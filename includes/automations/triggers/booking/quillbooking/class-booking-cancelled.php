<?php

/**
 * QuillBooking Booking Cancelled Trigger
 * This trigger will be fired when a booking is cancelled.
 *
 * @since 1.0.0
 *
 * @package QuillCRM
 */

namespace QuillCRM\Automations\Triggers\Booking\QuillBooking;

use QuillCRM\Abstracts\Trigger_Pro;
use QuillCRM\Managers\Triggers_Manager;

/**
 * Booking Cancelled Trigger
 */
class Booking_Cancelled extends Trigger_Pro {

	/**
	 * Trigger Name
	 *
	 * @var string
	 */
	public $name = 'Booking Cancelled';

	/**
	 * Trigger Slug
	 *
	 * @var string
	 */
	public $slug = 'quillbooking_booking_cancelled';

	/**
	 * Trigger Description
	 *
	 * @var string
	 */
	public $description = 'This trigger will be fired when a booking is cancelled in QuillBooking.';

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

Triggers_Manager::instance()->register( new Booking_Cancelled() );
