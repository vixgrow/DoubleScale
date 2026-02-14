<?php

/**
 * Class Triggers Manager
 * This class is responsible for handling the triggers
 *
 * @since 1.0.0
 *
 * @package QuillCRM
 */

namespace QuillCRM\Managers;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

use Exception;
use QuillCRM\Abstracts\Trigger;
use QuillCRM\Managers\Forms_Manager;

/**
 * Triggers class
 */
final class Triggers_Manager {


	/**
	 * Registed triggers
	 *
	 * @since 1.0.0
	 *
	 * @var array
	 */
	protected $triggers = array();

	/**
	 * Sources
	 *
	 * @var array
	 */
	protected $sources = array();

	/**
	 * Class Instance.
	 *
	 * @since 1.0.0
	 *
	 * @var Triggers_Manager
	 */
	private static $instance;

	/**
	 * Manager Instance.
	 *
	 * Instantiates or reuses an instance of Manager.
	 *
	 * @since  1.0.0
	 *
	 * @return Triggers_Manager
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
		$this->set_sources();
		$this->set_forms_sources();
		add_action( 'quillcrm_loaded', array( $this, 'load_triggers' ) );
	}

	/**
	 * Load triggers
	 */
	public function load_triggers() {
		/** @var Trigger[] $triggers */
		$triggers = apply_filters( 'quillcrm_triggers', $this->triggers );

		// Re-register triggers after filter to update sources array
		// This allows Pro versions to properly replace free versions in the frontend
		foreach ( $triggers as $slug => $trigger ) {
			// Update the trigger in the internal array
			$this->triggers[ $slug ] = $trigger;

			// Update the sources array with the (potentially updated) trigger's fields
			$this->sources[ $trigger->source ]['groups'][ $trigger->group ]['triggers'][ $trigger->slug ] = array(
				'label'       => $trigger->name,
				'description' => $trigger->description,
				'fields'      => $trigger->get_fields(),
				'is_pro'      => $trigger->is_pro,
			);

			// Load the trigger's hooks
			$trigger->load_hooks();
		}
	}

	/**
	 * Register trigger
	 *
	 * @param Trigger $trigger
	 *
	 * @throws Exception If trigger is not an instance of Trigger
	 * @return void
	 */
	public function register( $trigger ) {
		if ( ! $trigger instanceof Trigger ) {
			throw new Exception(
				__( 'Invalid trigger', 'quill-crm' )
			);
		}

		if ( isset( $this->triggers[ $trigger->slug ] ) ) {
			/* translators: %s: trigger name */
			throw new Exception(
				sprintf( __( 'Trigger %s already registered', 'quill-crm' ), $trigger->name )
			);
		}

		$this->triggers[ $trigger->slug ] = $trigger;
		$this->sources[ $trigger->source ]['groups'][ $trigger->group ]['triggers'][ $trigger->slug ] = array(
			'label'       => $trigger->name,
			'description' => $trigger->description,
			'fields'      => $trigger->get_fields(),
			'is_pro'      => $trigger->is_pro,
		);
	}

	/**
	 * Get trigger
	 *
	 * @param string $slug
	 *
	 * @return Trigger
	 */
	public function get_trigger( $slug ) {
		return isset( $this->triggers[ $slug ] ) ? $this->triggers[ $slug ] : null;
	}

	/**
	 * Get all triggers
	 *
	 * @return array
	 */
	public function get_all_triggers() {
		return $this->triggers;
	}

