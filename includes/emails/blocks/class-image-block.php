<?php
/**
 * Image Block
 *
 * @since 1.0.0
 *
 * @package QuillCRM
 */

namespace QuillCRM\Emails\Blocks;

use QuillCRM\Abstracts\Email_Block;

/**
 * Image block for emails
 */
class Image_Block extends Email_Block {
	/**
	 * Get block type
	 *
	 * @return string
	 */
	public function get_type(): string {
		return 'image';
	}

	/**
	 * Get block name
	 *
	 * @return string
	 */
	public function get_name(): string {
		return __( 'Image', 'quillcrm' );
	}

	/**
	 * Get default properties
	 *
	 * @return array
	 */
	public function get_default_props(): array {
		return array(
			'src'             => '',
			'alt'             => 'Image',
			'width'           => '100%',
			'height'          => 'auto',
			'align'           => 'center',
			'backgroundColor' => 'transparent',
			'padding'         => array(
				'top'    => 0,
				'right'  => 0,
				'bottom' => 0,
				'left'   => 0,
			),
			'link'            => '',
			'borderRadius'    => '0',
			'shape'           => 'rectangle',
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

		// Process link for merge tags
		$link = ! empty( $props['link'] ) ? $this->process_merge_tags( $props['link'], $merge_tags ) : '';

		// Wrapper style (matches frontend wrapperStyle)
		$wrapper_style = $this->build_style_string(
			array(
				'text-align' => $props['align'],
				'width'      => '100%',
			)
		);

		// Container style (matches frontend containerStyle)
		$container_style = $this->build_style_string(
			array(
				'background-color' => $props['backgroundColor'],
				'padding'          => $this->format_padding( $props['padding'] ),
				'border-radius'    => $props['borderRadius'] . 'px',
				'display'          => 'inline-block',
			)
		);

		// Image style (matches frontend imageStyle)
		$image_style = $this->build_style_string(
			array(
				'width'         => $props['width'],
				'height'        => $props['height'] === 'auto' ? 'auto' : $props['height'],
				'max-width'     => '100%',
				'border-radius' => $props['borderRadius'] . 'px',
				'display'       => 'block',
				'border'        => '0',
				'outline'       => 'none',
			)
		);

		// Placeholder style (matches frontend placeholderStyle)
		$placeholder_style = $this->build_style_string(
			array(
				'width'            => $props['width'],
				'height'           => $props['height'] === 'auto' ? '200px' : $props['height'],
				'max-width'        => '100%',
				'border-radius'    => $props['borderRadius'] . 'px',
				'display'          => 'flex',
				'align-items'      => 'center',
				'justify-content'  => 'center',
				'background-color' => '#F5F5F580',
				'color'            => '#6B7280',
				'font-size'        => '14px',
				'font-weight'      => '500',
			)
		);

		// Simple div structure - already wrapped in table cell by renderer
		$output  = "<div style=\"{$wrapper_style}\">";
		$output .= "<span style=\"{$container_style}\">";

		// Build the image or placeholder
		if ( ! empty( $props['src'] ) ) {
			// Render image
			$image = "<img src=\"{$props['src']}\" alt=\"{$props['alt']}\" style=\"{$image_style}\" />";

			// Wrap in link if provided
			if ( $link ) {
				$output .= "<a href=\"{$link}\" target=\"_blank\" rel=\"noopener noreferrer\" style=\"text-decoration:none;display:block;\">{$image}</a>";
			} else {
				$output .= $image;
			}
		} else {
			// Render placeholder
			$output .= "<div style=\"{$placeholder_style}\">📷</div>";
		}

		$output .= '</span>';
		$output .= '</div>';

		return $output;
	}
}



