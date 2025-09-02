<?php
/**
 * HTML Block
 *
 * @since 1.0.0
 *
 * @package QuillCRM
 */

namespace QuillCRM\Emails\Blocks;

use QuillCRM\Abstracts\Email_Block;

/**
 * HTML block for emails
 */
class HTML_Block extends Email_Block {
	/**
	 * Get block type
	 *
	 * @return string
	 */
	public function get_type(): string {
		return 'html';
	}

	/**
	 * Get block name
	 *
	 * @return string
	 */
	public function get_name(): string {
		return __( 'HTML', 'quillcrm' );
	}

	/**
	 * Get default properties
	 *
	 * @return array
	 */
	public function get_default_props(): array {
		return array(
			'content'   => '',
			'customCss' => '',
			'width'     => '100',
			'padding'   => array(
				'top'    => 10,
				'right'  => 10,
				'bottom' => 10,
				'left'   => 10,
			),
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

		// Process the HTML content for merge tags
		$content = $this->process_merge_tags( $props['content'], $merge_tags );

		// Container style
		$container_style = $this->build_style_string(
			array(
				'width'   => $props['width'] . '%',
				'padding' => $this->format_padding( $props['padding'] ),
			)
		);

		// Try to apply custom CSS if provided and valid
		$custom_css = '';
		if ( ! empty( $props['customCss'] ) ) {
			try {
				$css_array = json_decode( $props['customCss'], true );
				if ( is_array( $css_array ) ) {
					$inline_css = '';
					foreach ( $css_array as $prop => $value ) {
						$css_prop    = $this->convert_camel_to_kebab( $prop );
						$inline_css .= "{$css_prop}: {$value} !important; ";
					}
					$custom_css = $inline_css;
				}
			} catch ( \Exception $e ) {
				// Invalid JSON, ignore custom CSS
			}
		}

		// Generate a unique ID for this HTML block to target with CSS
		$unique_id = 'html-block-' . substr( md5( rand() ), 0, 10 );

		// If content is empty, return placeholder
		if ( empty( $content ) ) {
			return "<div style=\"{$container_style}\">
				<div style=\"padding:20px;text-align:center;border:1px dashed #ccc;\">
					" . esc_html__( 'Add your custom HTML here', 'quillcrm' ) . '
				</div>
			</div>';
		}

		// Add inline style tag for custom CSS
		$style_tag = '';
		if ( ! empty( $custom_css ) ) {
			$style_tag = "<style>#{$unique_id} * { {$custom_css} }</style>";
		}

		return "{$style_tag}<div style=\"{$container_style}\">
			<div id=\"{$unique_id}\">{$content}</div>
		</div>";
	}
}



