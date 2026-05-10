<?php
/**
 * Block Registry
 *
 * @since 1.0.0
 *
 * @package DoubleScale\Pro
 */

namespace DoubleScale\Modules\Campaigns\Emails;

use DoubleScale\Modules\Campaigns\Emails\Blocks\EmailBlockInterface;
use DoubleScale\Modules\Contacts\Models\ContactModel;
use DoubleScale\Modules\Automations\Models\AutomationContactModel;

/**
 * Registry for email blocks
 */
class BlockRegistry {
	/**
	 * Registered blocks
	 *
	 * @var EmailBlockInterface[]
	 */
	private $blocks = array();

	/**
	 * Instances
	 *
	 * @var array
	 *
	 * @since 1.0.0
	 */
	private static $instances = array();

	/**
	 * Get Instance
	 *
	 * @since 1.0.0
	 *
	 * @return BlockRegistry
	 */
	public static function instance() {
		$class = get_called_class();
		if ( ! isset( self::$instances[ $class ] ) ) {
			self::$instances[ $class ] = new static();
		}
		return self::$instances[ $class ];
	}

	/**
	 * Constructor
	 */
	private function __construct() {
		$this->register_default_blocks();
	}

	/**
	 * Register a block
	 *
	 * @param EmailBlockInterface $block Block instance
	 * @return BlockRegistry
	 */
	public function register_block( EmailBlockInterface $block ) {
		$this->blocks[ $block->get_type() ] = $block;
		return $this;
	}

	/**
	 * Get a block by type
	 *
	 * @param string $type Block type
	 * @return EmailBlockInterface|null
	 */
	public function get_block( $type ) {
		return isset( $this->blocks[ $type ] ) ? $this->blocks[ $type ] : null;
	}

	/**
	 * Get all registered blocks
	 *
	 * @return EmailBlockInterface[]
	 */
	public function get_blocks() {
		return $this->blocks;
	}

	/**
	 * Render a block
	 *
	 * @param string                                    $type Block type
	 * @param array                                     $props Block properties
	 * @param ContactModel|AutomationContactModel|null $contact Contact model for merge tags
	 * @return string HTML output
	 */
	public function render_block( $type, array $props, $contact = null ) {
		$block = $this->get_block( $type );

		if ( ! $block ) {
			// Return empty string to hide unsupported blocks (pro blocks when pro not active)
			return '';
		}

		return $block->render( $props, $contact );
	}

	/**
	 * Register default blocks
	 */
	protected function register_default_blocks() {
		// Free blocks
		$this->register_block( new \DoubleScale\Modules\Campaigns\Emails\Blocks\TextBlock() );
		$this->register_block( new \DoubleScale\Modules\Campaigns\Emails\Blocks\ButtonBlock() );
		$this->register_block( new \DoubleScale\Modules\Campaigns\Emails\Blocks\ImageBlock() );
		$this->register_block( new \DoubleScale\Modules\Campaigns\Emails\Blocks\HtmlBlock() );
		$this->register_block( new \DoubleScale\Modules\Campaigns\Emails\Blocks\VideoBlock() );
		$this->register_block( new \DoubleScale\Modules\Campaigns\Emails\Blocks\TableBlock() );
		$this->register_block( new \DoubleScale\Modules\Campaigns\Emails\Blocks\SignatureBlock() );
		$this->register_block( new \DoubleScale\Modules\Campaigns\Emails\Blocks\PreheaderBlock() );

		/**
		 * Hook for registering additional email blocks (Pro blocks will be registered here)
		 *
		 * @param BlockRegistry $this Registry instance
		 */
		do_action( 'doublescale_register_email_blocks', $this );
	}
}
