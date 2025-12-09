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
	 * Create table wrapper
	 *
	 * @param string $content Table content
	 * @return string HTML output
	 */
	protected function wrap_in_table_row( string $content ): string {
		return '<tr><td style="padding: 10px 0;">' .
			   '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">' .
			   '<tr>' . $content . '</tr>' .
			   '</table>' .
			   '</td></tr>';
	}

	/**
	 * Create table cell
	 *
	 * @param string $width Width percentage
	 * @param string $padding Padding style
	 * @param string $content Cell content
	 * @return string HTML output
	 */
	protected function create_table_cell( string $width, string $padding, string $content ): string {
		return sprintf(
			'<td width="%s" class="gallery-item" style="vertical-align: top; %s">%s</td>',
			$width,
			$padding,
			$content
		);
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

