<?php
/**
 * User Login Trigger
 *
 * @since 1.0.0
 *
 * @package QuillCRM
 */

namespace QuillCRM\Automations\Triggers;

use QuillCRM\Abstracts\Trigger;
use QuillCRM\Managers\Triggers_Manager;

/**
 * User Login Trigger
 */
class User_Login extends Trigger {

	/**
	 * Trigger Name
	 *
	 * @var string
	 */
	public $name = 'User Login';

	/**
	 * Trigger Slug
	 *
	 * @var string
	 */
	public $slug = 'user_login';

	/**
	 * Trigger Description
	 *
	 * @var string
	 */
	public $description = 'This trigger will be fired when a user logs in.';

	/**
	 * Trigger Attributes
	 *
	 * @var array
	 */
	public $attributes = array();

	/**
	 * Load Hooks
	 *
	 * @since 1.0.0
	 *
	 * @return void
	 */
	public function load_hooks() {
		add_action( 'wp_login', array( $this, 'user_login' ), 10, 2 );
	}

	/**
	 * User Login
	 *
	 * @since 1.0.0
	 *
	 * @param string  $user_login
	 * @param WP_User $user
	 *
	 * @return void
	 */
	public function user_login( $user_login, $user ) {
		$data = array(
			'email' => $user->user_email,
			'data'  => array(
				'user_id' => $user->ID,
			),
		);
		$this->process( $data );
		error_log( 'Logged in User ID: ' . $user->ID );
	}
}

Triggers_Manager::instance()->register( new User_Login() );
