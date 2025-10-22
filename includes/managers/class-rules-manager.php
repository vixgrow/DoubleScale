<?php

/**
 * Class Rules_Manager
 *
 * This class is responsible for handling the rules
 *
 * @since 1.0.0
 *
 * @package QuillCRM
 */

namespace QuillCRM\Managers;

use Exception;
use QuillCRM\Abstracts\Rule;

/**
 * Rules class
 */
final class Rules_Manager {


	/**
	 * Registed rules
	 *
	 * @since 1.0.0
	 *
	 * @var array
	 */
	protected $rules = array();

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
	 * @var Rules_Manager
	 */
	private static $instance;

	/**
	 * Manager Instance.
	 *
	 * Instantiates or reuses an instance of Manager.
	 *
	 * @since  1.0.0
	 *
	 * @return Rules_Manager
	 */
	public static function instance() {
		if ( is_null( self::$instance ) ) {
			self::$instance = new self();
		}

		return self::$instance;
	}

	/**
	 * Constructor
	 *
	 * @since 1.0.0
	 */
	public function __construct() {
		 $this->set_groups();
	}

	/**
	 * Set groups
	 *
	 * @since 1.0.0
	 *
	 * @return void
	 */
	public function set_groups() {
		$this->groups = array(
			'contact'                   => array(
				'name'  => __( 'Contact', 'quillcrm' ),
				'key'   => 'contact',
				'rules' => array(),
			),
			'contact_fields'            => array(
				'name'  => __( 'Contact Fields', 'quillcrm' ),
				'key'   => 'contact_fields',
				'rules' => array(),
			),
			'segments'                  => array(
				'name'  => __( 'Segments', 'quillcrm' ),
				'key'   => 'segments',
				'rules' => array(),
			),
			'user'                      => array(
				'name'  => __( 'User', 'quillcrm' ),
				'key'   => 'user',
				'rules' => array(),
			),
			'activity'                  => array(
				'name'  => __( 'Activity', 'quillcrm' ),
				'key'   => 'activity',
				'rules' => array(),
			),
			'woocommerce_current_order' => array(
				'name'     => __( 'WooCommerce Current Order', 'quillcrm' ),
				'key'      => 'woocommerce_current_order',
				'rules'    => array(),
				'triggers' => array( 'wc_order_created', 'wc_order_completed', 'wc_order_refunded', 'wc_order_status_changed' ),
			),
		);

		// get forms slug to set in groups
		$forms = Forms_Manager::instance()->get_all_forms();
		foreach ( $forms as $form ) {
			$this->groups[ $form->slug ] = array(
				'name'     => $form->name,
				'rules'    => array(),
				'key'      => $form->slug,
				'triggers' => array( $form->slug ),
			);
		}
	}





	/**
	 * Register rule
	 *
	 * @since 1.0.0
	 *
	 * @param Rule $rule
	 *
	 * @throws Exception If trigger is not an instance of Trigger
	 * @return void
	 */
	public function register( Rule $rule ) {
		if ( ! $rule instanceof Rule ) {
			throw new Exception( 'Rule must be an instance of Rule' );
		}

		if ( isset( $this->rules[ $rule->slug ] ) ) {
			throw new Exception( 'Rule already exists' );
		}

		$this->rules[ $rule->slug ]                           = $rule;
		$this->groups[ $rule->group ]['rules'][ $rule->slug ] = array(
			'name'      => $rule->name,
			'type'      => $rule->type,
			'operators' => $rule->get_operators(),
			'options'   => $rule->get_options(),
		);
	}

	/**
	 * Get rules
	 *
	 * @since 1.0.0
	 *
	 * @return array
	 */
	public function get_rules() {
		return $this->rules;
	}

	/**
	 * Get rule
	 *
	 * @since 1.0.0
	 *
	 * @param string $slug
	 *
	 * @return Rule|null
	 */
	public function get_rule( $slug ) {
		if ( isset( $this->rules[ $slug ] ) ) {
			return $this->rules[ $slug ];
		}

		return null;
	}

	/**
	 * Get groups
	 *
	 * @since 1.0.0
	 *
	 * @return array
	 */
	public function get_groups() {
		return $this->groups;
	}

	/**
	 * Get groups by slugs
	 *
	 * @since 1.0.0
	 *
	 * @param array $slugs
	 *
	 * @return array
	 */
	public function get_groups_by_slugs( $slugs ) {
		$groups = array();

		foreach ( $slugs as $slug ) {
			if ( isset( $this->groups[ $slug ] ) ) {
				$groups[ $slug ] = $this->groups[ $slug ];
			}
		}

		return $groups;
	}
}
