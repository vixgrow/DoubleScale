<?php
/**
 * Generic Inline Layout Handler
 *
 * @since 1.0.0
 *
 * @package QuillCRM
 */

namespace QuillCRM\Emails\Layouts;

/**
 * Generic inline layout handler - uses flexBasis from blocks
 */
class Generic_Inline_Layout_Handler extends Abstract_Layout_Handler {
	/**
	 * Check if this handler can handle the given block
	 *
	 * @param array $block Block data
	 * @return bool
	 */
	public function can_handle( array $block ): bool {
		return isset( $block['props']['inlineLayout'] ) && $block['props']['inlineLayout'] &&
			   isset( $block['props']['containerId'] );
	}

	/**
	 * Render the layout
	 *
	 * @param array    $blocks All blocks in column
	 * @param int      &$i Current index
	 * @param callable $render_block_callback Callback to render individual blocks
	 * @return string HTML output
	 */
	public function render( array $blocks, int &$i, callable $render_block_callback ): string {
		$container_id    = $blocks[ $i ]['props']['containerId'];
		$first_block     = $blocks[ $i ];
		$template_layout = isset( $first_block['props']['templateLayout'] ) ? $first_block['props']['templateLayout'] : array();

		// Collect all blocks with the same containerId
		$inline_blocks = $this->collect_blocks_by_container( $blocks, $i, $container_id );
		$gap           = $this->get_gap( $template_layout );
		$html          = '';

		// Render each block as a column
		foreach ( $inline_blocks as $index => $block ) {
			// Get flex basis and convert to percentage
			$flex_basis = isset( $block['props']['flexBasis'] ) ? $block['props']['flexBasis'] : 'auto';

			// Convert flex-basis to width percentage
			if ( strpos( $flex_basis, '%' ) !== false ) {
				$width = $flex_basis;
			} else {
				// Default to equal distribution
				$width = ( 100 / count( $inline_blocks ) ) . '%';
			}

			// Determine padding based on position
			$padding = $this->get_column_padding( $index, count( $inline_blocks ), $gap );

			// Render block
			$content = $render_block_callback( $block );

			// Create table cell
			$html .= $this->create_table_cell( $width, $padding, $content );
		}

		return $this->wrap_in_table_row( $html );
	}

	/**
	 * Get padding for column based on position
	 *
	 * @param int    $index Column index
	 * @param int    $total Total columns
	 * @param string $gap Gap value
	 * @return string Padding style
	 */
	protected function get_column_padding( int $index, int $total, string $gap ): string {
		if ( $index === 0 ) {
			return "padding-right: {$gap};";
		} elseif ( $index === $total - 1 ) {
			return "padding-left: {$gap};";
		} else {
			return "padding: 0 {$gap};";
		}
	}

	/**
	 * Get handler name
	 *
	 * @return string
	 */
	public function get_name(): string {
		return 'Generic Inline Layout';
	}

	/**
	 * Get handler priority (lowest - fallback)
	 *
	 * @return int
	 */
	public function get_priority(): int {
		return 5;
	}
}

