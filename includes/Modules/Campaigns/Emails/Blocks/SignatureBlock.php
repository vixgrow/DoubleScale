<?php
/**
 * Signature Block
 *
 * @since 1.0.0
 *
 * @package DoubleScale\Pro
 */

namespace DoubleScale\Modules\Campaigns\Emails\Blocks;


defined( 'ABSPATH' ) || exit;

use DoubleScale\Modules\Campaigns\Abstracts\EmailBlock;

/**
 * Signature block for emails
 */
class SignatureBlock extends EmailBlock {
	/**
	 * Get block type
	 *
	 * @return string
	 */
	public function get_type(): string {
		return 'signature';
	}

	/**
	 * Get block name
	 *
	 * @return string
	 */
	public function get_name(): string {
		return __( 'Signature', 'doublescale');
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
	 * @param array                                       $props Block properties
	 * @param ContactModel|AutomationContactModel|null $contact Contact model for merge tags
	 * @return string HTML output
	 */
	public function render( array $props, $contact = null ): string {
		// Merge with default props
		$props = wp_parse_args( $props, $this->get_default_props() );

		// Process content for merge tags
		$content = $this->process_merge_tags( $props['content'], $contact );

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
