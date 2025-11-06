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
				'top'    => 0,
				'right'  => 0,
				'bottom' => 0,
				'left'   => 0,
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

		// Container style (matching frontend)
		$container_style = $this->build_style_string(
			array(
				'width'   => $props['width'] . '%',
				'padding' => $this->format_padding( $props['padding'] ),
			)
		);

		// Check if content is empty, default, or just whitespace (matching frontend)
		$is_default_content = empty( $content ) ||
			trim( $content ) === '' ||
			$content === '<p>Insert your HTML here</p>' ||
			trim( $content ) === '<p>Insert your HTML here</p>';

		// Generate unique ID for this HTML block (matching frontend)
		$unique_id = 'html-block-' . substr( md5( rand() ), 0, 9 );

		// Use CSS string directly (matching frontend)
		$css_string = $props['customCss'] ?? '';

		// Inner content style (matching frontend)
		$inner_style = $this->build_style_string(
			array(
				'width'           => '100%',
				'min-height'      => '50px',
				'display'         => 'flex',
				'align-items'     => 'center',
				'justify-content' => 'center',
				'color'           => '#666',
				'font-size'       => '14px',
			)
		);

		// Build the output
		$style_tag = '';
		if ( ! empty( $css_string ) ) {
			$style_tag = "<style>{$css_string}</style>";
		}

		$inner_content = '';
		if ( $is_default_content ) {
			$inner_content = '<span style="font-size: 32px; font-weight: 600; color: #1E3A8A;">' .
				esc_html__( 'Add your own html here', 'quillcrm' ) . '</span>';
		} else {
			$inner_content = "<div id=\"{$unique_id}\" style=\"width: 100%;\">{$content}</div>";
		}

		// Use table structure for better email client compatibility
		return "{$style_tag}<table role=\"presentation\" width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" border=\"0\">
			<tr>
				<td style=\"{$container_style}\">
					<div style=\"{$inner_style}\">{$inner_content}</div>
				</td>
			</tr>
		</table>";
	}
}



