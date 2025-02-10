<?php
/**
 * Class Remove_List
 *
 * This class is responsible for removeing list to a contact in ActiveCampaign
 *
 * @since 1.0.0
 *
 * @package QuillCRM
 */

namespace QuillCRM\Automations\Actions\CRM\ActiveCampaign;

use QuillCRM\Abstracts\Action;
use QuillCRM\Managers\Actions_Manager;
use QuillCRM\Models\Automation_Model;
use QuillCRM\Models\Automation_Step_Model;
use QuillCRM\Models\Automation_Contact_Model;
use QuillCRM\Managers\Integrations_Manager;

/**
 * Remove List class
 */
class Remove_List extends Action {

	/**
	 * Action Name
	 *
	 * @var string
	 */
	public $name = 'Remove List';

	/**
	 * Action Slug
	 *
	 * @var string
	 */
	public $slug = 'activecampaign_remove_list';

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
	public $group = 'activecampaign';

	/**
	 * Action Description
	 *
	 * @var string
	 */
	public $description = 'This action will remove list to a contact in ActiveCampaign.';

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
		$list = $step->get_setting( 'list', '' );
		if ( empty( $list ) ) {
			quillcrm_get_logger()->error(
				__( 'ActiveCampaign Remove List: List is empty.', 'quillcrm' ),
				array(
					'code' => 'activecampaign_remove_list',
					'data' => array(
						'automation' => array(
							'id'   => $automation->id,
							'name' => $automation->name,
						),
						'step'       => array(
							'id'   => $step->id,
							'type' => $step->type,
						),
					),
				)
			);
			return false;
		}

		$activecampaign = Integrations_Manager::instance()->get_integration( 'activecampaign' );
		$api            = $activecampaign->connect();
		if ( ! $api ) {
			quillcrm_get_logger()->error(
				__( 'ActiveCampaign API connection failed.', 'quillcrm' ),
				array(
					'code' => 'activecampaign_connect',
					'data' => array(
						'automation' => array(
							'id'   => $automation->id,
							'name' => $automation->name,
						),
						'step'       => array(
							'id'   => $step->id,
							'type' => $step->type,
						),
					),
				)
			);
			return false;
		}

		$result = $api->get_contact( $automation_contact->contact->email );
		if ( ! $result['success'] ) {
			quillcrm_get_logger()->error(
				__( 'Failed to get contact from ActiveCampaign.', 'quillcrm' ),
				array(
					'code'     => 'activecampaign_get_contact',
					'data'     => array(
						'automation' => array(
							'id'   => $automation->id,
							'name' => $automation->name,
						),
						'step'       => array(
							'id'   => $step->id,
							'type' => $step->type,
						),
					),
					'response' => $result,
				)
			);
			return false;
		}

		$contact_id = $result['data']['contacts'][0]['id'] ?? null;
		if ( ! $contact_id ) {
			quillcrm_get_logger()->error(
				__( 'Failed to get contact ID from ActiveCampaign.', 'quillcrm' ),
				array(
					'code'     => 'activecampaign_get_contact_id',
					'data'     => array(
						'automation' => array(
							'id'   => $automation->id,
							'name' => $automation->name,
						),
						'step'       => array(
							'id'   => $step->id,
							'type' => $step->type,
						),
					),
					'response' => $result,
				)
			);
			return false;
		}

		$data = array(
			'contactList' => array(
				'list'    => $list,
				'contact' => $contact_id,
				'status'  => '2',
			),
		);

		$result = $api->sync_contact_list( $data );
		if ( $result['success'] ) {
			quillcrm_get_logger()->info(
				__( 'List removed from ActiveCampaign.', 'quillcrm' ),
				array(
					'code' => 'activecampaign_remove_list',
					'data' => array(
						'automation' => array(
							'id'   => $automation->id,
							'name' => $automation->name,
						),
						'step'       => array(
							'id'   => $step->id,
							'type' => $step->type,
						),
						'response'   => $result,
					),
				)
			);
			return true;
		}

		quillcrm_get_logger()->error(
			__( 'Failed to remove list from ActiveCampaign.', 'quillcrm' ),
			array(
				'code' => 'activecampaign_remove_list',
				'data' => array(
					'automation' => array(
						'id'   => $automation->id,
						'name' => $automation->name,
					),
					'step'       => array(
						'id'   => $step->id,
						'type' => $step->type,
					),
					'response'   => $result,
				),
			)
		);
		return false;
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
				'list' => array(
					'type'     => 'string',
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
			'list' => array(
				'type'     => 'api_select',
				'label'    => __( 'List', 'quillcrm' ),
				'endpoint' => 'activecampaign/lists',
			),
		);
	}
}

Remove_List::instance();
