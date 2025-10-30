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

		foreach ( $triggers as $trigger ) {
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
				__( 'Invalid trigger', 'quillcrm' )
			);
		}

		if ( isset( $this->triggers[ $trigger->slug ] ) ) {
			throw new Exception(
				sprintf( __( 'Trigger %s already registered', 'quillcrm' ), $trigger->name )
			);
		}

		$this->triggers[ $trigger->slug ] = $trigger;
		$this->sources[ $trigger->source ]['groups'][ $trigger->group ]['triggers'][ $trigger->slug ] = array(
			'label'       => $trigger->name,
			'description' => $trigger->description,
			'fields'      => $trigger->get_fields(),
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
				 'label'  => __( 'CRM', 'quillcrm' ),
				 'groups' => array(
					 'contact'       => array(
						 'label'    => __( 'Contact', 'quillcrm' ),
						 'triggers' => array(),
					 ),
					 'link_triggers' => array(
						 'label'    => __( 'Link Triggers', 'quillcrm' ),
						 'triggers' => array(),
					 ),
					 'webhooks'      => array(
						 'label'    => __( 'Webhooks', 'quillcrm' ),
						 'triggers' => array(),
					 ),
					 'deal'          => array(
						 'label'    => __( 'Deal', 'quillcrm' ),
						 'triggers' => array(),
					 ),
				 ),
			 ),
			 'woocommerce' => array(
				 'label'       => __( 'WooCommerce', 'quillcrm' ),
				 'is_disabled' => ! quillcrm_is_plugin_active( 'woocommerce/woocommerce.php' ),
				 'groups'      => array(
					 'order' => array(
						 'label'    => __( 'Order', 'quillcrm' ),
						 'triggers' => array(),
					 ),
					 'cart'  => array(
						 'label'    => __( 'Cart', 'quillcrm' ),
						 'triggers' => array(),
					 ),
				 ),
			 ),
			 'wp'          => array(
				 'label'  => __( 'WordPress', 'quillcrm' ),
				 'groups' => array(
					 'user' => array(
						 'label'    => __( 'User', 'quillcrm' ),
						 'triggers' => array(),
					 ),
				 ),
			 ),
			 'lms'         => array(
				 'label'  => __( 'LMS', 'quillcrm' ),
				 'groups' => array(
					 'learndash' => array(
						 'is_disabled' => ! quillcrm_is_plugin_active( 'sfwd-lms/sfwd_lms.php' ),
						 'label'       => __( 'LearnDash', 'quillcrm' ),
						 'triggers'    => array(),
					 ),
				 ),
			 ),
			 'memberpress' => array(
				 'label'  => __( 'MemberPress', 'quillcrm' ),
				 'groups' => array(
					 'memberpress' => array(
						 'is_disabled' => ! quillcrm_is_plugin_active( 'memberpress/memberpress.php' ),
						 'label'       => __( 'MemberPress', 'quillcrm' ),
						 'triggers'    => array(),
					 ),
				 ),
			 ),
			 'booking'     => array(
				 'label'  => __( 'Booking', 'quillcrm' ),
				 'groups' => array(
					 'quillbooking' => array(
						 'is_disabled' => ! $this->is_quillbooking_active(),
						 'label'       => __( 'QuillBooking', 'quillcrm' ),
						 'triggers'    => array(),
					 ),
				 ),
			 ),
			 'forms'       => array(
				 'label'  => __( 'Forms', 'quillcrm' ),
				 'groups' => array(),
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
						'label'       => __( 'Form Submitted', 'quillcrm' ),
						'description' => $form->description,
						'fields'      => $form->get_form_options(),
						'is_disabled' => ! $form->is_enabled(),
						'is_form'     => true,
					),
				),
			);
		}
	}

	/**
	 * Check if QuillBooking plugin is active
	 *
	 * @since 1.0.0
	 *
	 * @return bool
	 */
	private function is_quillbooking_active() {
		 // Check if QuillBooking plugin is active
		if ( ! function_exists( 'is_plugin_active' ) ) {
			include_once( ABSPATH . 'wp-admin/includes/plugin.php' );
		}

		return \is_plugin_active( 'QuillBooking/quillbooking.php' ) || class_exists( 'QuillBooking\Plugin' );
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
