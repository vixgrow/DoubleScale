<?php
/**
 * Class Send_To_Channel
 *
 * This class is responsible for sending a message to a channel in Slack
 *
 * @since 1.0.0
 *
 * @package QuillCRM
 */

namespace QuillCRM\Automations\Actions\CRM\Slack;

use QuillCRM\Abstracts\Action;
use QuillCRM\Managers\Actions_Manager;
use QuillCRM\Models\Automation_Model;
use QuillCRM\Models\Automation_Step_Model;
use QuillCRM\Models\Automation_Contact_Model;
use QuillCRM\Managers\Integrations_Manager;

/**
 * Send To Channel class
 */
class Send_To_Channel extends Action {

	/**
	 * Action Name
	 *
	 * @var string
	 */
	public $name = 'Send To Channel';

	/**
	 * Action Slug
	 *
	 * @var string
	 */
	public $slug = 'slack_send_to_channel';

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
	public $group = 'slack';

	/**
	 * Action Description
	 *
	 * @var string
	 */
	public $description = 'This action will send a message to a channel in Slack.';

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
		$message = $this->merge_tags_manager->process_merge_tags( $step->get_setting( 'message', '' ), $automation_contact );
		$channel = $step->get_setting( 'channel', '' );
		if ( empty( $message ) || empty( $channel ) ) {
			quillcrm_get_logger()->error(
				__( 'Slack Send To Channel action is missing required fields.', 'quillcrm' ),
				array(
					'code' => 'slack_send_to_channel',
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

		$integration = Integrations_Manager::instance()->get_integration( 'slack' );
		$api         = $integration->connect();

		if ( ! $api ) {
			quillcrm_get_logger()->error(
				__( 'Slack Send To Channel action failed to connect to Slack.', 'quillcrm' ),
				array(
					'code' => 'slack_send_to_channel',
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

		$result = $api->post_message( $channel, $message );
		if ( ! $result['success'] ) {
			quillcrm_get_logger()->error(
				__( 'Slack Send To Channel action failed to send message.', 'quillcrm' ),
				array(
					'code'     => 'slack_send_to_channel',
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
			__( 'Slack Send To Channel action sent message.', 'quillcrm' ),
			array(
				'code'     => 'slack_send_to_channel',
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
				'message' => array(
					'type'     => 'string',
					'required' => true,
				),
				'channel' => array(
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
			'channel' => array(
				'type'     => 'api_select',
				'label'    => __( 'Channel', 'quillcrm' ),
				'endpoint' => 'slack/conversations',
			),
			'message' => array(
				'type'  => 'textarea',
				'label' => __( 'Message', 'quillcrm' ),
			),
		);
	}
}

Actions_Manager::instance()->register( new Send_To_Channel() );
