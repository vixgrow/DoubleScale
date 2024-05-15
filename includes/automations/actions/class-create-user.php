<?php
/**
 * Create User Action
 * This action will create a new user.
 *
 * @since 1.0.0
 *
 * @package QuillCRM
 */

namespace QuillCRM\Automations\Actions;

use QuillCRM\Abstracts\Action;
use QuillCRM\Managers\Actions_Manager;
use QuillCRM\Models\Automation_Model;
use QuillCRM\Models\Automation_Step_Model;
use QuillCRM\Models\Automation_Contact_Model;

/**
 * Create User Action
 */
class Create_User extends Action {

	/**
	 * Action Name
	 *
	 * @var string
	 */
	public $name = 'Create User';

	/**
	 * Action Slug
	 *
	 * @var string
	 */
	public $slug = 'create_user';

	/**
	 * Action Description
	 *
	 * @var string
	 */
	public $description = 'This action will create a new user.';

	/**
	 * Source
	 *
	 * @var string
	 */
	public $source = 'wp';

	/**
	 * Tigger Group
	 *
	 * @var string
	 */
	public $group = 'user';

	/**
	 * Process Action
	 *
	 * @since 1.0.0
	 *
	 * @param Automation_Model         $automation Automation Model.
	 * @param Automation_Step_Model    $step Automation Step Model.
	 * @param Automation_Contact_Model $contact Contact Model.
	 *
	 * @return bool
	 */
	public function process_action( Automation_Model $automation, Automation_Step_Model $step, Automation_Contact_Model $automation_contact ) {
		$contact = $automation_contact->contact;
		$user    = get_user_by( 'email', $contact->email );
		if ( ! $user ) {
			$user_id = wp_create_user( $contact->email, wp_generate_password( 8 ), $contact->email );
			if ( is_wp_error( $user_id ) ) {
				return false;
			}
			$first_name = $contact->first_name ? $contact->first_name : '';
			$last_name  = $contact->last_name ? $contact->last_name : '';
			if ( ! empty( $first_name ) ) {
				update_user_meta( $user_id, 'first_name', $first_name );
			}

			if ( ! empty( $last_name ) ) {
				update_user_meta( $user_id, 'last_name', $last_name );
			}
		}

		return true;
	}
}

Actions_Manager::instance()->register( new Create_User() );
