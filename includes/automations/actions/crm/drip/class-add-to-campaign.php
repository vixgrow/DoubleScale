<?php
/**
 * Class Add_To_Campaign
 *
 * This class is responsible for adding a subscriber to a Drip campaign
 *
 * @since 1.0.0
 *
 * @package QuillCRM
 */

namespace QuillCRM\Automations\Actions\CRM\Drip;

use QuillCRM\Abstracts\Action;
use QuillCRM\Managers\Actions_Manager;
use QuillCRM\Models\Automation_Model;
use QuillCRM\Models\Automation_Step_Model;
use QuillCRM\Models\Automation_Contact_Model;
use QuillCRM\Managers\Integrations_Manager;

/**
 * Add To Campaign class
 */
class Add_To_Campaign extends Action {

	/**
	 * Action Name
	 *
	 * @var string
	 */
	public $name = 'Add To Campaign';

	/**
	 * Action Slug
	 *
	 * @var string
	 */
	public $slug = 'drip_add_to_campaign';

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
	public $group = 'drip';

	/**
	 * Action Description
	 *
	 * @var string
	 */
	public $description = 'This action will add a subscriber to a Drip campaign.';

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
				__( 'Drip Campaign ID is required.', 'quillcrm' ),
				array(
					'code' => 'drip_add_to_campaign',
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

		$email = $automation_contact->contact->email;
		$data  = array(
			'subscribers' => array(
				array(
					'email' => $email,
				),
			),
		);

		$drip = Integrations_Manager::instance()->get_integration( 'drip' );
		$api  = $drip->connect();
		if ( ! $api ) {
			quillcrm_get_logger()->error(
				__( 'Drip API connection failed.', 'quillcrm' ),
				array(
					'code' => 'drip_connect',
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

		$result = $api->add_subscriber_to_campaign( $campaign_id, $data );
		if ( ! $result['success'] ) {
			quillcrm_get_logger()->error(
				__( 'Failed to add subscriber to Drip Campaign.', 'quillcrm' ),
				array(
					'code'     => 'drip_add_to_campaign',
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

		quillcrm_get_logger()->info(
			__( 'Subscriber added to Drip Campaign.', 'quillcrm' ),
			array(
				'code' => 'drip_add_to_campaign',
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
				'endpoint' => 'drip/campaigns',
			),
		);
	}
}

Add_To_Campaign::instance();

