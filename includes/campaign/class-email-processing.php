<?php
/**
 * Email Campaign Processing
 * This class is responsible for handling Email campaign processing
 *
 * @since 1.0.0
 * @package QuillCRM
 */

namespace QuillCRM\Campaign;

use QuillCRM\Models\Campaign_Model;
use QuillCRM\Models\Contact_Model;
use QuillCRM\Models\Tracking_Model;
use QuillCRM\QuillCRM;
use QuillCRM\Utils;
use QuillCRM\Abstracts\Abstract_Campaign_Processing;
use QuillCRM\Emails\Emails;
use QuillCRM\Emails\Email_Tracking_Helper;
use QuillCRM\Models\Template_Model;
use QuillCRM\Tracking\Email;
use QuillCRM\Constants\Campaign_Channel;

/**
 * Email Campaign Processing class
 */
class Email_Processing extends Abstract_Campaign_Processing {

	/**
	 * Communication channel
	 *
	 * @var string
	 */
	protected $channel = Campaign_Channel::CHANNEL_EMAIL;

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
		return Tracking_Model::MODE_EMAIL;
	}

	/**
	 * Get recipient field from contact
	 *
	 * @param Contact_Model $contact
	 * @return string|null
	 */
	protected function get_recipient( Contact_Model $contact ) {
		return $contact->email;
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
		$template = null;
		$emails   = null;

		try {
			// Validate recipient email
			if ( ! filter_var( $contact->email, FILTER_VALIDATE_EMAIL ) ) {
				throw new \Exception( "Invalid email address: {$contact->email}" );
			}

			// Get template to access from_email settings early for debugging
			$template = $campaign_message->template;

			// Build complete email message with footer and tracking (using shared helper)
			$complete_message = Email_Tracking_Helper::add_footer_and_tracking(
				$message_data['body'],
				$campaign_message,
				$contact,
				$this->settings
			);

			// Add click tracking to all links (using shared helper with UTM support)
			$complete_message = Email_Tracking_Helper::add_click_tracking(
				$complete_message,
				$campaign_message->hash_key,
				$contact,
				$template
			);

			$emails = new Emails();
			// Set from_email, from_name, and reply_to from template if available
			if ( $template && $template->get_setting( 'from_email' ) ) {
				$emails->from_address = $template->get_setting( 'from_email' );
			}
			if ( $template && $template->get_setting( 'from_name' ) ) {
				$emails->from_name = $template->get_setting( 'from_name' );
			}
			if ( $template && $template->get_setting( 'reply_to' ) ) {
				$emails->reply_to = $template->get_setting( 'reply_to' );
			}

			// Set unsubscribe URL for List-Unsubscribe header (RFC 8058 compliance)
			$emails->unsubscribe_url = add_query_arg(
				array(
					'quillcrm' => 'email_unsubscribe',
					'hash_key' => $campaign_message->hash_key,
				),
				home_url()
			);

			$result = $emails->send(
				$contact->email,
				$message_data['subject'],
				$complete_message
			);

			// Proper result validation - prevent false positives
			if ( is_wp_error( $result ) ) {
				throw new \Exception( 'WP Mail Error: ' . $result->get_error_message() );
			} elseif ( $result === false || $result === null ) {
				throw new \Exception( 'Email sending failed - wp_mail returned false' );
			}

			return array(
				'success'    => true,
				'message_id' => $result,
			);

		} catch ( \Exception $e ) {
			// Enhanced error logging with debugging information
			$debug_info = array(
				'code'                => 'email_send_error',
				'error'               => $e->getMessage(),
				'contact_id'          => $contact->id,
				'campaign_message_id' => $campaign_message->id,
				'recipient'           => $contact->email,
				'template_id'         => $campaign_message->template_id,
				'from_address'        => $emails->from_address ?? 'not set',
				'from_name'           => $emails->from_name ?? 'not set',
				'admin_email'         => get_option( 'admin_email' ),
				'quillsmtp_active'    => class_exists( 'QuillSMTP\\QuillSMTP' ),
				'wp_mail_available'   => function_exists( 'wp_mail' ),
				'template_settings'   => $template ? json_encode( $template->settings ) : 'no template',
			);

			quillcrm_get_logger()->error(
				__( 'Email send error with debug info.', 'quillcrm' ),
				$debug_info
			);

			// Also log to WordPress debug log for immediate visibility
			if ( defined( 'WP_DEBUG_LOG' ) && WP_DEBUG_LOG ) {
				error_log( 'QuillCRM Email Send Error: ' . json_encode( $debug_info ) );
			}

			return array(
				'success' => false,
				'error'   => $e->getMessage(),
				'debug'   => $debug_info,
			);
		}
	}

	/**
	 * Get tracking class
	 *
	 * @return string
	 */
	protected function get_tracking_class() {
		return Email::class;
	}

	/**
	 * Get default max per day
	 *
	 * @return int
	 */
	protected function get_default_max_per_day() {
		return 10000;
	}

	/**
	 * Get default max per second
	 *
	 * @return int
	 */
	protected function get_default_max_per_second() {
		return 15;
	}

	/**
	 * Get default campaign content
	 *
	 * @return string
	 */
	protected function get_default_campaign_content() {
		return method_exists( $this, 'get_default_email_content' )
			? $this->get_default_email_content()
			: sprintf( __( '<p>Hi {{contact:first_name}} {{contact:last_name}},</p><p>Thank you for subscribing to our updates.</p><p><a href="{{contact:unsubscribe_link}}">Unsubscribe</a></p>', 'quillcrm' ) );
	}

	/**
	 * Get default email content
	 *
	 * @return string
	 */
	protected function get_default_email_content() {
		$default_content = sprintf(
			__( '<div><p>Hi {{contact:first_name}} {{contact:last_name}},</p><p>Thank you for subscribing to our updates.</p><p>Don\'t want to stay in the loop? We\'ll be sad to see you go, but you can click here to <a href="{{contact:unsubscribe_link}}" target="_blank">unsubscribe</a>.</p></div>', 'quillcrm' )
		);

		return apply_filters( 'quillcrm_default_email_content', $default_content );
	}
}
