<?php
/**
 * Text Block
 *
 * @since 1.0.0
 *
 * @package QuillCRM
 */

namespace QuillCRM\Emails\Blocks;

use QuillCRM\Abstracts\Email_Block;

/**
 * Text block for emails
 */
class Text_Block extends Email_Block {
	/**
	 * Get block type
	 *
	 * @return string
	 */
	public function get_type(): string {
		return 'text';
	}

	/**
	 * Get block name
	 *
	 * @return string
	 */
	public function get_name(): string {
		return __( 'Text', 'quillcrm' );
	}

	/**
	 * Get default properties
	 *
	 * @return array
	 */
	public function get_default_props(): array {
		return array(
			'content'         => '<p>Your text here</p>',
			'hyperlink'       => 'https://',
			'fontSize'        => 16,
			'color'           => '#333',
			'align'           => 'center',
			'fontFamily'      => 'Arial',
			'bold'            => false,
			'italic'          => false,
			'underline'       => false,
			'line-through'    => false,
			'lineHeight'      => '1.5',
			'letterSpacing'   => '0px',
			'borderRadius'    => '0px',
			'borderWidth'     => '0px',
			'linkColor'       => '#333',
			'backgroundColor' => 'transparent',
			'textAlign'       => 'left',
			'listType'        => 'none',
			'headingStyle'    => 'p',
			'padding'         => array(
				'top'    => 4,
				'right'  => 8,
				'bottom' => 4,
				'left'   => 8,
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

		// Process content for merge tags
		$content = $this->process_merge_tags( $props['content'], $merge_tags );

		// Build styles
		$styles = array(
			'font-family'      => $props['fontFamily'],
			'font-size'        => $props['fontSize'] . 'px',
			'color'            => $props['color'],
			'text-align'       => $props['textAlign'],
			'line-height'      => $props['lineHeight'],
			'letter-spacing'   => $props['letterSpacing'],
			'background-color' => $props['backgroundColor'],
			'padding'          => $this->format_padding( $props['padding'] ),
		);

		// Add conditional formatting
		if ( ! empty( $props['bold'] ) ) {
			$styles['font-weight'] = 'bold';
		}

		if ( ! empty( $props['italic'] ) ) {
			$styles['font-style'] = 'italic';
		}

		// Handle text decoration
		$text_decoration = array();
		if ( ! empty( $props['underline'] ) ) {
			$text_decoration[] = 'underline';
		}

		if ( ! empty( $props['line-through'] ) ) {
			$text_decoration[] = 'line-through';
		}

		if ( ! empty( $text_decoration ) ) {
			$styles['text-decoration'] = implode( ' ', $text_decoration );
		}

		$style_string = $this->build_style_string( $styles );

		// Use table structure for better email client compatibility
		return "<table role=\"presentation\" width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" border=\"0\">
			<tr>
				<td style=\"{$style_string}\">{$content}</td>
			</tr>
		</table>";
	}
}



