<?php
/**
 * Class Twilio Send Message
 *
 * This class is responsible for sending a message using Twilio
 *
 * @since 1.0.0
 *
 * @package QuillCRM
 */

namespace QuillCRM\Automations\Actions\CRM\Twilio;

use QuillCRM\Abstracts\Action;
use QuillCRM\Managers\Actions_Manager;
use QuillCRM\Models\Automation_Model;
use QuillCRM\Models\Automation_Step_Model;
use QuillCRM\Models\Automation_Contact_Model;
use QuillCRM\Managers\Integrations_Manager;

/**
 * Twilio Send Message class
 */
class Send_Message extends Action {

	/**
	 * Action Name
	 *
	 * @var string
	 */
	public $name = 'Send Message';

	/**
	 * Action Slug
	 *
	 * @var string
	 */
	public $slug = 'twilio_send_message';

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
	public $group = 'twilio';

	/**
	 * Action Description
	 *
	 * @var string
	 */
	public $description = 'This action will send a message using Twilio';

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
		$message      = $this->merge_tags_manager->process_merge_tags( $step->get_setting( 'message', '' ), $automation_contact );
		$to           = $this->merge_tags_manager->process_merge_tags( $step->get_setting( 'to', '' ), $automation_contact );
		$media_url    = $this->merge_tags_manager->process_merge_tags( $step->get_setting( 'media_url', '' ), $automation_contact );
		$add_utm      = $step->get_setting( 'add_utm', false );
		$utm_source   = $this->merge_tags_manager->process_merge_tags( $step->get_setting( 'utm_source', '' ), $automation_contact );
		$utm_medium   = $this->merge_tags_manager->process_merge_tags( $step->get_setting( 'utm_medium', '' ), $automation_contact );
		$utm_campaign = $this->merge_tags_manager->process_merge_tags( $step->get_setting( 'utm_campaign', '' ), $automation_contact );
		$utm_term     = $this->merge_tags_manager->process_merge_tags( $step->get_setting( 'utm_term', '' ), $automation_contact );

		if ( empty( $message ) || empty( $to ) ) {
			return false;
		}

		$twilio = Integrations_Manager::instance()->get_integration( 'twilio' );
		$api    = $twilio->connect();

		if ( ! $api ) {
			return false;
		}

		$data = array(
			'Body' => $message,
			'To'   => $to,
		);

		if ( ! empty( $media_url ) ) {
			$data['MediaUrl'] = $media_url;
		}

		if ( $add_utm ) {
			$data['Body'] .= ' ' . $this->add_utm( $utm_source, $utm_medium, $utm_campaign, $utm_term );
		}

		$result = $api->send_sms( $data );

		return $result['success'];
	}

	/**
	 * Add UTM
	 *
	 * @param string $utm_source UTM Source.
	 * @param string $utm_medium UTM Medium.
	 * @param string $utm_campaign UTM Campaign.
	 * @param string $utm_term UTM Term.
	 *
	 * @return string
	 */
	public function add_utm( $utm_source, $utm_medium, $utm_campaign, $utm_term ) {
		$utm = '';

		if ( ! empty( $utm_source ) ) {
			$utm .= 'utm_source=' . $utm_source;
		}

		if ( ! empty( $utm_medium ) ) {
			$utm .= '&utm_medium=' . $utm_medium;
		}

		if ( ! empty( $utm_campaign ) ) {
			$utm .= '&utm_campaign=' . $utm_campaign;
		}

		if ( ! empty( $utm_term ) ) {
			$utm .= '&utm_term=' . $utm_term;
		}

		return $utm;
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
				'message'      => array(
					'type'     => 'string',
					'required' => true,
				),
				'to'           => array(
					'type'     => 'string',
					'required' => true,
				),
				'media_url'    => array(
					'type'     => 'string',
					'required' => false,
				),
				'add_utm'      => array(
					'type'     => 'boolean',
					'required' => false,
				),
				'utm_source'   => array(
					'type'     => 'string',
					'required' => false,
				),
				'utm_medium'   => array(
					'type'     => 'string',
					'required' => false,
				),
				'utm_campaign' => array(
					'type'     => 'string',
					'required' => false,
				),
				'utm_term'     => array(
					'type'     => 'string',
					'required' => false,
				),
			),
		);
	}
}

Actions_Manager::instance()->register( new Send_Message() );
