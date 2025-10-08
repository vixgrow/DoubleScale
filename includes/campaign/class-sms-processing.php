<?php
/**
 * SMS Campaign Processing
 * This class is responsible for handling SMS campaign processing
 *
 * @since 1.0.0
 * @package QuillCRM
 */

namespace QuillCRM\Campaign;

use QuillCRM\Models\Campaign_Model;
use QuillCRM\Models\Contact_Model;
use QuillCRM\Models\Tracking_Model;
use QuillCRM\QuillCRM;
use QuillCRM\Abstracts\Abstract_Campaign_Processing;
use QuillCRM\Tracking\SMS as SMS_Tracking;

/**
 * SMS Campaign Processing class
 */
class SMS_Processing extends Abstract_Campaign_Processing {

	/**
	 * Communication channel
	 *
	 * @var string
	 */
	protected $channel = 'sms';

	/**
	 * Add hooks
	 *
	 * @return void
	 */
	public function add_hooks() {
		$this->register_campaign_processing_hooks();
	}

	/**
	 * Get campaign message mode
	 *
	 * @return int
	 */
	protected function get_message_mode() {
		return Tracking_Model::MODE_SMS;
	}

	/**
	 * Get recipient field from contact
	 *
	 * @param Contact_Model $contact
	 * @return string|null
	 */
	protected function get_recipient( Contact_Model $contact ) {
		return $contact->phone;
	}

	/**
	 * Send message
	 *
	 * @param array          $message_data Prepared message data
	 * @param Contact_Model  $contact Contact model
	 * @param Tracking_Model $campaign_message Campaign tracking record
	 * @return array Result array with 'success' boolean and optional data
	 */
	protected function send_message( $message_data, Contact_Model $contact, Tracking_Model $campaign_message ) {
		return $this->send_via_provider( $message_data, $contact, $campaign_message );
	}

	/**
	 * Get tracking class
	 *
	 * @return string
	 */
	protected function get_tracking_class() {
		return SMS_Tracking::class;
	}

	/**
	 * Get default max per day
	 *
	 * @return int
	 */
	protected function get_default_max_per_day() {
		return 1000;
	}

	/**
	 * Get default max per second
	 *
	 * @return int
	 */
	protected function get_default_max_per_second() {
		return 10;
	}

	/**
	 * Get default campaign content
	 *
	 * @return string
	 */
	protected function get_default_campaign_content() {
		return sprintf( __( 'Hi {{contact:first_name}}, thank you for subscribing! Reply STOP to unsubscribe.', 'quillcrm' ) );
	}

}
