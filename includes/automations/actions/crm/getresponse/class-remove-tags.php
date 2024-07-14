<?php
/**
 * Class Remove_Tags
 *
 * This class is responsible for removing tags to a contact in GetResponse
 *
 * @since 1.0.0
 *
 * @package QuillCRM
 */

namespace QuillCRM\Automations\Actions\CRM\GetResponse;

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
	public $slug = 'getresponse_remove_tags';

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
	public $group = 'getresponse';

	/**
	 * Action Description
	 *
	 * @var string
	 */
	public $description = 'This action will remove tags to a contact in GetResponse';

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
		$tags    = $step->get_setting( 'tags', array() );
		$list_id = $this->merge_tags_manager->process_merge_tags( $step->get_setting( 'list_id' ), $automation_contact );

		if ( empty( $list_id ) ) {
			return false;
		}

		if ( empty( $tags ) ) {
			return false;
		}

		$getresponse = Integrations_Manager::instance()->get_integration( 'getresponse' );
		$api         = $getresponse->connect();
		if ( ! $api ) {
			return false;
		}

		$email = $automation_contact->contact->email;
		$data  = array(
			'campaign' => array(
				'campaignId' => $list_id,
			),
		);

		$result  = $api->get_or_create_contact( $email );
		$contact = $result['data'];
		if ( empty( $contact ) ) {
			return false;
		}

		$old_tags = array();
		if ( ! empty( $contact['tags'] ) ) {
			foreach ( $contact['tags'] as $tag ) {
				$old_tags[] = $tag['tagId'];
			}
		}

		$tags         = array_diff( $old_tags, $tags );
		$data['tags'] = array();
		foreach ( $tags as $tag ) {
			$data['tags'][] = array(
				'tagId' => $tag,
			);
		}
		$result = $api->create_or_update_contact( $email, $data );

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
				'tags'    => array(
					'type'  => 'array',
					'items' => array(
						'type' => 'string',
					),
				),
				'list_id' => array(
					'type' => 'string',
				),
			),
		);
	}
}

Actions_Manager::instance()->register( new Remove_Tags() );
