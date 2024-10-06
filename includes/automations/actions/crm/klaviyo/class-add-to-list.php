<?php
/**
 * Class Klaviyo Add To List
 *
 * This class is responsible for handling the Klaviyo Add To List action
 *
 * @since 1.0.0
 *
 * @package QuillCRM
 */

namespace QuillCRM\Automations\Actions\CRM\Klaviyo;

use QuillCRM\Abstracts\Action;
use QuillCRM\Managers\Actions_Manager;
use QuillCRM\Models\Automation_Model;
use QuillCRM\Models\Automation_Step_Model;
use QuillCRM\Models\Automation_Contact_Model;
use QuillCRM\Managers\Integrations_Manager;

/**
 * Klaviyo Add To List class
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
	public $slug = 'klaviyo_add_to_list';

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
	public $group = 'klaviyo';

	/**
	 * Action Description
	 *
	 * @var string
	 */
	public $description = 'This action will add a contact to a list in Klaviyo';

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

		$klaviyo = Integrations_Manager::instance()->get_integration( 'klaviyo' );
		$api     = $klaviyo->connect();
		if ( ! $api ) {
			return false;
		}

		$email = $automation_contact->contact->email;
		$data  = array(
			'data' => array(
				'type'       => 'profile',
				'attributes' => array(
					'email' => $email,
				),
			),
		);

		$result = $api->create_or_update_profile( $data );
		if ( ! $result['success'] ) {
			return false;
		}

		$profile_id = $result['data']['data']['id'];
		$list_data  = array(
			'data' => array(
				array(
					'type' => 'profile',
					'id'   => $profile_id,
				),
			),
		);

		$result = $api->add_profile_to_list( $list_id, $list_data );

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
				'endpoint' => 'klaviyo/lists',
			),
		);
	}
}

Actions_Manager::instance()->register( new Add_To_List() );
