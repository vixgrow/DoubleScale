<?php
/**
 * Class MailerLite Remove From Group
 *
 * This class is responsible for removing a contact from a group in MailerLite
 *
 * @since 1.0.0
 *
 * @package QuillCRM
 */

namespace QuillCRM\Automations\Actions\CRM\MailerLite;

use QuillCRM\Abstracts\Action;
use QuillCRM\Managers\Actions_Manager;
use QuillCRM\Models\Automation_Model;
use QuillCRM\Models\Automation_Step_Model;
use QuillCRM\Models\Automation_Contact_Model;
use QuillCRM\Managers\Integrations_Manager;

/**
 * Remove From Group class
 */
class Remove_From_Group extends Action {

	/**
	 * Action Name
	 *
	 * @var string
	 */
	public $name = 'Remove From Group';

	/**
	 * Action Slug
	 *
	 * @var string
	 */
	public $slug = 'mailerlite_remove_from_group';

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
	public $group = 'mailerlite';

	/**
	 * Action Description
	 *
	 * @var string
	 */
	public $description = 'This action will remove a contact from a group in MailerLite';

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
		$group_id = $step->get_setting( 'group_id' );

		if ( empty( $group_id ) ) {
			quillcrm_get_logger()->error(
				__( 'MailerLite Remove From Group: Group ID is required', 'quillcrm' ),
				array(
					'code' => 'mailerlite_remove_from_group',
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

		$mailerlite = Integrations_Manager::instance()->get_integration( 'mailerlite' );
		$api        = $mailerlite->connect();
		if ( ! $api ) {
			quillcrm_get_logger()->error(
				__( 'MailerLite Remove From Group: API connection failed', 'quillcrm' ),
				array(
					'code' => 'mailerlite_remove_from_group',
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
		$result = $api->get_subscriber( $email );
		if ( ! $result['success'] ) {
			quillcrm_get_logger()->error(
				__( 'MailerLite Remove From Group: Subscriber not found', 'quillcrm' ),
				array(
					'code'     => 'mailerlite_remove_from_group',
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
			return true;
		}

		$subscriber    = $result['data'];
		$subscriber_id = $subscriber['id'];
		$result        = $api->delete_subscriber_from_group( $group_id, $subscriber_id );
		if ( ! $result['success'] ) {
			quillcrm_get_logger()->error(
				__( 'MailerLite Remove From Group: Failed to remove subscriber from group', 'quillcrm' ),
				array(
					'code'     => 'mailerlite_remove_from_group',
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
			__( 'MailerLite Remove From Group: Subscriber removed from group', 'quillcrm' ),
			array(
				'code'     => 'mailerlite_remove_from_group',
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
				'group_id' => array(
					'description' => __( 'Group ID', 'quillcrm' ),
					'type'        => array( 'string', 'integer' ),
					'required'    => true,
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
			'group_id' => array(
				'label'    => __( 'Group ID', 'quillcrm' ),
				'type'     => 'api_select',
				'endpoint' => 'mailerlite/groups',
			),
		);
	}
}

Actions_Manager::instance()->register( new Remove_From_Group() );
