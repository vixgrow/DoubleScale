<?php
/**
 * Class Add_To_List
 *
 * This class is responsible for adding a contact to a Hubspot list
 *
 * @since 1.0.0
 *
 * @package QuillCRM
 */

namespace QuillCRM\Automations\Actions\CRM\Hubspot;

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
	public $slug = 'hubspot_add_to_list';

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
	public $group = 'hubspot';

	/**
	 * Action Description
	 *
	 * @var string
	 */
	public $description = 'This action will add a contact to a Hubspot list.';

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
			quillcrm_get_logger()->error(
				__( 'Hubspot Add To List: List ID is required.', 'quill-crm' ),
				array(
					'code' => 'hubspot_add_to_list',
					'data' => array(
						'automation' => array(
							'id'   => $automation->id,
							'name' => $automation->name,
						),
						'step'       => array(
							'id' => $step->id,
						),
					),
				)
			);
			return false;
		}

		$email = $automation_contact->contact->email;
		$data  = array(
			'properties' => array(
				'email'     => $email,
				'firstname' => $automation_contact->contact->first_name,
				'lastname'  => $automation_contact->contact->last_name,
			),
		);

		$hubspot = Integrations_Manager::instance()->get_integration( 'hubspot' );
		$api     = $hubspot->connect();
		if ( ! $api ) {
			quillcrm_get_logger()->error(
				__( 'Hubspot API connection failed.', 'quill-crm' ),
				array(
					'code' => 'hubspot_connect',
					'data' => array(
						'automation' => array(
							'id'   => $automation->id,
							'name' => $automation->name,
						),
					),
				)
			);
			return false;
		}

		$result = $api->get_or_create_contact( $data );
		if ( ! $result['success'] ) {
			quillcrm_get_logger()->error(
				__( 'Failed to get or create contact in Hubspot.', 'quill-crm' ),
				array(
					'code' => 'hubspot_get_or_create_contact',
					'data' => array(
						'automation' => array(
							'id'   => $automation->id,
							'name' => $automation->name,
						),
					),
				)
			);
			return false;
		}

		$contact_id = $result['data']['id'];
		$result     = $api->add_contact_to_list( $contact_id, $list_id );
		if ( ! $result['success'] ) {
			quillcrm_get_logger()->error(
				__( 'Failed to add contact to Hubspot list.', 'quill-crm' ),
				array(
					'code' => 'hubspot_add_contact_to_list',
					'data' => array(
						'automation' => array(
							'id'   => $automation->id,
							'name' => $automation->name,
						),
					),
				)
			);
			return false;
		}

		quillcrm_get_logger()->info(
			__( 'Contact added to Hubspot list.', 'quill-crm' ),
			array(
				'code' => 'hubspot_add_contact_to_list',
				'data' => array(
					'automation' => array(
						'id'   => $automation->id,
						'name' => $automation->name,
					),
				),
			)
		);

		return true;
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
				'label'    => __( 'List ID', 'quill-crm' ),
				'type'     => 'api_select',
				'endpoint' => 'hubspot/lists',
			),
		);
	}
}

Add_To_List::instance();
