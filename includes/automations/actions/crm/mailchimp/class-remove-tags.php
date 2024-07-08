<?php
/**
 * Class Remove Tags
 *
 * This class is responsible for removing tags to a contact in Mailchimp
 *
 * @since 1.0.0
 *
 * @package QuillCRM
 */

namespace QuillCRM\Automations\Actions\CRM\Mailchimp;

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
	public $slug = 'mailchimp_remove_tags';

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
	public $group = 'mailchimp';

	/**
	 * Action Description
	 *
	 * @var string
	 */
	public $description = 'This action will remove tags to a contact in Mailchimp.';

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
		$tags = $step->get_setting( 'tags', array() );
		if ( empty( $tags ) ) {
			return false;
		}

		$mailchimp = Integrations_Manager::instance()->get_integration( 'mailchimp' );
		$api       = $mailchimp->connect();
		if ( ! $api ) {
			return false;
		}

		$data = array();

		foreach ( $tags as $tag ) {
			$data['tags'][] = array(
				'name'   => $tag,
				'status' => 'inactive',
			);
		}

		$email  = $automation_contact->contact->email;
		$result = $api->remove_tags( $list, $email, $data );
		$result = $api->remove_subscriber( $list, $email );
		if ( ! $result['success'] ) {
			return false;
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
				'list' => array(
					'type'     => 'string',
					'required' => true,
				),
				'tags' => array(
					'type'  => 'array',
					'items' => array(
						'type' => 'string',
					),
				),
			),
		);
	}
}

Actions_Manager::instance()->register( new Remove_Tags() );
