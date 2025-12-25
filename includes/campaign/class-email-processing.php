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
use QuillCRM\Models\Communication_Tracking_Model;
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
	protected $channel = Campaign_Channel::STR_EMAIL;

	/**
	 * Cached merge tag keys for current template
	 *
	 * @var array|null
	 */
	private $template_merge_tag_keys = null;

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
		 return Communication_Tracking_Model::MODE_EMAIL;
	}

	/**
	 * Get channel context for merge tags
	 *
	 * @return string
	 */
	public function get_channel_context() {
		 return 'email';
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
	 * Prepare message content - Override to inject footer during builder rendering
	 *
	 * This method follows the same flow as the parent but adds builder email support:
	 * 1. Prepare footer (with merge tags) before rendering
	 * 2. Render builder content with footer injection
	 * 3. Process all merge tags (body + footer)
	 * 4. Add click tracking and unsubscribe links
	 *
	 * @param Template_Model                                          $template Template model
	 * @param Contact_Model|\QuillCRM\Models\Automation_Contact_Model $contact_or_automation_contact Contact or Automation Contact model
	 * @param Communication_Tracking_Model                            $campaign_message Campaign tracking record
	 * @return array Message data array with subject, body, recipient, hash_key
	 */
	protected function prepare_message_content( $template, $contact_or_automation_contact, Communication_Tracking_Model $campaign_message ) {
		$subject         = $template->subject ?? '';
		$message         = $template->body ?? $this->get_default_campaign_content();
		$add_unsubscribe = $template->get_setting( 'add_unsubscribe', true );

		// Extract actual contact for operations that need Contact_Model
		$contact = $contact_or_automation_contact instanceof \QuillCRM\Models\Automation_Contact_Model
			? $contact_or_automation_contact->contact
			: $contact_or_automation_contact;

		// STEP 1: Extract merge tag keys if not already cached
		if ( is_null( $this->template_merge_tag_keys ) ) {
			$combined_content              = $subject . ' ' . $message;
			$this->template_merge_tag_keys = \QuillCRM\Managers\Merge_Tags_Manager::instance()->extract_merge_tag_keys( $combined_content );
		}

		// STEP 2: Capture merge tag values for this contact using pre-extracted keys
		if ( ! empty( $this->template_merge_tag_keys ) ) {
			\QuillCRM\Models\Communication_Tracking_Meta_Model::capture_merge_tags_from_keys(
				$campaign_message->id,
				$this->template_merge_tag_keys,
				$contact_or_automation_contact
			);
		}

		// Prepare footer HTML before rendering (for builder emails only)
		// Footer contains merge tags that will be processed after rendering
		$footer_html = $this->prepare_footer_html( $message, $contact, $campaign_message );

		// Check if the message is in builder JSON format and render it to HTML
		// Pass footer_html so it gets injected before </body> tag
		// Use the original contact model for merge tags
		// IMPORTANT: Use render_builder_content_with_tracking() to capture conditional section IDs
		$renderer = null;
		$message  = $this->render_builder_content_with_tracking( $message, $contact_or_automation_contact, $campaign_message->id, $renderer, $footer_html );

		// Set channel context for merge tags
		add_filter( 'quillcrm_current_channel_context', array( $this, 'get_channel_context' ), 10 );

		// Process merge tags in both body and footer (if footer was injected)
		// Use the original contact model to support automation merge tags
		$processed_message = \QuillCRM\Managers\Merge_Tags_Manager::instance()->process_merge_tags( $message, $contact_or_automation_contact );
		$processed_subject = \QuillCRM\Managers\Merge_Tags_Manager::instance()->process_merge_tags( $subject, $contact_or_automation_contact );

		// Remove filter to prevent pollution
		remove_filter( 'quillcrm_current_channel_context', array( $this, 'get_channel_context' ), 10 );

		// Add click tracking to URLs in the message (if tracking class supports it)
		$tracking_class = $this->get_tracking_class();
		if ( method_exists( $tracking_class, 'add_click_tracking' ) ) {
			$tracked_message = $tracking_class::add_click_tracking( $processed_message, $campaign_message->hash_key );
		} else {
			$tracked_message = $processed_message;
		}

		// Add unsubscribe link if enabled (if tracking class supports it)
		if ( $add_unsubscribe && method_exists( $tracking_class, 'add_unsubscribe_link' ) ) {
			$tracked_message = $tracking_class::add_unsubscribe_link( $tracked_message, $campaign_message->hash_key );
		}

		return array(
			'subject'   => $processed_subject,
			'body'      => $tracked_message,
			'recipient' => $campaign_message->recipient,
			'hash_key'  => $campaign_message->hash_key,
		);
	}

	/**
	 * Prepare footer HTML for injection into builder emails
	 *
	 * IMPORTANT: This method is called BEFORE merge tags are processed in the body.
	 * We prepare the footer with merge tags here, but they will be processed later
	 * in prepare_message_content() along with the body content.
	 *
	 * @param string                       $message Original message content (JSON for builder, HTML for legacy)
	 * @param Contact_Model                $contact Contact model
	 * @param Communication_Tracking_Model $campaign_message Campaign tracking record
	 * @return string Footer HTML with tracking pixel (or empty if not builder email)
	 */
	private function prepare_footer_html( $message, Contact_Model $contact, Communication_Tracking_Model $campaign_message ) {
		// Check if message is builder format (JSON)
		$decoded          = json_decode( $message, true );
		$is_builder_email = ( json_last_error() === JSON_ERROR_NONE && isset( $decoded['type'] ) && $decoded['type'] === 'builder' );

		// Only prepare footer for builder emails
		// Non-builder emails use the old add_footer_and_tracking() method in send_message()
		if ( ! $is_builder_email ) {
			quillcrm_get_logger()->debug(
				'Skipping footer preparation - not a builder email',
				array(
					'source'   => 'email-campaign-processing',
					'is_json'  => ( json_last_error() === JSON_ERROR_NONE ),
					'has_type' => isset( $decoded['type'] ),
				)
			);
			return '';
		}

		// Get footer content (respecting settings hierarchy)
		if ( ! empty( $this->settings['email_footer'] ) ) {
			$email_footer  = $this->settings['email_footer'];
			$footer_source = 'campaign_settings';
		} else {
			$global_settings = \QuillCRM\Settings::get( 'email', array() );
			// Check if global setting has non-empty footer.
			if ( ! empty( $global_settings['email_footer'] ) ) {
				$email_footer  = $global_settings['email_footer'];
				$footer_source = 'global_settings';
			} else {
				// Use default footer if campaign and global settings are both empty.
				$email_footer  = Email_Tracking_Helper::get_default_footer();
				$footer_source = 'default';
			}
		}

		// Add tracking pixel to footer
		$tracking_pixel = sprintf(
			'<img src="%s" width="1" height="1" style="width:1px;height:1px;" alt="" />',
			home_url( '?quillcrm=email_open&hash_key=' . $campaign_message->hash_key )
		);

		$footer_html = $email_footer . $tracking_pixel;

		// Log footer preparation for debugging
		quillcrm_get_logger()->debug(
			'Prepared footer for builder email',
			array(
				'source'                    => 'email-campaign-processing',
				'footer_source'             => $footer_source,
				'footer_length'             => strlen( $footer_html ),
				'email_footer_length'       => strlen( $email_footer ),
				'has_unsubscribe_merge_tag' => ( strpos( $email_footer, '{{contact:unsubscribe_link}}' ) !== false ),
				'campaign_settings_empty'   => empty( $this->settings['email_footer'] ),
				'global_settings_empty'     => empty( $global_settings['email_footer'] ),
				'email_footer_preview'      => substr( $email_footer, 0, 100 ),
			)
		);

		// Return footer with tracking pixel
		// NOTE: Merge tags in footer will be processed in prepare_message_content()
		// after the builder content is rendered, ensuring consistent processing
		return $footer_html;
	}

	/**
	 * Send message
	 *
	 * @param array                        $message_data Prepared message data
	 * @param Contact_Model                $contact Contact model
	 * @param Communication_Tracking_Model $campaign_message Campaign tracking record
	 * @return array Result array with 'success' boolean and optional data
	 */
	protected function send_message( $message_data, Contact_Model $contact, Communication_Tracking_Model $campaign_message ) {
		$template = null;
		$emails   = null;

		try {
			// Validate recipient email
			if ( ! filter_var( $contact->email, FILTER_VALIDATE_EMAIL ) ) {
				throw new \Exception( "Invalid email address: {$contact->email}" );
			}

			// Get template to access from_email settings early for debugging
			$template = $campaign_message->template;

			// Check if this is a builder email (complete HTML document)
			$is_builder_email = ( strpos( $message_data['body'], '<!DOCTYPE html' ) !== false || strpos( $message_data['body'], '<html' ) !== false );

			// For non-builder emails, add footer and tracking using the old method
			// Builder emails already have footer and tracking pixel injected during render
			if ( ! $is_builder_email ) {
				quillcrm_get_logger()->debug(
					'Using legacy footer method for non-builder email',
					array(
						'source'      => 'email-campaign-processing',
						'contact_id'  => $contact->id,
						'body_length' => strlen( $message_data['body'] ),
					)
				);

				// Build complete email message with footer and tracking (using shared helper)
				$complete_message = Email_Tracking_Helper::add_footer_and_tracking(
					$message_data['body'],
					$campaign_message,
					$contact,
					$this->settings
				);
			} else {
				quillcrm_get_logger()->debug(
					'Builder email detected - footer should already be injected',
					array(
						'source'             => 'email-campaign-processing',
						'contact_id'         => $contact->id,
						'body_length'        => strlen( $message_data['body'] ),
						'has_email_footer'   => ( strpos( $message_data['body'], '<!-- Email Footer -->' ) !== false ),
						'has_tracking_pixel' => ( strpos( $message_data['body'], 'quillcrm=email_open' ) !== false ),
					)
				);

				// Builder email - footer and tracking already injected
				$complete_message = $message_data['body'];
			}

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
