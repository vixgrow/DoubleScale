<?php

/**
 * Class Actions Manager
 * This class is responsible for handling the actions
 *
 * @since 1.0.0
 *
 * @package QuillCRM
 */

namespace QuillCRM\Managers;

use Exception;
use QuillCRM\Abstracts\Action;
use QuillCRM\Managers\Integrations_Manager;

/**
 * Actions class
 */
final class Actions_Manager {

	/**
	 * Registed actions
	 *
	 * @since 1.0.0
	 *
	 * @var array
	 */
	protected $actions = array();

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
	 * @var Actions_Manager
	 */
	private static $instance;

	/**
	 * Manager Instance.
	 *
	 * Instantiates or reuses an instance of Manager.
	 *
	 * @since  1.0.0
	 *
	 * @return Actions_Manager
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
	}


	/**
	 * Register Action
	 *
	 * @since 1.0.0
	 *
	 * @param Action $action
	 * @return void
	 */
	public function register( Action $action ) {
		if ( ! $action instanceof Action ) {
			throw new Exception( __( 'Invalid action', 'quillcrm' ) );
		}

		if ( isset( $this->actions[ $action->slug ] ) ) {
			throw new Exception( sprintf( __( 'Action %s already registered', 'quillcrm' ), $action->name ) );
		}

		$this->actions[ $action->slug ] = $action;
		$this->sources[ $action->source ]['groups'][ $action->group ]['actions'][ $action->slug ] = array(
			'label'             => $action->name,
			'description'       => $action->description,
			'fields'            => $action->get_fields(),
			'is_integration'    => $action->is_integration,
			'required_triggers' => $action->required_triggers,
		);
	}

	/**
	 * Get Action
	 *
	 * @since 1.0.0
	 *
	 * @param string $slug
	 * @return Action
	 */
	public function get_action( $slug ) {
		if ( isset( $this->actions[ $slug ] ) ) {
			return $this->actions[ $slug ];
		}

		throw new Exception( sprintf( __( 'Action %s not found', 'quillcrm' ), $slug ) );
	}

	/**
	 * Get Actions
	 *
	 * @since 1.0.0
	 *
	 * @return array
	 */
	public function get_actions() {
		 return $this->actions;
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
					 'contact' => array(
						 'label'   => __( 'Contact', 'quillcrm' ),
						 'actions' => array(),
					 ),
					 'deal'    => array(
						 'label'   => __( 'Deal', 'quillcrm' ),
						 'actions' => array(),
					 ),
				 ),
			 ),
			 'woocommerce' => array(
				 'label'       => __( 'WooCommerce', 'quillcrm' ),
				 'is_disabled' => ! quillcrm_is_plugin_active( 'woocommerce/woocommerce.php' ),
				 'groups'      => array(
					 'order'  => array(
						 'label'   => __( 'Order', 'quillcrm' ),
						 'actions' => array(),
					 ),
					 'coupon' => array(
						 'label'   => __( 'Coupon', 'quillcrm' ),
						 'actions' => array(),
					 ),
				 ),
			 ),
			 'wp'          => array(
				 'label'  => __( 'WordPress', 'quillcrm' ),
				 'groups' => array(
					 'user' => array(
						 'label'   => __( 'User', 'quillcrm' ),
						 'actions' => array(),
					 ),
				 ),
			 ),
			 'lms'         => array(
				 'label'  => __( 'LMS', 'quillcrm' ),
				 'groups' => array(
					 'learndash' => array(
						 'is_disabled' => ! quillcrm_is_plugin_active( 'sfwd-lms/sfwd_lms.php' ),
						 'label'       => __( 'LearnDash', 'quillcrm' ),
						 'actions'     => array(),
					 ),
				 ),
			 ),
		 'email'       => array(
			 'label'  => __( 'Email', 'quillcrm' ),
			 'groups' => array(
				 'email' => array(
					 'label'   => __( 'Email', 'quillcrm' ),
					 'actions' => array(),
				 ),
			 ),
		 ),
		 'message'     => array(
			 'label'  => __( 'Messaging', 'quillcrm' ),
			 'groups' => array(
				 'email'    => array(
					 'label'   => __( 'Email', 'quillcrm' ),
					 'actions' => array(),
				 ),
				 'sms'      => array(
					 'label'   => __( 'SMS', 'quillcrm' ),
					 'actions' => array(),
				 ),
				 'whatsapp' => array(
					 'label'   => __( 'WhatsApp', 'quillcrm' ),
					 'actions' => array(),
				 ),
			 ),
		 ),
		 'send_data'   => array(
				 'label'  => __( 'Send Data', 'quillcrm' ),
				 'groups' => array(
					 'activecampaign' => array(
						 'label'   => __( 'ActiveCampaign', 'quillcrm' ),
						 'actions' => array(),
					 ),
					 'convertkit'     => array(
						 'label'   => __( 'ConvertKit', 'quillcrm' ),
						 'actions' => array(),
					 ),
					 'drip'           => array(
						 'label'   => __( 'Drip', 'quillcrm' ),
						 'actions' => array(),
					 ),
					 'getresponse'    => array(
						 'label'   => __( 'GetResponse', 'quillcrm' ),
						 'actions' => array(),
					 ),
					 'hubspot'        => array(
						 'label'   => __( 'HubSpot', 'quillcrm' ),
						 'actions' => array(),
					 ),
					 'keap'           => array(
						 'label'   => __( 'Keap', 'quillcrm' ),
						 'actions' => array(),
					 ),
					 'klaviyo'        => array(
						 'label'   => __( 'Klaviyo', 'quillcrm' ),
						 'actions' => array(),
					 ),
					 'mailchimp'      => array(
						 'label'   => __( 'Mailchimp', 'quillcrm' ),
						 'actions' => array(),
					 ),
					 'mailerlite'     => array(
						 'label'   => __( 'MailerLite', 'quillcrm' ),
						 'actions' => array(),
					 ),
					 'mautic'         => array(
						 'label'   => __( 'Mautic', 'quillcrm' ),
						 'actions' => array(),
					 ),
					 'slack'          => array(
						 'label'   => __( 'Slack', 'quillcrm' ),
						 'actions' => array(),
					 ),
					 'twilio'         => array(
						 'label'   => __( 'Twilio', 'quillcrm' ),
						 'actions' => array(),
					 ),
					 'zapier'         => array(
						 'label'   => __( 'Zapier', 'quillcrm' ),
						 'actions' => array(),
					 ),
				 ),
			 ),
		 );

		 foreach ( $this->sources['send_data']['groups'] as $group => $data ) {
			 // Zapier doesn't require integration setup, so it's always enabled
			 if ( $group === 'zapier' ) {
				 $this->sources['send_data']['groups'][ $group ]['is_disabled'] = false;
			 } else {
				 $this->sources['send_data']['groups'][ $group ]['is_disabled'] = ! Integrations_Manager::instance()->is_active( $group );
			 }
		 }

		 $this->sources = apply_filters( 'quillcrm_actions_sources', $this->sources );
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
