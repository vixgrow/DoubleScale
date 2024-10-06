<?php
/**
 * Class Remove_Subscriber_From_List
 *
 * This class is responsible for removing a contact from a Mautic list
 *
 * @since 1.0.0
 *
 * @package QuillCRM
 */

namespace QuillCRM\Automations\Actions\CRM\Mautic;

use QuillCRM\Abstracts\Action;
use QuillCRM\Managers\Actions_Manager;
use QuillCRM\Models\Automation_Model;
use QuillCRM\Models\Automation_Step_Model;
use QuillCRM\Models\Automation_Contact_Model;
use QuillCRM\Managers\Integrations_Manager;

/**
 * Remove Subscriber From List class
 */
class Remove_Subscriber_From_List extends Action {

	/**
	 * Action Name
	 *
	 * @var string
	 */
	public $name = 'Remove Subscriber From List';

	/**
	 * Action Slug
	 *
	 * @var string
	 */
	public $slug = 'mautic_remove_contact_from_list';

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
	public $group = 'mautic';

	/**
	 * Action Description
	 *
	 * @var string
	 */
	public $description = 'This action will remove a contact from a Mautic list.';

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
		$list_id = $step->get_setting( 'list_id', '' );
		if ( empty( $list_id ) ) {
			return false;
		}

		$email = $automation_contact->contact->email;
		$data  = array(
			'email'     => $email,
			'firstname' => $automation_contact->contact->first_name,
			'lastname'  => $automation_contact->contact->last_name,
		);

		$mautic = Integrations_Manager::instance()->get_integration( 'mautic' );
		$api    = $mautic->connect();
		if ( ! $api ) {
			return false;
		}

		$result = $api->get_or_create_contact( $data );
		if ( ! $result['success'] ) {
			return false;
		}

		$result = $api->remove_contact_from_list( $result['data']['id'], $list_id );

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
				'list_id' => array(
					'type'     => array( 'string', 'number' ),
					'required' => true,
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
			'list_id' => array(
				'type'     => 'api_select',
				'label'    => __( 'List', 'quillcrm' ),
				'endpoint' => 'mautic/lists',
			),
		);
	}
}

Actions_Manager::instance()->register( new Remove_Subscriber_From_List() );
