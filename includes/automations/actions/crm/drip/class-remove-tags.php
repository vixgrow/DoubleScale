<?php
/**
 * Class Remove_Tags
 *
 * This class is responsible for removeing tags to a Drip subscriber
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
 * Remove Tags class
 */
class Remove_Tags extends Action {

	/**
	 * Action Name
	 *
	 * @var string
	 */
	public $name = 'Remove Tags';

	/**
	 * Action Slug
	 *
	 * @var string
	 */
	public $slug = 'drip_remove_tags';

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
	public $description = 'This action will remove tags to a Drip subscriber.';

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
		$tags = $step->get_setting( 'tags', array() );
		if ( empty( $tags ) ) {
			return false;
		}

		$email = $automation_contact->contact->email;
		$data  = array(
			'subscribers' => array(
				array(
					'email' => $email,
					'tags'  => $tags,
				),
			),
		);

		$drip = Integrations_Manager::instance()->get_integration( 'drip' );
		$api  = $drip->connect();
		if ( ! $api ) {
			return false;
		}

		$result = $api->remove_subscriber( $data );

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
				'tags' => array(
					'type'  => 'array',
					'items' => array(
						'type' => 'string',
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
			'tags' => array(
				'type'     => 'api_select',
				'label'    => __( 'Tags', 'quillcrm' ),
				'endpoint' => 'convertkit/tags',
				'multiple' => true,
			),
		);
	}
}

Actions_Manager::instance()->register( new Remove_Tags() );
