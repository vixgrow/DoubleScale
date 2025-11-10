<?php

/**
 * Class Merge Tag Manager
 *
 * This class is responsible for handling the merge tags
 *
 * @since 1.0.0
 *
 * @package QuillCRM
 */

namespace QuillCRM\Managers;

use QuillCRM\Abstracts\Merge_Tag;
use QuillCRM\Models\Automation_Contact_Model;

/**
 * Merge Tag Manager
 */
final class Merge_Tags_Manager {
















	/**
	 * Registed merge tags
	 *
	 * @since 1.0.0
	 *
	 * @var array
	 */
	protected $merge_tags = array();

	/**
	 * Groups
	 *
	 * @var array
	 */
	protected $groups = array();

	/**
	 * Class Instance.
	 *
	 * @since 1.0.0
	 *
	 * @var Merge_Tags_Manager
	 */
	private static $instance;

	/**
	 * Manager Instance.
	 *
	 * Instantiates or reuses an instance of Manager.
	 *
	 * @since  1.0.0
	 *
	 * @return Merge_Tags_Manager
	 */
	public static function instance() {
		if ( is_null( self::$instance ) ) {
			self::$instance = new self();
		}

		return self::$instance;
	}

	/**
	 * constructor
	 */
	private function __construct() {
		$this->set_groups();
	}

	/**
	 * Register Merge Tag
	 *
	 * @since 1.0.0
	 *
	 * @param Merge_Tag $merge_tag Merge Tag.
	 */
	public function register( Merge_Tag $merge_tag ) {
		if ( ! $merge_tag instanceof Merge_Tag ) {
			return;
		}

		if ( isset( $this->merge_tags[ $merge_tag->slug ] ) ) {
			return;
		}

		// Merge tag will be like {{group:slug}}
		$this->merge_tags[ $merge_tag->group ][ $merge_tag->slug ]          = $merge_tag;
		$this->groups[ $merge_tag->group ]['mergeTags'][ $merge_tag->slug ] = array(
			'name'              => $merge_tag->name,
			// 'description' => $merge_tag->description,
			'value'             => "{{{$merge_tag->group}:{$merge_tag->slug}}}",
			'required_triggers' => $merge_tag->required_triggers,
		);
	}

	/**
	 * Get Merge Tag
	 *
	 * @since 1.0.0
	 *
	 * @param string $group Merge Tag Group.
	 * @param string $slug Merge Tag Slug.
	 *
	 * @return Merge_Tag
	 */
	public function get_merge_tag( $group, $slug ) {
		if ( isset( $this->merge_tags[ $group ][ $slug ] ) ) {
			return $this->merge_tags[ $group ][ $slug ];
		}

		return null;
	}

	/**
	 * Get Merge Tags
	 *
	 * @since 1.0.0
	 *
	 * @return array
	 */
	public function get_merge_tags() {
		return $this->merge_tags;
	}

