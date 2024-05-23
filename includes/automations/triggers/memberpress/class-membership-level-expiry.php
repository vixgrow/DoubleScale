<?php
/**
 * MemberPress Trigger for Membership Level Expiry
 *
 * This trigger will be fired when a user's membership level expires.
 *
 * @since 1.0.0
 *
 * @package QuillCRM
 */

namespace QuillCRM\Automations\Triggers\MemberPress;

use QuillCRM\Abstracts\Trigger;
use QuillCRM\Managers\Triggers_Manager;

/**
 * Membership Level Expiry Trigger
 */
class Membership_Level_Expiry extends Trigger {

	/**
	 * Trigger Name
	 *
	 * @var string
	 */
	public $name = 'Membership Level Expiry';

	/**
	 * Trigger Slug
	 *
	 * @var string
	 */
	public $slug = 'memberpress_membership_level_expiry';

	/**
	 * Trigger Description
	 *
	 * @var string
	 */
	public $description = 'This trigger will be fired when a user\'s membership level expires.';

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
	public $source = 'memberpress';

	/**
	 * Group
	 *
	 * @var string
	 */
	public $group = 'membership';

	/**
	 * Load hooks
	 *
	 * @since 1.0.0
	 *
	 * @return void
	 */
	public function load_hooks() {
		add_action( 'pmpro_membership_post_membership_expiry', array( $this, 'membership_expiry' ) );
	}

	/**
	 * Membership Expiry
	 *
	 * @since 1.0.0
	 *
	 * @param int $user_id
	 * @param int $membership_id
	 *
	 * @return void
	 */
	public function membership_expiry( $user_id, $membership_id ) {
		error_log( 'Membership Level Expiry ' . $membership_id );
		error_log( 'User ID ' . $user_id );
	}
}

Triggers_Manager::instance()->register( new Membership_Level_Expiry() );
