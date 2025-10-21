<?php
/**
 * Layout Handler Registry
 *
 * @since 1.0.0
 *
 * @package QuillCRM
 */

namespace QuillCRM\Emails\Layouts;

/**
 * Registry for layout handlers
 */
class Layout_Handler_Registry {
	/**
	 * Singleton instance
	 *
	 * @var Layout_Handler_Registry
	 */
	private static $instance = null;

	/**
	 * Registered handlers
	 *
	 * @var Layout_Handler_Interface[]
	 */
	private $handlers = array();

	/**
	 * Get singleton instance
	 *
	 * @return Layout_Handler_Registry
	 */
	public static function instance(): Layout_Handler_Registry {
		if ( null === self::$instance ) {
			self::$instance = new self();
		}
		return self::$instance;
	}

	/**
	 * Constructor - register default handlers
	 */
	private function __construct() {
		$this->register_default_handlers();
	}

	/**
	 * Register default layout handlers
	 */
	private function register_default_handlers() {
		// Register side-by-side handler (highest priority)
		$this->register( new Side_By_Side_Layout_Handler() );

		// Register all grid handlers (one handler, multiple instances)
		foreach ( Grid_Layout_Handler::get_supported_grids() as $grid_id ) {
			$this->register( new Grid_Layout_Handler( $grid_id ) );
		}

		// Register generic inline handler (lowest priority - fallback)
		$this->register( new Generic_Inline_Layout_Handler() );
	}

	/**
	 * Register a layout handler
	 *
	 * @param Layout_Handler_Interface $handler Handler to register
	 */
	public function register( Layout_Handler_Interface $handler ) {
		$this->handlers[] = $handler;

		// Sort by priority (highest first)
		usort(
			$this->handlers,
			function ( $a, $b ) {
				return $b->get_priority() - $a->get_priority();
			}
		);
	}

	/**
	 * Find handler for a block
	 *
	 * @param array $block Block data
	 * @return Layout_Handler_Interface|null
	 */
	public function find_handler( array $block ) {
		foreach ( $this->handlers as $handler ) {
			if ( $handler->can_handle( $block ) ) {
				return $handler;
			}
		}
		return null;
	}

	/**
	 * Get all registered handlers
	 *
	 * @return Layout_Handler_Interface[]
	 */
	public function get_handlers(): array {
		return $this->handlers;
	}
}

