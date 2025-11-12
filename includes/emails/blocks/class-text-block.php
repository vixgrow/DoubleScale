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
	 * @param array                                    $props Block properties
	 * @param Contact_Model|Automation_Contact_Model|null $contact Contact model for merge tags
	 * @return string HTML output
	 */
	public function render( array $props, $contact = null ): string {
		// Merge with default props
		$props = wp_parse_args( $props, $this->get_default_props() );

		// Process content for merge tags
		$content = $this->process_merge_tags( $props['content'], $contact );

		// Get font size based on heading style (matches frontend getFontSize)
		// Ensure fontSize is an integer (remove 'px' suffix if present)
		$base_font_size = is_numeric( $props['fontSize'] ) ? (int) $props['fontSize'] : (int) str_replace( 'px', '', $props['fontSize'] );
		$font_size      = $this->get_adjusted_font_size( $base_font_size, $props['headingStyle'] );

		// Check if content has HTML formatting (matches frontend hasHtmlFormatting)
		$has_html_formatting = $this->has_html_formatting( $content );

		// Build styles (matches frontend div styles)
		$styles = array(
			'font-size'        => $font_size . 'px',
			'color'            => $props['color'],
			'text-align'       => $props['textAlign'],
			'font-family'      => $props['fontFamily'],
			'line-height'      => $props['lineHeight'],
			'letter-spacing'   => $props['letterSpacing'],
			'border-radius'    => $props['borderRadius'],
			'border-width'     => $props['borderWidth'],
			'background-color' => $props['backgroundColor'],
			'padding'          => $this->format_padding_multiplied( $props['padding'] ),
			'margin'           => '0',
			'word-wrap'        => 'break-word',
			'overflow-wrap'    => 'break-word',
			'max-width'        => '100%',
			'white-space'      => 'normal',
			'width'            => '100%',
			'box-sizing'       => 'border-box',
			'overflow'         => 'hidden',
		);

		// Only apply formatting styles if no HTML formatting exists (matches frontend logic)
		if ( ! $has_html_formatting ) {
			if ( ! empty( $props['bold'] ) ) {
				$styles['font-weight'] = 'bold';
			} else {
				$styles['font-weight'] = 'normal';
			}

			if ( ! empty( $props['italic'] ) ) {
				$styles['font-style'] = 'italic';
			} else {
				$styles['font-style'] = 'normal';
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
			} else {
				$styles['text-decoration'] = 'none';
			}
		}

		$style_string = $this->build_style_string( $styles );

		// Get element type based on heading style (matches frontend getElementType)
		$element_type = $this->get_element_type( $props['headingStyle'] );

		// Simple div structure matching frontend exactly
		return "<div style=\"{$style_string}\">{$content}</div>";
	}

	/**
	 * Get adjusted font size based on heading style
	 * NOTE: Frontend handles font size multiplication in the editor UI,
	 * but the actual fontSize value saved is already the final size.
	 * Backend should use the fontSize value directly without multiplication.
	 *
	 * @param int    $font_size Base font size (already adjusted in frontend)
	 * @param string $heading_style Heading style
	 * @return int Font size to use
	 */
	private function get_adjusted_font_size( int $font_size, string $heading_style ): int {
		// The fontSize prop already contains the correct size from the frontend
		// No need to multiply again - just use it directly
		return $font_size;
	}

	/**
	 * Get element type based on heading style (matches frontend getElementType)
	 *
	 * @param string $heading_style Heading style
	 * @return string HTML element type
	 */
	private function get_element_type( string $heading_style ): string {
		switch ( $heading_style ) {
			case 'h1':
			case 'h2':
			case 'h3':
				return $heading_style;
			case 'small':
				return 'small';
			default:
				return 'p';
		}
	}

	/**
	 * Check if content has HTML formatting (matches frontend hasHtmlFormatting)
	 *
	 * @param string $content Content to check
	 * @return bool Whether content has HTML formatting
	 */
	private function has_html_formatting( string $content ): bool {
		return ! empty( $content ) && strpos( $content, '<' ) !== false && strpos( $content, '>' ) !== false;
	}

	/**
	 * Format padding with multipliers (matches frontend)
	 *
	 * @param array|null $padding Padding object
	 * @return string CSS padding string
	 */
	private function format_padding_multiplied( $padding ) {
		if ( ! $padding ) {
			return '0';
		}

		$top    = isset( $padding['top'] ) ? $padding['top'] * 2 : 0;
		$right  = isset( $padding['right'] ) ? $padding['right'] * 4 : 0;
		$bottom = isset( $padding['bottom'] ) ? $padding['bottom'] * 2 : 0;
		$left   = isset( $padding['left'] ) ? $padding['left'] * 4 : 0;

		return "{$top}px {$right}px {$bottom}px {$left}px";
	}
}



