<?php

/**
 * QuillBooking Booking Created Trigger
 * This trigger will be fired when a booking is created.
 *
 * @since 1.0.0
 *
 * @package QuillCRM
 */

namespace QuillCRM\Automations\Triggers\Booking\QuillBooking;

use QuillCRM\Abstracts\Trigger_Pro;
use QuillCRM\Managers\Triggers_Manager;

/**
 * Booking Created Trigger
 */
class Booking_Created extends Trigger_Pro {

	/**
	 * Trigger Name
	 *
	 * @var string
	 */
	public $name = 'Booking Created';

	/**
	 * Trigger Slug
	 *
	 * @var string
	 */
	public $slug = 'quillbooking_booking_created';

	/**
	 * Trigger Description
	 *
	 * @var string
	 */
	public $description = 'This trigger will be fired when a new booking is created in QuillBooking.';

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


Triggers_Manager::instance()->register( new Booking_Created() );
