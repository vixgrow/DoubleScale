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
}
