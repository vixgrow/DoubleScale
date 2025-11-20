<?php
/**
 * Block Registry
 *
 * @since 1.0.0
 *
 * @package QuillCRM
 */

namespace QuillCRM\Emails;

use QuillCRM\Emails\Blocks\Email_Block_Interface;
use QuillCRM\Models\Contact_Model;
use QuillCRM\Models\Automation_Contact_Model;

/**
 * Registry for email blocks
 */
class Block_Registry {
	/**
	 * Registered blocks
	 *
	 * @var Email_Block_Interface[]
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
	 * @return Block_Registry
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
	 * @param Email_Block_Interface $block Block instance
	 * @return Block_Registry
	 */
	public function register_block( Email_Block_Interface $block ) {
		$this->blocks[ $block->get_type() ] = $block;
		return $this;
	}

	/**
	 * Get a block by type
	 *
	 * @param string $type Block type
	 * @return Email_Block_Interface|null
	 */
	public function get_block( $type ) {
		return isset( $this->blocks[ $type ] ) ? $this->blocks[ $type ] : null;
	}

	/**
	 * Get all registered blocks
	 *
	 * @return Email_Block_Interface[]
	 */
	public function get_blocks() {
		return $this->blocks;
	}

	/**
	 * Render a block
	 *
	 * @param string                                    $type Block type
	 * @param array                                     $props Block properties
	 * @param Contact_Model|Automation_Contact_Model|null $contact Contact model for merge tags
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
		$this->register_block( new \QuillCRM\Emails\Blocks\Text_Block() );
		$this->register_block( new \QuillCRM\Emails\Blocks\Button_Block() );
		$this->register_block( new \QuillCRM\Emails\Blocks\Image_Block() );
		$this->register_block( new \QuillCRM\Emails\Blocks\HTML_Block() );
		$this->register_block( new \QuillCRM\Emails\Blocks\Video_Block() );
		$this->register_block( new \QuillCRM\Emails\Blocks\Table_Block() );
		$this->register_block( new \QuillCRM\Emails\Blocks\Signature_Block() );
		$this->register_block( new \QuillCRM\Emails\Blocks\Preheader_Block() );

		/**
		 * Hook for registering additional email blocks (Pro blocks will be registered here)
		 *
		 * @param Block_Registry $this Registry instance
		 */
		do_action( 'quillcrm_register_email_blocks', $this );
	}
}
