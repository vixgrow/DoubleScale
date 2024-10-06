<?php
/**
 * Class Add_List
 *
 * This class is responsible for adding list to a contact in ActiveCampaign
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
 * Add List class
 */
class Add_List extends Action {

	/**
	 * Action Name
	 *
	 * @var string
	 */
	public $name = 'Add List';

	/**
	 * Action Slug
	 *
	 * @var string
	 */
	public $slug = 'activecampaign_add_list';

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
	public $description = 'This action will add list to a contact in ActiveCampaign.';

	/**
	 * Is integration
	 *
	 * @var bool
	 */
	public $is_integration = true;

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
			return false;
		}

		$activecampaign = Integrations_Manager::instance()->get_integration( 'activecampaign' );
		$api            = $activecampaign->connect();
		if ( ! $api ) {
			return false;
		}

		$result = $api->get_contact( $automation_contact->contact->email );
		if ( ! $result['success'] ) {
			return false;
		}

		$contact_id = $result['data']['contacts'][0]['id'] ?? null;
		if ( ! $contact_id ) {
			return false;
		}

		$data = array(
			'contactList' => array(
				'list'    => $list,
				'contact' => $contact_id,
				'status'  => '1',
			),
		);

		$result = $api->sync_contact_list( $data );
		if ( $result['success'] ) {
			return true;
		}

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

Actions_Manager::instance()->register( new Add_List() );
