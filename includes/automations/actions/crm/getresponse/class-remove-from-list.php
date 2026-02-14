<?php
/**
 * Class Remove_From_List
 *
 * This class is responsible for removing a contact from a list in GetResponse
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
 * Remove From List class
 */
class Remove_From_List extends Action {

	/**
	 * Action Name
	 *
	 * @var string
	 */
	public $name = 'Remove From List';

	/**
	 * Action Slug
	 *
	 * @var string
	 */
	public $slug = 'getresponse_remove_from_list';

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
	public $description = 'This action will remove a contact from a list in GetResponse';

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
			quillcrm_get_logger()->error(
				__( 'GetResponse Remove From List: List ID is required.', 'quill-crm' ),
				array(
					'code' => 'getresponse_remove_from_list',
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

		$getresponse = Integrations_Manager::instance()->get_integration( 'getresponse' );
		$api         = $getresponse->connect();
		if ( ! $api ) {
			quillcrm_get_logger()->error(
				__( 'GetResponse API connection failed.', 'quill-crm' ),
				array(
					'code' => 'getresponse_connect',
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
		$contact = $api->get_contact( $email );
		if ( ! $contact ) {
			quillcrm_get_logger()->error(
				__( 'GetResponse Remove From List: Contact not found.', 'quill-crm' ),
				array(
					'code' => 'getresponse_remove_from_list',
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
			return true;
		}

		// First, we need to check if the contact is already in the list
		$contact_list = $contact['campaign']['campaignId'];
		if ( $contact_list !== $list_id ) {
			quillcrm_get_logger()->error(
				__( 'GetResponse Remove From List: Contact is not in the list.', 'quill-crm' ),
				array(
					'code' => 'getresponse_remove_from_list',
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
			return true;
		}

		$result = $api->remove_contact( $contact['contactId'], $list_id );
		if ( ! $result['success'] ) {
			quillcrm_get_logger()->error(
				__( 'GetResponse Remove From List: Failed to remove contact from list.', 'quill-crm' ),
				array(
					'code'     => 'getresponse_remove_from_list',
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
			return false;
		}

		quillcrm_get_logger()->info(
			__( 'GetResponse Remove From List: Contact removed from list.', 'quill-crm' ),
			array(
				'code'     => 'getresponse_remove_from_list',
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
					'description' => __( 'List ID', 'quill-crm' ),
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
				'label'    => __( 'List ID', 'quill-crm' ),
				'type'     => 'api_select',
				'endpoint' => 'getresponse/lists',
			),
		);
	}
}

Remove_From_List::instance();
