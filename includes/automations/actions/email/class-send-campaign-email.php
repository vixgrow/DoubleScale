<?php


/**
 * Send Campaign Email
 *
 * @since 1.0.0
 *
 * @package QuillCRM
 */

namespace QuillCRM\Automations\Actions\Email;

use QuillCRM\Abstracts\Action;
use QuillCRM\Managers\Actions_Manager;
use QuillCRM\Models\Automation_Model;
use QuillCRM\Models\Automation_Step_Model;
use QuillCRM\Models\Automation_Contact_Model;
use QuillCRM\Managers\Integrations_Manager;
use QuillCRM\Models\Campaign_Model;

class Send_Campaign_Email extends Action {






	/**
	 * Action Name
	 *
	 * @var string
	 */
	public $name = 'Send Campaign Email';

	/**
	 * Action Slug
	 *
	 * @var string
	 */
	public $slug = 'send_campaign_email';

	/**
	 * Action Description
	 *
	 * @var string
	 */
	public $description = 'This action will send a campaign email to the contact.';

	/**
	 * Action Attributes
	 *
	 * @var array
	 */
	public $attributes = array();

	/**
	 * Source
	 *
	 * @var string
	 */
	public $source = 'email';

	/**
	 * Tigger Group
	 *
	 * @var string
	 */
	public $group = 'email';

	/**
	 * Process Action
	 *
	 * @since 1.0.0
	 *
	 * @param Automation_Model         $automation Automation Model.
	 * @param Automation_Step_Model    $step Automation Step Model.
	 * @param Automation_Contact_Model $contact Contact Model.
	 */
	public function process_action( Automation_Model $automation, Automation_Step_Model $step, Automation_Contact_Model $automation_contact ) {
		return true;
	}

	/**
	 * Get fields
	 *
	 * @since 1.0.0
	 *
	 * @return array
	 */
	public function get_fields() {
		return array(
			'internal_label'       => array(
				'label' => __( 'Internal Label', 'quillcrm' ),
				'type'  => 'text',
			),
			'internal_description' => array(
				'label' => __( 'Internal Description', 'quillcrm' ),
				'type'  => 'text',
			),
			'campaign_id'          => array(
				'label'   => __( 'Campaign', 'quillcrm' ),
				'type'    => 'select',
				'options' => $this->get_campaign_options(),
			),
		);
	}

	/**
	 * Get attributes schema
	 *
	 * @return array
	 */
	public function get_attributes_schema() {
		return array(
			'type'        => 'object',
			'properties'  => array(
				'internal_label'       => array(
					'type'     => 'string',
					'required' => true,
				),
				'internal_description' => array(
					'type'     => 'string',
					'required' => true,
				),
			),
			'campaign_id' => array(
				'type'     => 'integer',
				'required' => true,
			),
		);
	}

	/**
	 * Get options for campaign
	 *
	 * @return array
	 */
	public function get_campaign_options() {
		$campaigns = Campaign_Model::all();
		return wp_list_pluck( $campaigns->toArray(), 'name', 'id' );
	}
}

Send_Campaign_Email::instance();
