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
	}

	/**
	 * Email Opened Tracking
	 */
	public function email_opened_tracking() {
		if ( ! isset( $_GET['quillcrm'] ) || $_GET['quillcrm'] !== 'email_open' ) {
			return;
		}

		$hash_key       = isset( $_GET['hash_key'] ) ? sanitize_text_field( $_GET['hash_key'] ) : '';
		$campaign_email = Campaign_Email_Model::get_by_hash_key( $hash_key );
	}
}
