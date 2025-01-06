<?php
/**
 * Class Remove_From_Campaign
 *
 * This class is responsible for removing a contact from a Mautic campaign
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
 * Remove From Campaign class
 */
class Remove_From_Campaign extends Action {

	/**
	 * Action Name
	 *
	 * @var string
	 */
	public $name = 'Remove From Campaign';

	/**
	 * Action Slug
	 *
	 * @var string
	 */
	public $slug = 'mautic_remove_from_campaign';

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
	public $description = 'This action will remove a contact from a Mautic campaign.';

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
		$campaign_id = $step->get_setting( 'campaign_id', '' );
		if ( empty( $campaign_id ) ) {
			quillcrm_get_logger()->error(
				__( 'Mautic Remove From Campaign action is missing campaign_id setting.', 'quillcrm' ),
				array(
					'code' => 'mautic_remove_from_campaign',
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

		$email  = $automation_contact->contact->email;
		$data   = array(
			'email'     => $email,
			'firstname' => $automation_contact->contact->first_name,
			'lastname'  => $automation_contact->contact->last_name,
		);
		$mautic = Integrations_Manager::instance()->get_integration( 'mautic' );
		$api    = $mautic->connect();
		if ( ! $api ) {
			quillcrm_get_logger()->error(
				__( 'Mautic Remove From Campaign: Could not connect to Mautic.', 'quillcrm' ),
				array(
					'code' => 'mautic_remove_from_campaign',
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

		$result = $api->get_or_create_contact( $data );
		if ( ! $result['success'] ) {
			quillcrm_get_logger()->error(
				__( 'Mautic Remove From Campaign: Could not get or create contact.', 'quillcrm' ),
				array(
					'code'     => 'mautic_remove_from_campaign',
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

		$contact_id = isset( $result['data']['contact'] ) ? $result['data']['contact']['id'] : $result['data']['id'];
		$result     = $api->remove_contact_from_campaign( $contact_id, $campaign_id );
		if ( ! $result['success'] ) {
			quillcrm_get_logger()->error(
				__( 'Mautic Remove From Campaign: Could not remove contact from campaign.', 'quillcrm' ),
				array(
					'code'     => 'mautic_remove_from_campaign',
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
			__( 'Mautic Remove From Campaign: Contact removed from campaign.', 'quillcrm' ),
			array(
				'code'     => 'mautic_remove_from_campaign',
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
				'campaign_id' => array(
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
			'campaign_id' => array(
				'type'     => 'api_select',
				'label'    => __( 'Campaign', 'quillcrm' ),
				'endpoint' => 'mautic/campaigns',
			),
		);
	}
}

Actions_Manager::instance()->register( new Remove_From_Campaign() );
