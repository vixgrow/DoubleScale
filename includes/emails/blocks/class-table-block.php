<?php
/**
 * Table Block
 *
 * @since 1.0.0
 *
 * @package QuillCRM
 */

namespace QuillCRM\Emails\Blocks;

use QuillCRM\Abstracts\Email_Block;

/**
 * Table block for emails
 */
class Table_Block extends Email_Block {
	/**
	 * Get block type
	 *
	 * @return string
	 */
	public function get_type(): string {
		return 'table';
	}

	/**
	 * Get block name
	 *
	 * @return string
	 */
	public function get_name(): string {
		return __( 'Table', 'quillcrm' );
	}

	/**
	 * Get default properties
	 *
	 * @return array
	 */
	public function get_default_props(): array {
		return array(
			'content'  => 'Your text here',
			'fontSize' => 16,
			'color'    => '#333',
			'align'    => 'center',
		);
	}

	/**
	 * Render block
	 *
	 * @param array $props Block properties
	 * @param array $merge_tags Merge tags
	 * @return string HTML output
	 */
	public function render( array $props, array $merge_tags = array() ): string {
		// Merge with default props
		$props = wp_parse_args( $props, $this->get_default_props() );

		// Process content for merge tags
		$content = $this->process_merge_tags( $props['content'], $merge_tags );

		// Build styles
		$styles = array(
			'font-size'  => $props['fontSize'] . 'px',
			'color'      => $props['color'],
			'text-align' => $props['align'],
		);

		$style_string = $this->build_style_string( $styles );

		return "<p style=\"{$style_string}\">{$content}</p>";
	}
}
