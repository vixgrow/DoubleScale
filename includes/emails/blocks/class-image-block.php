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

		// Container style
		$container_style = $this->build_style_string(
			array(
				'text-align'       => $props['align'],
				'background-color' => $props['backgroundColor'],
				'padding'          => $this->format_padding( $props['padding'] ),
			)
		);

		// Image style
		$img_style = $this->build_style_string(
			array(
				'width'         => $props['width'],
				'max-width'     => '100%',
				'height'        => $props['height'],
				'border-radius' => $props['borderRadius'] . 'px',
				'display'       => 'inline-block',
			)
		);

		// If no image source, return placeholder
		if ( empty( $props['src'] ) ) {
			return "<div style=\"{$container_style}\">
				<div style=\"width:100px;height:100px;background-color:#f5f5f5;display:flex;align-items:center;justify-content:center;border-radius:{$props['borderRadius']}px;margin:0 auto;\">
					" . esc_html__( 'Image', 'quillcrm' ) . '
				</div>
			</div>';
		}

		// Output with optional link wrapper
		$output = "<div style=\"{$container_style}\">";

		if ( $link ) {
			$output .= "<a href=\"{$link}\" target=\"_blank\" style=\"text-decoration:none;border:0;\">";
		}

		$output .= "<img src=\"{$props['src']}\" alt=\"{$props['alt']}\" style=\"{$img_style}\" />";

		if ( $link ) {
			$output .= '</a>';
		}

		$output .= '</div>';

		return $output;
	}
}



