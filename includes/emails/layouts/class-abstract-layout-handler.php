<?php
/**
 * Abstract Layout Handler
 *
 * @since 1.0.0
 *
 * @package QuillCRM
 */

namespace QuillCRM\Emails\Layouts;

/**
 * Base class for layout handlers
 */
abstract class Abstract_Layout_Handler implements Layout_Handler_Interface {
	/**
	 * Collect blocks with same containerId
	 *
	 * @param array  $blocks All blocks
	 * @param int    &$i Current index
	 * @param string $container_id Container ID to match
	 * @return array Collected blocks
	 */
	protected function collect_blocks_by_container( array $blocks, int &$i, string $container_id ): array {
		$collected = array();

		while ( $i < count( $blocks ) &&
				isset( $blocks[ $i ]['props']['inlineLayout'] ) && $blocks[ $i ]['props']['inlineLayout'] &&
				isset( $blocks[ $i ]['props']['containerId'] ) && $blocks[ $i ]['props']['containerId'] === $container_id ) {
			$collected[] = $blocks[ $i ];
			$i++;
		}

		return $collected;
	}

	/**
	 * Get gap from template layout
	 *
	 * @param array $template_layout Template layout settings
	 * @return string Gap value
	 */
	protected function get_gap( array $template_layout ): string {
		return isset( $template_layout['gap'] ) ? $template_layout['gap'] : '4px';
	}

	/**
	 * Render blocks in a table column
	 *
	 * @param array    $blocks Blocks to render
	 * @param callable $render_callback Render callback
	 * @return string HTML output
	 */
	protected function render_blocks_in_column( array $blocks, callable $render_callback ): string {
		$html = '';
		foreach ( $blocks as $block ) {
			$html .= $render_callback( $block );
		}
		return $html;
	}

	/**
	 * Create table wrapper with responsive support (hybrid/fluid approach)
	 * Uses a container that allows inline-block children to stack naturally
	 *
	 * @param string $content Table content
	 * @return string HTML output
	 */
	protected function wrap_in_table_row( string $content ): string {
		// Hybrid layout: outer table row with inner div that has font-size:0 to remove whitespace
		// The inline-block divs inside will stack naturally on narrow screens
		return '<tr><td style="padding: 10px 0;">' .
			   '<!--[if mso]><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr><![endif]-->' .
			   '<div style="font-size: 0; text-align: center;">' .
			   $content .
			   '</div>' .
			   '<!--[if mso]></tr></table><![endif]-->' .
			   '</td></tr>';
	}

	/**
	 * Create table cell with responsive stacking support (hybrid/fluid approach)
	 * Uses inline-block divs that stack naturally on narrow screens
	 *
	 * @param string $width Width percentage
	 * @param string $padding Padding style
	 * @param string $content Cell content
	 * @param string $extra_class Additional CSS class for responsive behavior
	 * @return string HTML output
	 */
	protected function create_table_cell( string $width, string $padding, string $content, string $extra_class = '' ): string {
		// Determine responsive class based on width
		$responsive_class = 'stack-column';
		if ( $width === '50%' ) {
			$responsive_class .= ' side-by-side';
		} elseif ( $width === '25%' ) {
			$responsive_class .= ' grid-col-25';
		} elseif ( $width === '33.33%' || $width === '33%' ) {
			$responsive_class .= ' grid-col-33';
		}
		
		if ( ! empty( $extra_class ) ) {
			$responsive_class .= ' ' . $extra_class;
		}

		// Calculate pixel width for max-width (based on 600px container)
		$width_num   = (float) str_replace( '%', '', $width );
		$pixel_width = round( ( $width_num / 100 ) * 600 );
		
		// Hybrid approach: use inline-block div that stacks naturally
		// This works without media queries in Gmail Web
		$html  = '<!--[if mso]><td width="' . $pixel_width . '" style="vertical-align: top; ' . $padding . '"><![endif]-->';
		$html .= '<div class="' . $responsive_class . '" style="display: inline-block; width: 100%; max-width: ' . $pixel_width . 'px; vertical-align: top;">';
		$html .= '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">';
		$html .= '<tr><td style="' . $padding . '">' . $content . '</td></tr>';
		$html .= '</table>';
		$html .= '</div>';
		$html .= '<!--[if mso]></td><![endif]-->';
		
		return $html;
	}

	/**
	 * Get default priority
	 *
	 * @return int
	 */
	public function get_priority(): int {
		return 10;
	}
}

