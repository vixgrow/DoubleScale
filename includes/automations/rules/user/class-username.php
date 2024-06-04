<?php
/**
 * Class Username
 *
 * This class is responsible for handling the user username rule
 *
 * @since 1.0.0
 *
 * @package QuillCRM
 */

namespace QuillCRM\Automations\Rules\User;

use QuillCRM\Abstracts\Rule;
use QuillCRM\Models\Automation_Contact_Model;
use QuillCRM\Managers\Rules_Manager;

/**
 * Username class
 */
class Username extends Rule {

	/**
	 * Name
	 *
	 * @var string
	 *
	 * @since 1.0.0
	 */
	public $name = 'Username';

	/**
	 * Slug
	 *
	 * @var string
	 *
	 * @since 1.0.0
	 */
	public $slug = 'user_username';

	/**
	 * Group
	 *
	 * @var string
	 *
	 * @since 1.0.0
	 */
	public $group = 'user';

	/**
	 * Type
	 *
	 * @var string
	 *
	 * @since 1.0.0
	 */
	public $type = 'select';

	/**
	 * Get options
	 *
	 * @since 1.0.0
	 *
	 * @param string $keyword Keyword.
	 *
	 * @return array
	 */
	public function get_options( $keyword = '' ) {
		$query = new \WP_User_Query(
			array(
				'search'         => '*' . $keyword . '*',
				'search_columns' => array( 'user_login' ),
				'fields'         => array( 'ID', 'user_login' ),
			)
		);

		$users   = $query->get_results();
		$options = array();
		foreach ( $users as $user ) {
			$options[ $user->ID ] = $user->user_login;
		}

		return $options;
	}

	/**
	 * Get value
	 *
	 * @since 1.0.0
	 *
	 * @param Automation_Contact_Model $automation_contact Contact Model.
	 *
	 * @return mixed
	 */
	public function get_value( $automation_contact ) {
		$user_id = $automation_contact->get_data( 'user_id', null );
		if ( ! $user_id ) {
			return null;
		}

		return $user_id;
	}
}

Rules_Manager::instance()->register( new Username() );