	/**
	 * Set Groups
	 */
	public function set_groups() {
		$this->groups = array(
			'contact'        => array(
				'name'      => __( 'Contact', 'quillcrm' ),
				'mergeTags' => array(),
			),
			'general'        => array(
				'name'      => __( 'General', 'quillcrm' ),
				'mergeTags' => array(),
			),
			'order'          => array(
				'name'        => __( 'Order', 'quillcrm' ),
				'mergeTags'   => array(),
				'triggers'    => array( 'wc_order_completed', 'wc_order_created', 'wc_order_refunded', 'wc_order_status_changed', 'wc_cart_recovered' ),
				'is_disabled' => ! quillcrm_is_plugin_active( 'woocommerce/woocommerce.php' ),
			),
			'abandoned_cart' => array(
				'name'        => __( 'Abandoned Cart', 'quillcrm' ),
				'mergeTags'   => array(),
				'triggers'    => array( 'wc_abandoned_cart_created' ),
				'is_disabled' => ! quillcrm_is_plugin_active( 'woocommerce/woocommerce.php' ),
			),
			'edd_customer'   => array(
				'name'        => __( 'Easy Digital Downloads Customer', 'quillcrm' ),
				'mergeTags'   => array(),
				'triggers'    => array( 'edd_new_order_success' ),
				'is_disabled' => ! defined( 'EDD_PLUGIN_FILE' ),
			),
			'edd_order'      => array(
				'name'        => __( 'Easy Digital Downloads Order', 'quillcrm' ),
				'mergeTags'   => array(),
				'triggers'    => array( 'edd_new_order_success' ),
				'is_disabled' => ! defined( 'EDD_PLUGIN_FILE' ),
			),
			'learndash'      => array(
				'name'        => __( 'LearnDash', 'quillcrm' ),
				'mergeTags'   => array(),
				'is_disabled' => ! quillcrm_is_plugin_active( 'sfwd-lms/sfwd_lms.php' ),
			),
			'membership'     => array(
				'name'        => __( 'Membership', 'quillcrm' ),
				'mergeTags'   => array(),
				'triggers'    => array( 'wc_membership_created', 'wc_membership_status_changed' ),
				'is_disabled' => ! quillcrm_is_plugin_active( 'woocommerce-memberships/woocommerce-memberships.php' ),
			),
			'wishlist'       => array(
				'name'        => __( 'Wishlist', 'quillcrm' ),
				'mergeTags'   => array(),
				'triggers'    => array( 'wc_user_adds_product_to_wishlist', 'wc_wishlist_item_on_sale', 'wc_wishlist_reminder' ),
				'is_disabled' => ! quillcrm_is_plugin_active( 'ti-woocommerce-wishlist/ti-woocommerce-wishlist.php' ),
			),
			'subscription'   => array(
				'name'        => __( 'Subscription', 'quillcrm' ),
				'mergeTags'   => array(),
				'triggers'    => array(
					'wc_subscription_created',
					'wc_subscription_status_changed',
					'wc_customer_before_card_expiry',
					'wc_subscription_renewal_payment_failed',
					'wc_subscription_renewal_payment_complete',
					'wc_subscription_trial_end',
					'wc_subscription_note_added',
					'wc_subscription_before_renewal',
					'wc_subscription_before_end',
				),
				'is_disabled' => ! quillcrm_is_plugin_active( 'woocommerce-subscriptions/woocommerce-subscriptions.php' ),
			),
			'review'         => array(
				'name'        => __( 'Review', 'quillcrm' ),
				'mergeTags'   => array(),
				'triggers'    => array( 'wc_review_received' ),
				'is_disabled' => ! quillcrm_is_plugin_active( 'woocommerce/woocommerce.php' ),
			),
		);
		// get forms slug to set in groups
		$forms = Forms_Manager::instance()->get_all_forms();
		foreach ( $forms as $form ) {
			$this->groups[ $form->slug ] = array(
				'name'      => $form->name,
				'mergeTags' => array(),
				'triggers'  => array( $form->slug ),
			);
		}
	}

	/**
	 * Get Groups
	 *
	 * @return array
	 */
	public function get_groups() {
		return $this->groups;
	}

	/**
	 * Process Merge Tags
	 *
	 * @since 1.0.0
	 *
	 * @param string                                      $content Content.
	 * @param Automation_Contact_Model|Contact_Model|null $automation_contact Contact Model.
	 *
	 * @return string
	 */
	public function process_merge_tags( $content, $contact ) {
		return preg_replace_callback(
			'/{{(.*?):(.*?)}}/',
			function ( $matches ) use ( $contact ) {
				$group          = $matches[1];
				$slug           = $matches[2];
				$slug_parts     = explode( ' ', $slug );
				$merge_tag_slug = $slug_parts[0];
				$merge_tag      = $this->get_merge_tag( $group, $merge_tag_slug );

				if ( ! $merge_tag ) {
					return '';
				}

				return $merge_tag->get_tag_value( $contact, $slug );
			},
			$content
		);
	}
}
