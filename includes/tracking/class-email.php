<?php
/**
 * Class Email Tracking
 * This class is responsible for handling the Email Tracking
 *
 * @since 1.0.0
 *
 * @package QuillCRM
 */

namespace QuillCRM\Tracking;

use QuillCRM\Models\Campaign_Email_Model;
use QuillCRM\Models\Contact_Model;

/**
 * Email Tracking
 */
class Email {

	/**
	 * Class Instance.
	 *
	 * @since 1.0.0
	 *
	 * @var Email
	 */
	private static $instance;

	/**
	 * Email Instance.
	 *
	 * Instantiates or reuses an instance of Email.
	 *
	 * @since  1.0.0
	 *
	 * @return Email
	 */
	public static function instance() {
		if ( is_null( self::$instance ) ) {
			self::$instance = new self();
		}

		return self::$instance;
	}

	/**
	 * Email Tracking
	 */
	public function __construct() {
		add_action( 'quillcrm_loaded', array( $this, 'init' ) );
	}

	/**
	 * Init
	 */
	public function init() {
		$this->email_opened_tracking();
		$this->email_clicked_tracking();
	}

	/**
	 * Email Opened Tracking
	 */
	public function email_opened_tracking() {
		try {
			if ( ! isset( $_GET['quillcrm'] ) || $_GET['quillcrm'] !== 'email_open' ) {
				return;
			}

			$hash_key       = isset( $_GET['hash_key'] ) ? sanitize_text_field( $_GET['hash_key'] ) : '';
			$campaign_email = Campaign_Email_Model::get_by_hash_key( $hash_key );

			if ( ! $campaign_email ) {
				return;
			}

			// Update the email status
			$campaign_email->update(
				array(
					'opened'    => 1,
					'opened_at' => current_time( 'mysql' ),
				)
			);

			// Send the pixel
			header( 'Content-Type: image/gif' );
			header( 'Content-Length: 43' );
			header( 'Cache-Control: private, no-cache, no-cache=Set-Cookie, proxy-revalidate' );
			header( 'Expires: Wed, 11 Jan 1984 05:00:00 GMT' );
			header( 'Last-Modified: Wed, 11 Jan 1984 05:00:00 GMT' );
			header( 'Pragma: no-cache' );
			die( base64_decode( 'R0lGODlhAQABAIAAAP///wAAACwAAAAAAQABAAACAkQBADs=' ) );
		} catch ( \Exception $e ) {
			return;
		}
	}

	/**
	 * Email Clicked Tracking
	 */
	public function email_clicked_tracking() {
		try {
			if ( ! isset( $_GET['quillcrm'] ) || $_GET['quillcrm'] !== 'email_click' ) {
				return;
			}

			$hash_key       = isset( $_GET['hash_key'] ) ? sanitize_text_field( $_GET['hash_key'] ) : '';
			$campaign_email = Campaign_Email_Model::get_by_hash_key( $hash_key );

			if ( ! $campaign_email ) {
				return;
			}

			// Update the email status
			$campaign_email->update(
				array(
					'clicked'    => 1,
					'clicked_at' => current_time( 'mysql' ),
				)
			);

			if ( ! $campaign_email->opened ) {
				$campaign_email->update(
					array(
						'opened'    => 1,
						'opened_at' => current_time( 'mysql' ),
					)
				);
			}

			$orginal_url = urldecode( $_GET['orginal'] );
			error_log( $orginal_url );
			wp_redirect( $orginal_url );
			exit;
		} catch ( \Exception $e ) {
			return;
		}
	}
}
