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
use QuillCRM\Models\Template_Model;
use QuillCRM\Models\Link_Trigger_Model;
use QuillCRM\Managers\Merge_Tags_Manager;

/**
 * Email Campaign Processing class
 */
class Email_Processing extends Abstract_Campaign_Processing {

	/**
	 * Campaign type
	 *
	 * @var string
	 */
	protected $campaign_type = 'email';

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

			// Build email message first
			$email_message = $this->build_email_message( $campaign_message, $contact, $message_data['body'] );

			// Build complete email message with footer
			$complete_message = sprintf(
				'%s%s',
				$email_message,
				$this->build_email_footer( $campaign_message, $contact )
			);

			// Add click tracking to all links (specific to email) and UTM parameters
			$complete_message = $this->add_email_click_tracking( $complete_message, $campaign_message->hash_key, $contact, $template );

			$emails = new Emails();
						// Set from_email and from_name from template if available
			if ( $template && $template->get_setting( 'from_email' ) ) {
				$emails->from_address = $template->get_setting( 'from_email' );
			}
			if ( $template && $template->get_setting( 'from_name' ) ) {
				$emails->from_name = $template->get_setting( 'from_name' );
			}
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
		return \QuillCRM\Tracking\Email::class;
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
	 * Build email message
	 *
	 * @param Tracking_Model $campaign_email
	 * @param Contact_Model  $contact
	 * @param string         $message
	 * @return string
	 */
	protected function build_email_message( Tracking_Model $campaign_email, Contact_Model $contact, $message = '' ) {
		// Note: Tracking pixel is added in build_email_footer() to avoid duplication
		return $message;
	}

	/**
	 * Build email footer
	 *
	 * @param Tracking_Model $campaign_email
	 * @param Contact_Model  $contact
	 * @return string
	 */
	protected function build_email_footer( Tracking_Model $campaign_email, Contact_Model $contact ) {
		$footer = '';

		// Add tracking pixel 1x1 for email open tracking
		// Note: This is the ONLY place where the tracking pixel should be added
		// to avoid duplicate pixels that could cause double-counting of opens
		$footer .= sprintf(
			'<img src="%s" width="1" height="1" style="width:1px;height:1px;" />',
			home_url( '?quillcrm=email_open&hash_key=' . $campaign_email->hash_key )
		);

			$email_footer = $this->settings['email_footer'] ?? $this->default_email_footer();
			$footer      .= $email_footer;

		return $footer;
	}

	/**
	 * Default email footer
	 *
	 * @return string
	 */
	protected function default_email_footer() {
		return "<p>Don't want to stay in the loop? We'll be sad to see you go, but you can click here to <a href='{{contact:unsubscribe_link}}'>unsubscribe</a>.</p>";
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

	/**
	 * Add click tracking to all links (Email-specific)
	 *
	 * @param string              $message Email message
	 * @param string              $hash_key Campaign email hash key
	 * @param Contact_Model       $contact Contact model
	 * @param Template_Model|null $template Template model for UTM parameters
	 * @return string
	 */
	protected function add_email_click_tracking( $message, $hash_key, Contact_Model $contact, $template = null ) {
		// Match all links
		preg_match_all( '/<a[^>]+href=([\'"])(?<href>.+?)\1[^>]*>/i', $message, $matches );

		if ( ! isset( $matches['href'] ) ) {
			return $message;
		}

		foreach ( $matches['href'] as $key => $href ) {
			// Check if link trigger quillcrm-link-trigger.
			if ( false !== strpos( $href, 'quillcrm-link-trigger' ) ) {
				// Get query string
				$query_string = parse_url( $href, PHP_URL_QUERY );
				parse_str( $query_string, $query_args );

				// Get link trigger hash
				$hash         = $query_args['quillcrm-link-trigger'] ?? '';
				$link_trigger = Link_Trigger_Model::where( 'hash', $hash )->first();
				if ( ! $link_trigger ) {
					continue;
				}

				$link_trigger_url = $this->configure_link_trigger_url( $link_trigger, $contact, $hash_key );

				// Replace original link with click tracking link
				$to_replace = $matches[0][ $key ];
				$message    = str_replace( $to_replace, str_replace( $href, $link_trigger_url, $to_replace ), $message );
				continue;
			}

			// Add UTM parameters to the original URL if enabled
			$original_url = $href;
			if ( $template && $template->get_setting( 'enable_utm', false ) ) {
				$original_url = $this->add_utm_parameters( $original_url, $template );
			}

			// Add click original link to click tracking
			$click_url = add_query_arg(
				array(
					'quillcrm' => 'email_click',
					'hash_key' => $hash_key,
					'original' => urlencode( $original_url ),
				),
				home_url()
			);

			// Replace original link with click tracking link
			$to_replace = $matches[0][ $key ];
			$message    = str_replace( $to_replace, str_replace( $href, $click_url, $to_replace ), $message );
		}

		return $message;
	}

	/**
	 * Add UTM parameters to URL
	 *
	 * @param string         $url Original URL
	 * @param Template_Model $template Template with UTM settings
	 * @return string URL with UTM parameters added
	 */
	protected function add_utm_parameters( $url, $template ) {
		// Skip if URL is empty or not a valid external URL
		if ( empty( $url ) || strpos( $url, 'mailto:' ) === 0 || strpos( $url, 'tel:' ) === 0 || strpos( $url, '#' ) === 0 ) {
			return $url;
		}

		// Get UTM parameters from template settings
		$utm_params = array();

		if ( $utm_source = $template->get_setting( 'utm_source' ) ) {
			$utm_params['utm_source'] = $utm_source;
		}

		if ( $utm_medium = $template->get_setting( 'utm_medium' ) ) {
			$utm_params['utm_medium'] = $utm_medium;
		}

		if ( $utm_campaign = $template->get_setting( 'utm_campaign' ) ) {
			$utm_params['utm_campaign'] = $utm_campaign;
		}

		if ( $utm_term = $template->get_setting( 'utm_term' ) ) {
			$utm_params['utm_term'] = $utm_term;
		}

		if ( $utm_content = $template->get_setting( 'utm_content' ) ) {
			$utm_params['utm_content'] = $utm_content;
		}

		// Only add parameters if we have at least source, medium, and campaign
		if ( empty( $utm_params['utm_source'] ) || empty( $utm_params['utm_medium'] ) || empty( $utm_params['utm_campaign'] ) ) {
			return $url;
		}

		// Add UTM parameters to the URL
		return add_query_arg( $utm_params, $url );
	}

	/**
	 * Configure link trigger url
	 *
	 * @param Link_Trigger_Model $link_trigger
	 * @param Contact_Model      $contact
	 * @param string             $hash_key
	 * @return string
	 */
	protected function configure_link_trigger_url( Link_Trigger_Model $link_trigger, Contact_Model $contact, $hash_key ) {
		$auto_login    = $link_trigger->get_setting( 'auto_login', true );
		$contact_email = $contact->email;
		$user          = get_user_by( 'email', $contact_email );
		$args          = array(
			'quillcrm-link-trigger' => $link_trigger->hash,
			'track-id'              => $hash_key,
		);

		if ( $auto_login && $user ) {
			$args['auth-id'] = wp_hash_password( $contact_email );
		}

		$link_trigger_url = add_query_arg( $args, home_url() );

		return $link_trigger_url;
	}
}
