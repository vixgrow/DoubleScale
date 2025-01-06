<?php
/**
 * Class Klaviyo Remove From List
 *
 * This class is responsible for handling the Klaviyo Remove From List action
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
 * Klaviyo Remove From List class
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
	public $slug = 'klaviyo_remove_from_list';

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
	public $description = 'This action will remove a contact from a list in Klaviyo';

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
				__( 'Klaviyo Remove From List action failed. List ID is required.', 'quillcrm' ),
				array(
					'code' => 'klaviyo_remove_from_list',
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

		$klaviyo = Integrations_Manager::instance()->get_integration( 'klaviyo' );
		$api     = $klaviyo->connect();
		if ( ! $api ) {
			quillcrm_get_logger()->error(
				__( 'Klaviyo Remove From List action failed. API connection failed.', 'quillcrm' ),
				array(
					'code' => 'klaviyo_connect',
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
		$result  = $api->get_profile( $email, $list_id );
		$profile = $result['data']['data'][0] ?? null;
		if ( ! $profile ) {
			quillcrm_get_logger()->error(
				__( 'Klaviyo Remove From List action failed. Profile not found.', 'quillcrm' ),
				array(
					'code' => 'klaviyo_remove_from_list',
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

		$profile_id = $profile['id'];
		$data       = array(
			'data' => array(
				array(
					'type' => 'profile',
					'id'   => $profile_id,
				),
			),
		);
		$result     = $api->remove_profile_from_list( $list_id, $data );
		if ( ! $result['success'] ) {
			quillcrm_get_logger()->error(
				__( 'Klaviyo Remove From List action failed. Failed to remove profile from list.', 'quillcrm' ),
				array(
					'code'     => 'klaviyo_remove_from_list',
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
			__( 'Klaviyo Remove From List action completed successfully.', 'quillcrm' ),
			array(
				'code'     => 'klaviyo_remove_from_list',
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

Actions_Manager::instance()->register( new Remove_From_List() );
