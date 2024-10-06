<?php
/**
 * Class Add_Tags
 *
 * This class is responsible for adding tags to a contact in Convertkit
 *
 * @since 1.0.0
 *
 * @package QuillCRM
 */

namespace QuillCRM\Automations\Actions\CRM\Convertkit;

use QuillCRM\Abstracts\Action;
use QuillCRM\Managers\Actions_Manager;
use QuillCRM\Models\Automation_Model;
use QuillCRM\Models\Automation_Step_Model;
use QuillCRM\Models\Automation_Contact_Model;
use QuillCRM\Managers\Integrations_Manager;

/**
 * Add Tags class
 */
class Add_Tags extends Action {

	/**
	 * Action Name
	 *
	 * @var string
	 */
	public $name = 'Add Tags';

	/**
	 * Action Slug
	 *
	 * @var string
	 */
	public $slug = 'convertkit_add_tags';

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
	public $group = 'convertkit';

	/**
	 * Action Description
	 *
	 * @var string
	 */
	public $description = 'This action will add tags to a subscriber in Convertkit.';

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

		$convertkit = Integrations_Manager::instance()->get_integration( 'convertkit' );
		$api        = $convertkit->connect();
		if ( ! $api ) {
			return false;
		}

		$data = array(
			'email' => $automation_contact->contact->email,
		);

		foreach ( $tags as $tag ) {
			$result = $api->add_subscriber_tag( $tag, $data );
		}

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

Actions_Manager::instance()->register( new Add_Tags() );
