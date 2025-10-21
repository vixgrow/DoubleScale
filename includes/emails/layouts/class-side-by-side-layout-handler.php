<?php
/**
 * Side-by-Side Layout Handler (50% + 50%)
 *
 * @since 1.0.0
 *
 * @package QuillCRM
 */

namespace QuillCRM\Emails\Layouts;

/**
 * Side-by-side layout handler
 */
class Side_By_Side_Layout_Handler extends Abstract_Layout_Handler {
	/**
	 * Check if this handler can handle the given block
	 *
	 * @param array $block Block data
	 * @return bool
	 */
	public function can_handle( array $block ): bool {
		return isset( $block['props']['sideBySideLayout'] ) && $block['props']['sideBySideLayout'];
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
		$left_blocks  = array();
		$right_blocks = array();

		// Collect all blocks with sideBySideLayout
		while ( $i < count( $blocks ) && isset( $blocks[ $i ]['props']['sideBySideLayout'] ) && $blocks[ $i ]['props']['sideBySideLayout'] ) {
			$block = $blocks[ $i ];

			if ( isset( $block['props']['sideBySidePosition'] ) && $block['props']['sideBySidePosition'] === 'left' ) {
				$left_blocks[] = $block;
			} elseif ( isset( $block['props']['sideBySidePosition'] ) && $block['props']['sideBySidePosition'] === 'right' ) {
				$right_blocks[] = $block;
			}

			$i++;
		}

		// Render left column
		$left_content = $this->render_blocks_in_column( $left_blocks, $render_block_callback );
		$left_cell    = $this->create_table_cell( '50%', 'padding-right: 5px;', $left_content );

		// Render right column
		$right_content = $this->render_blocks_in_column( $right_blocks, $render_block_callback );
		$right_cell    = $this->create_table_cell( '50%', 'padding-left: 5px;', $right_content );

		return $this->wrap_in_table_row( $left_cell . $right_cell );
	}

	/**
	 * Get handler name
	 *
	 * @return string
	 */
	public function get_name(): string {
		return 'Side-by-Side (50% + 50%)';
	}

	/**
	 * Get handler priority (higher than grids)
	 *
	 * @return int
	 */
	public function get_priority(): int {
		return 30;
	}
}

