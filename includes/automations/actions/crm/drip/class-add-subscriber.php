<?php
/**
 * Class Add_Subscriber
 *
 * This class is responsible for adding a subscriber to Drip
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
 * Add Subscriber class
 */
class Add_Subscriber extends Action {

	/**
	 * Action Name
	 *
	 * @var string
	 */
	public $name = 'Add Subscriber';

	/**
	 * Action Slug
	 *
	 * @var string
	 */
	public $slug = 'drip_add_subscriber';

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
	public $description = 'This action will add a subscriber to Drip';

	/**
	 * Constructor
	 */
	public function __construct() {
		parent::__construct();
	}

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
		$mapped_fields = $step->get_setting(
			'mapped_fields',
			array(
				'email'      => '',
				'first_name' => '',
				'last_name'  => '',
			)
		);
		$email         = $this->merge_tags_manager->process_merge_tags( $mapped_fields['email'], $automation_contact );
		$first_name    = $this->merge_tags_manager->process_merge_tags( $mapped_fields['first_name'], $automation_contact );
		$last_name     = $this->merge_tags_manager->process_merge_tags( $mapped_fields['last_name'], $automation_contact );
		$data          = array(
			'subscribers' => array(
				array(
					'email'      => $email,
					'first_name' => $first_name,
					'last_name'  => $last_name,
				),
			),
		);

		$drip = Integrations_Manager::instance()->get_integration( 'drip' );
		$api  = $drip->connect();
		if ( ! $api ) {
			return false;
		}

		$result = $api->add_subscriber( $data );

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
				'mapped_fields' => array(
					'type'       => 'object',
					'properties' => array(
						'email'      => array(
							'type'     => 'string',
							'required' => true,
						),
						'first_name' => array(
							'type'     => 'string',
							'required' => false,
						),
						'last_name'  => array(
							'type'     => 'string',
							'required' => false,
						),
					),
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
			'mapped_fields' => array(
				'label'  => __( 'Mapped Fields', 'quillcrm' ),
				'type'   => 'contact_mapped_fields',
				'fields' => array(
					'email'      => array(
						'label' => __( 'Email', 'quillcrm' ),
					),
					'first_name' => array(
						'label' => __( 'First Name', 'quillcrm' ),
					),
					'last_name'  => array(
						'label' => __( 'Last Name', 'quillcrm' ),
					),
				),
			),
		);
	}
}

Actions_Manager::instance()->register( new Add_Subscriber() );