	/**
	 * Get sources
	 *
	 * @return array
	 */
	public function set_sources() {
		 $this->sources = array(
			 'crm'         => array(
				 'label'  => __( 'CRM', 'quill-crm' ),
				 'groups' => array(
					 'contact'       => array(
						 'label'    => __( 'Contact', 'quill-crm' ),
						 'triggers' => array(),
					 ),
					 'messaging'     => array(
						 'label'    => __( 'Messaging', 'quill-crm' ),
						 'triggers' => array(),
					 ),
					 'link_triggers' => array(
						 'label'    => __( 'Link Triggers', 'quill-crm' ),
						 'triggers' => array(),
					 ),
					 'webhooks'      => array(
						 'label'    => __( 'Webhooks', 'quill-crm' ),
						 'triggers' => array(),
					 ),
					 'deal'          => array(
						 'label'    => __( 'Deal', 'quill-crm' ),
						 'triggers' => array(),
					 ),
				 ),
			 ),
			 'woocommerce' => array(
				 'label'  => __( 'WooCommerce', 'quill-crm' ),
				 'groups' => array(
					 'order'        => array(
						 'label'       => __( 'Order', 'quill-crm' ),
						 'triggers'    => array(),
						 'is_disabled' => ! quillcrm_is_plugin_active( 'woocommerce/woocommerce.php' ),
					 ),
					 'cart'         => array(
						 'label'       => __( 'Cart', 'quill-crm' ),
						 'triggers'    => array(),
						 'is_disabled' => ! quillcrm_is_plugin_active( 'woocommerce/woocommerce.php' ),
					 ),
					 'review'       => array(
						 'label'       => __( 'Review', 'quill-crm' ),
						 'triggers'    => array(),
						 'is_disabled' => ! quillcrm_is_plugin_active( 'woocommerce/woocommerce.php' ),
					 ),
					 'subscription' => array(
						 'label'       => __( 'Subscription', 'quill-crm' ),
						 'triggers'    => array(),
						 'is_disabled' => ! quillcrm_is_plugin_active( 'woocommerce-subscriptions/woocommerce-subscriptions.php' ),
					 ),
					 'wishlist'     => array(
						 'label'       => __( 'Wishlist', 'quill-crm' ),
						 'triggers'    => array(),
						 'is_disabled' => ! quillcrm_is_plugin_active( 'woocommerce-wishlists/woocommerce-wishlists.php' ),
					 ),
					 'membership'   => array(
						 'label'       => __( 'Membership', 'quill-crm' ),
						 'triggers'    => array(),
						 'is_disabled' => ! quillcrm_is_plugin_active( 'woocommerce-memberships/woocommerce-memberships.php' ),
					 ),
				 ),
			 ),
			 'wp'          => array(
				 'label'  => __( 'WordPress', 'quill-crm' ),
				 'groups' => array(
					 'user' => array(
						 'label'    => __( 'User', 'quill-crm' ),
						 'triggers' => array(),
					 ),
				 ),
			 ),
			 'edd'         => array(
				 'label'  => __( 'Easy Digital Downloads', 'quill-crm' ),
				 'groups' => array(
					 'order' => array(
						 'label'       => __( 'Order', 'quill-crm' ),
						 'triggers'    => array(),
						 'is_disabled' => ! quillcrm_is_plugin_active( 'easy-digital-downloads/easy-digital-downloads.php' ),
					 ),
				 ),
			 ),
			 'lms'         => array(
				 'label'  => __( 'LMS', 'quill-crm' ),
				 'groups' => array(
					 'learndash'  => array(
						 'label'       => __( 'LearnDash', 'quill-crm' ),
						 'triggers'    => array(),
						 'is_disabled' => ! quillcrm_is_plugin_active( 'sfwd-lms/sfwd_lms.php' ),
					 ),
					 'tutorlms'   => array(
						 'label'       => __( 'Tutor LMS', 'quill-crm' ),
						 'triggers'    => array(),
						 'is_disabled' => ! quillcrm_is_plugin_active( 'tutor/tutor.php' ),
					 ),
					 'lifterlms'  => array(
						 'label'       => __( 'LifterLMS', 'quill-crm' ),
						 'triggers'    => array(),
						 'is_disabled' => ! quillcrm_is_plugin_active( 'lifterlms/lifterlms.php' ),
					 ),
					 'learnpress' => array(
						 'label'       => __( 'LearnPress', 'quill-crm' ),
						 'triggers'    => array(),
						 'is_disabled' => ! quillcrm_is_plugin_active( 'learnpress/learnpress.php' ),
					 ),
				 ),
			 ),
			 // 'memberpress' => array(
			 // 'label'  => __( 'MemberPress', 'quill-crm' ),
			 // 'groups' => array(
			 // 'memberpress' => array(
			 // 'label'       => __( 'MemberPress', 'quill-crm' ),
			 // 'triggers'    => array(),
			 // 'is_disabled' => ! quillcrm_is_plugin_active( 'memberpress/memberpress.php' ),
			 // ),
			 // ),
			 // ),
			 'booking'     => array(
				 'label'  => __( 'Booking', 'quill-crm' ),
				 'groups' => array(
					 'quillbooking' => array(
						 'label'       => __( 'QuillBooking', 'quill-crm' ),
						 'triggers'    => array(),
						 'is_disabled' => ! quillcrm_is_plugin_active( 'QuillBooking/quillbooking.php' ),
					 ),
				 ),
			 ),
			 'forms'       => array(
				 'label'  => __( 'Forms', 'quill-crm' ),
				 'groups' => array(),
			 ),
			 'surecart'    => array(
				 'label'  => __( 'SureCart', 'quill-crm' ),
				 'groups' => array(
					 'order' => array(
						 'label'       => __( 'Order', 'quill-crm' ),
						 'triggers'    => array(),
						 'is_disabled' => ! defined( 'SURECART_PLUGIN_FILE' ),
					 ),
				 ),
			 ),
			 'video'       => array(
				 'label'  => __( 'Video', 'quill-crm' ),
				 'groups' => array(
					 'prestoplayer' => array(
						 'label'       => __( 'Presto Player', 'quill-crm' ),
						 'triggers'    => array(),
						 'is_disabled' => ! defined( 'PRESTO_PLAYER_PLUGIN_FILE' ),
					 ),
				 ),
			 ),
		 );

		 $this->sources = apply_filters( 'quillcrm_triggers_sources', $this->sources );
	}

	/**
	 * Get forms sources
	 *
	 * @return void
	 */
	public function set_forms_sources() {
		$forms = Forms_Manager::instance()->get_all_forms();

		foreach ( $forms as $form ) {
			$this->sources['forms']['groups'][ $form->slug ] = array(
				'label'       => $form->name,
				'is_disabled' => ! $form->is_enabled(),
				'triggers'    => array(
					$form->slug => array(
						'label'       => __( 'Form Submitted', 'quill-crm' ),
						'description' => $form->description,
						'fields'      => $form->get_form_options(),
						'is_disabled' => ! $form->is_enabled(),
						'is_form'     => true,
						'is_pro'      => $form->is_pro,
					),
				),
			);
		}
	}


	/**
	 * Get sources
	 *
	 * @return array
	 */
	public function get_sources() {
		 return $this->sources;
	}
}
