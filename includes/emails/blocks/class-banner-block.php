<?php
/**
 * Banner Block
 *
 * @since 1.0.0
 *
 * @package QuillCRM
 */

namespace QuillCRM\Emails\Blocks;

use QuillCRM\Abstracts\Email_Block;

/**
 * Banner block for emails
 */
class Banner_Block extends Email_Block {
	/**
	 * Get block type
	 *
	 * @return string
	 */
	public function get_type(): string {
		return 'banner';
	}

	/**
	 * Get block name
	 *
	 * @return string
	 */
	public function get_name(): string {
		return __( 'Banner', 'quillcrm' );
	}

	/**
	 * Get default properties
	 *
	 * @return array
	 */
	public function get_default_props(): array {
		return array(
			'content'         => 'Your text here',
			'fontSize'        => 16,
			'color'           => '#333',
			'align'           => 'center',
			'src'             => '',
			'alt'             => 'Banner',
			'backgroundColor' => '#f3f4f6',
			'padding'         => array(
				'top'    => 20,
				'right'  => 20,
				'bottom' => 20,
				'left'   => 20,
			),
			'link'            => '',
			'borderRadius'    => '9999',
			'shape'           => 'circle',
			'rotation'        => 0,
			'width'           => '200px',
			'height'          => 'auto',
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

		// Process content and link for merge tags
		$content = $this->process_merge_tags( $props['content'], $merge_tags );
		$link    = ! empty( $props['link'] ) ? $this->process_merge_tags( $props['link'], $merge_tags ) : '';

		// Container style with proper sizing
		$container_style = $this->build_style_string(
			array(
				'background-color' => $props['backgroundColor'],
				'padding'          => $this->format_padding( $props['padding'] ),
				'text-align'       => $props['align'],
				'border-radius'    => $props['borderRadius'] . 'px',
				'width'            => $props['width'],
				'height'           => $props['height'],
				'max-width'        => '100%',
				'display'          => 'inline-block',
				'vertical-align'   => 'top',
			)
		);

		// Handle alignment properly
		$text_align = 'center'; // default
		if ( $props['align'] === 'left' ) {
			$text_align = 'left';
		} elseif ( $props['align'] === 'right' ) {
			$text_align = 'right';
		} elseif ( $props['align'] === 'center' ) {
			$text_align = 'center';
		}

		// Text style
		$text_style = $this->build_style_string(
			array(
				'font-size'   => $props['fontSize'] . 'px',
				'color'       => $props['color'],
				'margin'      => '0',
				'line-height' => '1.4',
				'text-align'  => $text_align,
			)
		);

		// Image style with proper sizing and alignment
		$img_margin = '0 auto';
		if ( $text_align === 'left' ) {
			$img_margin = '0 auto 0 0';
		} elseif ( $text_align === 'right' ) {
			$img_margin = '0 0 0 auto';
		}

		$img_style = $this->build_style_string(
			array(
				'width'         => '100%',
				'max-width'     => '100%',
				'height'        => 'auto',
				'border-radius' => $props['shape'] === 'circle' ? '50%' : $props['borderRadius'] . 'px',
				'display'       => 'block',
				'margin'        => $img_margin,
				'transform'     => $props['rotation'] !== 0 ? 'rotate(' . $props['rotation'] . 'deg)' : 'none',
			)
		);

		// Use table-based layout for better email compatibility
		$table_style = $this->build_style_string(
			array(
				'width'            => '100%',
				'max-width'        => '100%',
				'border-collapse'  => 'collapse',
				'margin'           => '0',
			)
		);

		$cell_style = $this->build_style_string(
			array(
				'padding'    => '0',
				'text-align' => $text_align,
				'vertical-align' => 'top',
				'width'      => '100%',
			)
		);

		// Inner container for the banner content
		$inner_container_style = $this->build_style_string(
			array(
				'width'            => $props['width'],
				'max-width'        => '100%',
				'background-color' => $props['backgroundColor'],
				'border-radius'    => $props['borderRadius'] . 'px',
				'padding'          => $this->format_padding( $props['padding'] ),
				'display'          => 'inline-block',
				'vertical-align'   => 'top',
			)
		);

		$output = "<table style=\"{$table_style}\" cellpadding=\"0\" cellspacing=\"0\" border=\"0\">
			<tr>
				<td style=\"{$cell_style}\">
					<div style=\"{$inner_container_style}\">";

		// Add image if source is provided
		if ( ! empty( $props['src'] ) ) {
			$image_html = "<img src=\"{$props['src']}\" alt=\"{$props['alt']}\" style=\"{$img_style}\" />";
			
			// Wrap image in link if provided
			if ( $link ) {
				$image_html = "<a href=\"{$link}\" target=\"_blank\" style=\"text-decoration:none;border:0;\">{$image_html}</a>";
			}
			
			$output .= $image_html;
		}

		// Add text content only if it's not the default placeholder or if there's no image
		$should_show_text = false;
		if ( ! empty( $content ) && $content !== 'Your text here' ) {
			$should_show_text = true;
		} elseif ( empty( $props['src'] ) && ! empty( $content ) ) {
			$should_show_text = true;
		}

		if ( $should_show_text ) {
			$text_html = "<p style=\"{$text_style}\">{$content}</p>";
			
			// Wrap text in link if provided and no image
			if ( $link && empty( $props['src'] ) ) {
				$text_html = "<a href=\"{$link}\" target=\"_blank\" style=\"text-decoration:none;color:inherit;\">{$text_html}</a>";
			}
			
			$output .= $text_html;
		}

		// If no content and no image, show placeholder
		if ( empty( $content ) && empty( $props['src'] ) ) {
			$output .= "<p style=\"{$text_style}\">" . esc_html__( 'Banner content', 'quillcrm' ) . "</p>";
		}

		$output .= "</div>
				</td>
			</tr>
		</table>";

		return $output;
	}
}
