<?php
/**
 * Class Remove_Subscriber_From_List
 *
 * This class is responsible for removing a contact from a Hubspot list
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
	public $slug = 'hubspot_remove_contact_from_list';

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
	public $description = 'This action will remove a contact from a Hubspot list.';

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
				__( 'Hubspot Remove Subscriber From List: List ID is required.', 'quill-crm' ),
				array(
					'code' => 'hubspot_remove_contact_from_list',
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

		$email   = $automation_contact->contact->email;
		$hubspot = Integrations_Manager::instance()->get_integration( 'hubspot' );
		$api     = $hubspot->connect();
		if ( ! $api ) {
			quillcrm_get_logger()->error(
				__( 'Could not connect to Hubspot.', 'quill-crm' ),
				array(
					'code' => 'hubspot_connect',
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

		$result = $api->get_contact_by_email( $email );
		if ( ! $result['success'] ) {
			quillcrm_get_logger()->error(
				__( 'Hubspot Remove Subscriber From List: Could not get contact.', 'quill-crm' ),
				array(
					'code'     => 'hubspot_remove_contact_from_list',
					'data'     => array(
						'automation' => array(
							'id'   => $automation->id,
							'name' => $automation->name,
						),
						'step'       => array(
							'id' => $step->id,
						),
					),
					'response' => $result,
				)
			);
			return true;
		}

		$result = $api->remove_contact_from_list( $result['data']['id'], $list_id );
		if ( ! $result['success'] ) {
			quillcrm_get_logger()->error(
				__( 'Hubspot Remove Subscriber From List: Could not remove contact from list.', 'quill-crm' ),
				array(
					'code' => 'hubspot_remove_contact_from_list',
					'data' => array(
						'automation' => array(
							'id'   => $automation->id,
							'name' => $automation->name,
						),
						'step'       => array(
							'id' => $step->id,
						),
						'response'   => $result,
					),
				)
			);
			return false;
		}

		quillcrm_get_logger()->info(
			__( 'Hubspot Remove Subscriber From List: Contact removed from list.', 'quill-crm' ),
			array(
				'code'     => 'hubspot_remove_contact_from_list',
				'data'     => array(
					'automation' => array(
						'id'   => $automation->id,
						'name' => $automation->name,
					),
					'step'       => array(
						'id' => $step->id,
					),
				),
				'response' => $result,
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

Remove_Subscriber_From_List::instance();