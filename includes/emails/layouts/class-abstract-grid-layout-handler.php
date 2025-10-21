<?php
/**
 * Abstract Grid Layout Handler
 *
 * @since 1.0.0
 *
 * @package QuillCRM
 */

namespace QuillCRM\Emails\Layouts;

/**
 * Base class for grid layout handlers
 */
abstract class Abstract_Grid_Layout_Handler extends Abstract_Layout_Handler {
	/**
	 * Get container ID for this grid
	 *
	 * @return string
	 */
	abstract protected function get_container_id(): string;

	/**
	 * Get column configuration
	 * Returns array of column configs: [ ['width' => '25%', 'blocks' => [0, 3]], ... ]
	 *
	 * @return array
	 */
	abstract protected function get_column_config(): array;

	/**
	 * Check if this handler can handle the given block
	 *
	 * @param array $block Block data
	 * @return bool
	 */
	public function can_handle( array $block ): bool {
		return isset( $block['props']['inlineLayout'] ) && $block['props']['inlineLayout'] &&
			   isset( $block['props']['containerId'] ) && $block['props']['containerId'] === $this->get_container_id();
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
		$grid_blocks = $this->collect_blocks_by_container( $blocks, $i, $container_id );
		$gap         = $this->get_gap( $template_layout );

		// Get column configuration
		$column_config = $this->get_column_config();
		$html          = '';

		// Render each column
		foreach ( $column_config as $index => $config ) {
			// Collect blocks for this column
			$column_blocks = array();
			foreach ( $config['blocks'] as $block_index ) {
				if ( isset( $grid_blocks[ $block_index ] ) ) {
					$column_blocks[] = $grid_blocks[ $block_index ];
				}
			}

			// Skip empty columns
			if ( empty( $column_blocks ) ) {
				continue;
			}

			// Determine padding based on position
			$padding = $this->get_column_padding( $index, count( $column_config ), $gap );

			// Render blocks in column
			$content = $this->render_blocks_in_column( $column_blocks, $render_block_callback );

			// Create table cell
			$html .= $this->create_table_cell( $config['width'], $padding, $content );
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
	 * Get handler priority (grids have higher priority)
	 *
	 * @return int
	 */
	public function get_priority(): int {
		return 20;
	}
}

