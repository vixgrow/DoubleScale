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
	private function __construct() {}


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
}
