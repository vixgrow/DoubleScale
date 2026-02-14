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

use QuillCRM\Models\Communication_Tracking_Model;
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
	 * Handles tracking for all email types: Campaign, Automation, and Individual
	 */
	public function email_opened_tracking() {
		try {
			if ( ! isset( $_GET['quillcrm'] ) || $_GET['quillcrm'] !== 'email_open' ) {
				return;
			}

			$hash_key       = isset( $_GET['hash_key'] ) ? sanitize_text_field( $_GET['hash_key'] ) : '';
			$tracking_entry = Communication_Tracking_Model::where( 'hash_key', $hash_key )
				->where( 'mode', Communication_Tracking_Model::MODE_EMAIL )
				->first();

			if ( ! $tracking_entry ) {
				return;
			}

			// Update the email tracking status
			$tracking_entry->update(
				array(
					'opened'    => 1,
					'opened_at' => current_time( 'mysql' ),
				)
			);
			 do_action( 'quillcrm_email_opened', $tracking_entry->contact );

			 // Send the pixel
			 header( 'Content-Type: image/gif' );
			 header( 'Content-Length: 43' );
			 header( 'Cache-Control: private, no-cache, no-cache=Set-Cookie, proxy-revalidate' );
			 header( 'Expires: Wed, 11 Jan 1984 05:00:00 GMT' );
			 header( 'Last-Modified: Wed, 11 Jan 1984 05:00:00 GMT' );
			 header( 'Pragma: no-cache' );
			 die( base64_decode( 'R0lGODlhAQABAIAAAP///wAAACwAAAAAAQABAAACAkQBADs=' ) );
		} catch ( \Exception $e ) {
			quillcrm_get_logger()->error(
				__( 'Email Opened Tracking Error', 'quillcrm' ),
				array(
					'code'  => 'email_opened_tracking',
					'error' => array(
						'message' => $e->getMessage(),
						'code'    => $e->getCode(),
						'data'    => $e->getTrace(),
					),
				)
			);
			return;
		}
	}

	/**
	 * Email Clicked Tracking
	 * Handles tracking for all email types: Campaign, Automation, and Individual
	 */
	public function email_clicked_tracking() {
		try {
			if ( ! isset( $_GET['quillcrm'] ) || $_GET['quillcrm'] !== 'email_click' ) {
				return;
			}

			if ( ! isset( $_GET['hash_key'] ) || ! isset( $_GET['original'] ) ) {
				return;
			}

			$hash_key       = sanitize_text_field( $_GET['hash_key'] );
			$tracking_entry = Communication_Tracking_Model::where( 'hash_key', $hash_key )
				->where( 'mode', Communication_Tracking_Model::MODE_EMAIL )
				->first();

			if ( ! $tracking_entry ) {
				return;
			}

			// Update the email tracking status
			$tracking_entry->update(
				array(
					'clicked'    => 1,
					'clicked_at' => current_time( 'mysql' ),
				)
			);

			  // If email was clicked but not opened, mark as opened too
			if ( ! $tracking_entry->opened ) {
				$tracking_entry->update(
					array(
						'opened'    => 1,
						'opened_at' => current_time( 'mysql' ),
					)
				);
			}

			  do_action( 'quillcrm_email_clicked', $tracking_entry->contact );

			  $original_url = urldecode( $_GET['original'] );

			  // Handle broken unsubscribe merge tags (e.g., "unsubscribe_link}}" from unprocessed {{contact:unsubscribe_link}})
			  if ( strpos( $original_url, 'unsubscribe_link' ) !== false || strpos( $original_url, '{{contact:' ) !== false ) {
				  // Redirect to proper unsubscribe page for this contact
				  $contact = $tracking_entry->contact;
				  if ( $contact ) {
					  $unsubscribe_url = add_query_arg(
						  array(
							  'quillcrm-unsubscribe' => '1',
							  'id'                   => $contact->hash_id,
							  'channel'              => 'email',
						  ),
						  home_url()
					  );
					  wp_redirect( $unsubscribe_url );
					  exit;
				  }
			  }

			  wp_redirect( $original_url );
			  exit;
		} catch ( \Exception $e ) {
			quillcrm_get_logger()->error(
				__( 'Email Clicked Tracking Error', 'quillcrm' ),
				array(
					'code'  => 'email_clicked_tracking',
					'error' => array(
						'message' => $e->getMessage(),
						'code'    => $e->getCode(),
						'data'    => $e->getTrace(),
					),
				)
			);
			return;
		}
	}
}
