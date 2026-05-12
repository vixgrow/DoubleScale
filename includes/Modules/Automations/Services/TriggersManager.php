<?php

/**
 * Class Triggers Manager
 * This class is responsible for handling the triggers
 *
 * @since 1.0.0
 *
 * @package DoubleScale\Pro
 */

namespace DoubleScale\Modules\Automations\Services;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

use Exception;
use DoubleScale\Modules\Automations\Abstracts\Trigger;

/**
 * Triggers class
 */
final class TriggersManager {


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
	 * @deprecated Retained for backward compatibility; prefer container resolution.
	 * @var TriggersManager|null
	 */
	private static $instance;

	/**
	 * Get the singleton instance.
	 *
	 * The DI container is registered to call this method. Do not resolve the
	 * same FQCN from within here or the container will recurse until the
	 * process runs out of memory.
	 *
	 * @since 1.0.0
	 *
	 * @return TriggersManager
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
		add_action( 'doublescale_loaded', array( $this, 'load_triggers' ) );
	}

	/**
	 * Load triggers
	 */
	public function load_triggers() {
		/** @var Trigger[] $triggers */
		$triggers = apply_filters( 'doublescale_triggers', $this->triggers );

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
				// phpcs:ignore WordPress.Security.EscapeOutput.ExceptionNotEscaped -- Exception message, not direct output.
				__( 'Invalid trigger', 'doublescale')
			);
		}

		if ( isset( $this->triggers[ $trigger->slug ] ) ) {
			// phpcs:ignore WordPress.Security.EscapeOutput.ExceptionNotEscaped -- Exception message, not direct output.
			throw new Exception(
				/* translators: %s: trigger name */
				sprintf( __( 'Trigger %s already registered', 'doublescale'), $trigger->name )
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
				 'label'  => __( 'CRM', 'doublescale'),
				 'groups' => array(
					 'contact'       => array(
						 'label'    => __( 'Contact', 'doublescale'),
						 'triggers' => array(),
					 ),
					 'messaging'     => array(
						 'label'    => __( 'Messaging', 'doublescale'),
						 'triggers' => array(),
					 ),
					 'link_triggers' => array(
						 'label'    => __( 'Link Triggers', 'doublescale'),
						 'triggers' => array(),
					 ),
					 'webhooks'      => array(
						 'label'    => __( 'Webhooks', 'doublescale'),
						 'triggers' => array(),
					 ),
					 'deal'          => array(
						 'label'    => __( 'Deal', 'doublescale'),
						 'triggers' => array(),
					 ),
				 ),
			 ),
			 'woocommerce' => array(
				 'label'  => __( 'WooCommerce', 'doublescale'),
				 'groups' => array(
					 'order'        => array(
						 'label'       => __( 'Order', 'doublescale'),
						 'triggers'    => array(),
						 'is_disabled' => ! doublescale_is_plugin_active( 'woocommerce/woocommerce.php' ),
					 ),
					 'cart'         => array(
						 'label'       => __( 'Cart', 'doublescale'),
						 'triggers'    => array(),
						 'is_disabled' => ! doublescale_is_plugin_active( 'woocommerce/woocommerce.php' ),
					 ),
					 'review'       => array(
						 'label'       => __( 'Review', 'doublescale'),
						 'triggers'    => array(),
						 'is_disabled' => ! doublescale_is_plugin_active( 'woocommerce/woocommerce.php' ),
					 ),
					 'subscription' => array(
						 'label'       => __( 'Subscription', 'doublescale'),
						 'triggers'    => array(),
						 'is_disabled' => ! doublescale_is_plugin_active( 'woocommerce-subscriptions/woocommerce-subscriptions.php' ),
					 ),
					 'wishlist'     => array(
						 'label'       => __( 'Wishlist', 'doublescale'),
						 'triggers'    => array(),
						 'is_disabled' => ! doublescale_is_plugin_active( 'woocommerce-wishlists/woocommerce-wishlists.php' ),
					 ),
					 'membership'   => array(
						 'label'       => __( 'Membership', 'doublescale'),
						 'triggers'    => array(),
						 'is_disabled' => ! doublescale_is_plugin_active( 'woocommerce-memberships/woocommerce-memberships.php' ),
					 ),
				 ),
			 ),
			 'wp'          => array(
				 'label'  => __( 'WordPress', 'doublescale'),
				 'groups' => array(
					 'user' => array(
						 'label'    => __( 'User', 'doublescale'),
						 'triggers' => array(),
					 ),
				 ),
			 ),
			 'edd'         => array(
				 'label'  => __( 'Easy Digital Downloads', 'doublescale'),
				 'groups' => array(
					 'order' => array(
						 'label'       => __( 'Order', 'doublescale'),
						 'triggers'    => array(),
						 'is_disabled' => ! doublescale_is_plugin_active( 'easy-digital-downloads/easy-digital-downloads.php' ),
					 ),
				 ),
			 ),
			 'lms'         => array(
				 'label'  => __( 'LMS', 'doublescale'),
				 'groups' => array(
					 'learndash'  => array(
						 'label'       => __( 'LearnDash', 'doublescale'),
						 'triggers'    => array(),
						 'is_disabled' => ! doublescale_is_plugin_active( 'sfwd-lms/sfwd_lms.php' ),
					 ),
					 'tutorlms'   => array(
						 'label'       => __( 'Tutor LMS', 'doublescale'),
						 'triggers'    => array(),
						 'is_disabled' => ! doublescale_is_plugin_active( 'tutor/tutor.php' ),
					 ),
					 'lifterlms'  => array(
						 'label'       => __( 'LifterLMS', 'doublescale'),
						 'triggers'    => array(),
						 'is_disabled' => ! doublescale_is_plugin_active( 'lifterlms/lifterlms.php' ),
					 ),
					 'learnpress' => array(
						 'label'       => __( 'LearnPress', 'doublescale'),
						 'triggers'    => array(),
						 'is_disabled' => ! doublescale_is_plugin_active( 'learnpress/learnpress.php' ),
					 ),
				 ),
			 ),
			 'memberpress' => array(
				 'label'  => __( 'MemberPress', 'doublescale'),
				 'groups' => array(
					 'memberpress' => array(
						 'label'       => __( 'MemberPress', 'doublescale'),
						 'triggers'    => array(),
						 'is_disabled' => ! defined( 'MEPR_PLUGIN_NAME' ),
					 ),
				 ),
			 ),
			 'pmpro'       => array(
				 'label'  => __( 'Paid Memberships Pro', 'doublescale'),
				 'groups' => array(
					 'pmpro' => array(
						 'label'       => __( 'Paid Memberships Pro', 'doublescale'),
						 'triggers'    => array(),
						 'is_disabled' => ! defined( 'PMPRO_VERSION' ),
					 ),
				 ),
			 ),
			 'booking'     => array(
				 'label'  => __( 'Booking', 'doublescale'),
				 'groups' => array(
					 'booking' => array(
						 'label'       => __( 'Booking', 'doublescale'),
						 'triggers'    => array(),
						 'is_disabled' => false,
					 ),
				 ),
			 ),
			 'forms'       => array(
				 'label'  => __( 'Forms', 'doublescale'),
				 'groups' => array(),
			 ),
			 'surecart'    => array(
				 'label'  => __( 'SureCart', 'doublescale'),
				 'groups' => array(
					 'order' => array(
						 'label'       => __( 'Order', 'doublescale'),
						 'triggers'    => array(),
						 'is_disabled' => ! defined( 'SURECART_PLUGIN_FILE' ),
					 ),
				 ),
			 ),
			 'video'       => array(
				 'label'  => __( 'Video', 'doublescale'),
				 'groups' => array(
					 'prestoplayer' => array(
						 'label'       => __( 'Presto Player', 'doublescale'),
						 'triggers'    => array(),
						 'is_disabled' => ! defined( 'PRESTO_PLAYER_PLUGIN_FILE' ),
					 ),
				 ),
			 ),
		 );

		 $this->sources = apply_filters( 'doublescale_triggers_sources', $this->sources );
	}

	/**
	 * Get forms sources
	 *
	 * @return void
	 */
	public function set_forms_sources() {
		if ( ! class_exists( '\DoubleScale\Pro\Modules\Forms\Services\FormsManager' ) ) {
			return;
		}
		$forms = \DoubleScale\Pro\Modules\Forms\Services\FormsManager::instance()->get_all_forms();

		foreach ( $forms as $form ) {
			$this->sources['forms']['groups'][ $form->slug ] = array(
				'label'       => $form->name,
				'is_disabled' => ! $form->is_enabled(),
				'triggers'    => array(
					$form->slug => array(
						'label'       => __( 'Form Submitted', 'doublescale'),
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
