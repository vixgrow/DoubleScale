<?php
/**
 * Class Add_To_Group
 *
 * This class is responsible for adding a contact to a group in MailerLite
 *
 * @since 1.0.0
 *
 * @package QuillCRM
 */

namespace QuillCRM\Automations\Actions\CRM\MailerLite;

use QuillCRM\Abstracts\Action;
use QuillCRM\Managers\Actions_Manager;
use QuillCRM\Models\Automation_Model;
use QuillCRM\Models\Automation_Step_Model;
use QuillCRM\Models\Automation_Contact_Model;
use QuillCRM\Managers\Integrations_Manager;

/**
 * Add To Group class
 */
class Add_To_Group extends Action {

	/**
	 * Action Name
	 *
	 * @var string
	 */
	public $name = 'Add To Group';

	/**
	 * Action Slug
	 *
	 * @var string
	 */
	public $slug = 'mailerlite_add_to_group';

	/**
	 * Source
	 *
	 * @var string
	 */
	public $source = 'send_data';

	/**
	 * Tigger Group
	 *
	 * @var string
	 */
	public $group = 'mailerlite';

	/**
	 * Action Description
	 *
	 * @var string
	 */
	public $description = 'This action will add a contact to a group in MailerLite';

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
		$group_id = $step->get_setting( 'group_id' );

		if ( empty( $group_id ) ) {
			return false;
		}

		$mailerlite = Integrations_Manager::instance()->get_integration( 'mailerlite' );
		$api        = $mailerlite->connect();
		if ( ! $api ) {
			return false;
		}

		$email      = $automation_contact->contact->email;
		$subscriber = array(
			'email'  => $email,
			'groups' => array(
				$group_id,
			),
		);

		$result = $api->add_subscriber( $subscriber );

		return $result['success'];
	}

	/**
	 * Get attributes schema
	 *
	 * @return array
	 */
	public function get_attributes_schema() {
		return array(
			'type'       => 'object',
			'properties' => array(
				'group_id' => array(
					'description' => __( 'Group ID', 'quillcrm' ),
					'type'        => array( 'string', 'integer' ),
					'required'    => true,
				),
			),
		);
	}

	/**
	 * Get fields
	 *
	 * @return array
	 */
	public function get_fields() {
		return array(
			'group_id' => array(
				'label'    => __( 'Group ID', 'quillcrm' ),
				'type'     => 'api_select',
				'endpoint' => 'mailerlite/groups',
			),
		);
	}
}

Actions_Manager::instance()->register( new Add_To_Group() );
