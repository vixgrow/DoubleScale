<?php
/**
 * Class Link Triggers
 * This class is responsible for handling the Link Triggers
 *
 * @since 1.0.0
 *
 * @package QuillCRM
 */

namespace QuillCRM\Tracking;

use QuillCRM\Models\Link_Trigger_Model;
use QuillCRM\Models\Campaign_Message_Model;

/**
 * Link Triggers
 */
class Link_Triggers {

	/**
	 * Class Instance.
	 *
	 * @since 1.0.0
	 *
	 * @var Link_Triggers
	 */
	private static $instance;

	/**
	 * Link Triggers Instance.
	 *
	 * Instantiates or reuses an instance of Link Triggers.
	 *
	 * @since  1.0.0
	 *
	 * @return Link_Triggers
	 */
	public static function instance() {
		if ( is_null( self::$instance ) ) {
			self::$instance = new self();
		}

		return self::$instance;
	}

	/**
	 * Constructor
	 */
	private function __construct() {
		add_action( 'quillcrm_loaded', array( $this, 'init' ) );
	}

	/**
	 * Init
	 */
	public function init() {
		$this->link_trigger_tracking();
	}

	/**
	 * Link Trigger Tracking
	 */
	public function link_trigger_tracking() {
		try {
			$hash = isset( $_GET['quillcrm-link-trigger'] ) ? sanitize_text_field( wp_unslash( $_GET['quillcrm-link-trigger'] ) ) : '';
			if ( empty( $hash ) ) {
				return;
			}

			$link_trigger = Link_Trigger_Model::where( 'hash', $hash )->where( 'status', 'active' )->first();
			if ( ! $link_trigger ) {
				return;
			}

			$redirect_url = $link_trigger->get_setting( 'redirect_url', home_url() );

			$link_trigger->click_count = $link_trigger->click_count + 1;
			$link_trigger->save();

			$track_id       = isset( $_GET['track-id'] ) ? sanitize_text_field( wp_unslash( $_GET['track-id'] ) ) : '';
			$campaign_email = Campaign_Message_Model::where( 'hash_key', $track_id )
				->where('mode', Campaign_Message_Model::MODE_EMAIL)
				->first();
			if ( ! $campaign_email ) {
				wp_redirect( $redirect_url );
				exit;
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

			$auto_login = $link_trigger->get_setting( 'auto_login', true );
			$contact    = $campaign_email->contact;

			if ( $contact ) {
				$this->sync_contact_data( $link_trigger, $contact );
				if ( $auto_login ) {
					$auth_id = isset( $_GET['auth-id'] ) ? sanitize_text_field( wp_unslash( $_GET['auth-id'] ) ) : '';
					if ( $auth_id ) {
						$contact_email = $contact->email;
						$user          = get_user_by( 'email', $contact_email );
						if ( $user && wp_check_password( $contact_email, $auth_id ) ) {
							wp_clear_auth_cookie();
							wp_set_current_user( $user->ID );
							wp_set_auth_cookie( $user->ID );
							do_action( 'wp_login', $user->user_login, $user );
						}
					}
				}

				do_action( 'quillcrm_link_trigger_clicked', $link_trigger, $contact );
			}

			wp_redirect( $redirect_url );
			exit;
		} catch ( \Exception $e ) {
			quillcrm_get_logger()->error(
				__( 'Link Trigger Tracking Error', 'quillcrm' ),
				array(
					'code'  => 'link_trigger_tracking',
					'error' => array(
						'message' => $e->getMessage(),
						'code'    => $e->getCode(),
						'data'    => $e->getTrace(),
					),
				)
			);
		}
	}

	/**
	 * Sync Contact Data
	 *
	 * @param Link_Trigger_Model $link_trigger Link Trigger Model.
	 * @param Contact_Model      $contact      Contact Model.
	 */
	public function sync_contact_data( Link_Trigger_Model $link_trigger, $contact ) {
		$to_apply_tags = $link_trigger->get_setting( 'add_tags', array() );
		if ( ! empty( $to_apply_tags ) ) {
			$contact->tags()->syncWithoutDetaching( $to_apply_tags );
		}

		$to_remove_tags = $link_trigger->get_setting( 'remove_tags', array() );
		if ( ! empty( $to_remove_tags ) ) {
			$contact->tags()->detach( $to_remove_tags );
		}

		$to_apply_lists = $link_trigger->get_setting( 'add_lists', array() );
		if ( ! empty( $to_apply_lists ) ) {
			$contact->lists()->syncWithoutDetaching( $to_apply_lists );
		}

		$to_remove_lists = $link_trigger->get_setting( 'remove_lists', array() );
		if ( ! empty( $to_remove_lists ) ) {
			$contact->lists()->detach( $to_remove_lists );
		}
	}
}
