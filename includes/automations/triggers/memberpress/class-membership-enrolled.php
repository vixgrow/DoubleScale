<?php
/**
 * MemberPress Trigger for Membership Enrolled
 *
 * This trigger will be fired when a user enrolls in a membership.
 *
 * @since 1.0.0
 *
 * @package QuillCRM
 */

namespace QuillCRM\Automations\Triggers\MemberPress;

use QuillCRM\Abstracts\Trigger;
use QuillCRM\Managers\Triggers_Manager;
use WP_User;

/**
 * Membership Enrolled Trigger
 */
class Membership_Enrolled extends Trigger {

	/**
	 * Trigger Name
	 *
	 * @var string
	 */
	public $name = 'Membership Enrolled';

	/**
	 * Trigger Slug
	 *
	 * @var string
	 */
	public $slug = 'memberpress_membership_enrolled';

	/**
	 * Trigger Description
	 *
	 * @var string
	 */
	public $description = 'This trigger will be fired when a user enrolls in a membership.';

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
	public $group = 'memberpress';

	/**
	 * Load Hooks
	 *
	 * @since 1.0.0
	 *
	 * @return void
	 */
	public function load_hooks() {
		add_action( 'pmpro_after_change_membership_level', array( $this, 'change_membership' ) );
	}

	/**
	 * Change membership
	 *
	 * @param int $level_id Level ID.
	 * @param int $user_id User ID.
	 */
	public function change_membership( $level_id, $user_id ) {
		error_log( 'MemberShip' . $level_id );
		$user = get_user_by( 'ID', $user_id );
		if ( ! $user instanceof WP_User ) {
			return;
		}

		$data = array(
			'email' => $user->user_email,
			'data'  => array(
				'level_id' => $level_id,
				'user_id'  => $user_id,
			),
		);

		error_log( 'MemberShip' . wp_json_encode( $data ) );

		// $this->process( $data );
	}
}

Triggers_Manager::instance()->register( new Membership_Enrolled() );
