<?php

/**
 * Class Contact Subscribed Goal
 *
 * This class is responsible for handling the contact subscribed goal
 *
 * @since 1.0.0
 *
 * @package DoubleScale\Pro
 */

namespace DoubleScale\Modules\Automations\Goals;


defined( 'ABSPATH' ) || exit;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

use DoubleScale\Modules\Automations\Abstracts\Goal;
use DoubleScale\Modules\Automations\Services\GoalsManager;

/**
 * Contact Subscribed Goal class
 */
class ContactSubscribed extends Goal {


	/**
	 * Goal Name
	 *
	 * @var string
	 *
	 * @since 1.0.0
	 */
	public $name = 'Contact Subscribed';

	/**
	 * Goal Slug
	 *
	 * @var string
	 *
	 * @since 1.0.0
	 */
	public $slug = 'contact_subscribed';

	/**
	 * Goal Description
	 *
	 * @var string
	 *
	 * @since 1.0.0
	 */
	public $description = 'This goal is achieved when a contact is subscribed to a specific list.';

	/**
	 * Source
	 *
	 * @var string
	 *
	 * @since 1.0.0
	 */
	public $source = 'automation';

	/**
	 * Group
	 *
	 * @var string
	 *
	 * @since 1.0.0
	 */
	public $group = 'contact';

	/**
	 * Load Hooks
	 *
	 * @since 1.0.0
	 *
	 * @return void
	 */
	public function load_hooks() {
		add_action( 'doublescale_contact_subscribed', array( $this, 'contact_subscribed' ) );
	}

	/**
	 * Contact Subscribed
	 *
	 * @since 1.0.0
	 *
	 * @param ContactModel $contact_id Contact.
	 *
	 * @return void
	 */
	public function contact_subscribed( $contact ) {
		$this->process( $contact, array() );
	}
}

GoalsManager::instance()->register( new ContactSubscribed() );
