<?php
/**
 * Class Add_To_List
 *
 * This class is responsible for adding a contact to a list in GetResponse
 *
 * @since 1.0.0
 *
 * @package QuillCRM
 */

namespace QuillCRM\Automations\Actions\CRM\GetResponse;

use QuillCRM\Abstracts\Action;
use QuillCRM\Managers\Actions_Manager;
use QuillCRM\Models\Automation_Model;
use QuillCRM\Models\Automation_Step_Model;
use QuillCRM\Models\Automation_Contact_Model;
use QuillCRM\Managers\Integrations_Manager;

/**
 * Add To List class
 */
class Add_To_List extends Action {

	/**
	 * Action Name
	 *
	 * @var string
	 */
	public $name = 'Add To List';

	/**
	 * Action Slug
	 *
	 * @var string
	 */
	public $slug = 'getresponse_add_to_list';

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
	public $group = 'getresponse';

	/**
	 * Action Description
	 *
	 * @var string
	 */
	public $description = 'This action will add a contact to a list in GetResponse';

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
		$list_id = $step->get_setting( 'list_id' );

		if ( empty( $list_id ) ) {
			return false;
		}

		$getresponse = Integrations_Manager::instance()->get_integration( 'getresponse' );
		$api         = $getresponse->connect();
		if ( ! $api ) {
			return false;
		}

		$email  = $automation_contact->contact->email;
		$data   = array(
			'email'    => $email,
			'campaign' => array(
				'campaignId' => $list_id,
			),
		);
		$result = $api->create_or_update_contact( $data );

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
					'description' => __( 'List ID', 'quillcrm' ),
					'type'        => 'string',
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
			'list_id' => array(
				'label'    => __( 'List ID', 'quillcrm' ),
				'type'     => 'api_select',
				'endpoint' => 'getresponse/lists',
			),
		);
	}
}

Actions_Manager::instance()->register( new Add_To_List() );
