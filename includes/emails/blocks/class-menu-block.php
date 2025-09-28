<?php
/**
 * Menu Block
 *
 * @since 1.0.0
 *
 * @package QuillCRM
 */

namespace QuillCRM\Emails\Blocks;

use QuillCRM\Abstracts\Email_Block;

/**
 * Menu block for emails
 */
class Menu_Block extends Email_Block {
	/**
	 * Get block type
	 *
	 * @return string
	 */
	public function get_type(): string {
		return 'menu';
	}

	/**
	 * Get block name
	 *
	 * @return string
	 */
	public function get_name(): string {
		return __( 'Menu', 'quillcrm' );
	}

	/**
	 * Get default properties
	 *
	 * @return array
	 */
	public function get_default_props(): array {
		return array(
			'menuItems' => array(
				array(
					'id'              => '1',
					'name'            => 'Menu Item 01',
					'link'            => '#',
					'fontSize'        => 16,
					'color'           => '#333',
					'fontFamily'      => 'Arial',
					'bold'            => false,
					'italic'          => false,
					'underline'       => false,
					'strikethrough'   => false,
					'backgroundColor' => 'transparent',
					'borderRadius'    => '0',
					'letterSpacing'   => '0px',
				),
				array(
					'id'              => '2',
					'name'            => 'Menu Item 02',
					'link'            => '#',
					'fontSize'        => 16,
					'color'           => '#333',
					'fontFamily'      => 'Arial',
					'bold'            => false,
					'italic'          => false,
					'underline'       => false,
					'strikethrough'   => false,
					'backgroundColor' => 'transparent',
					'borderRadius'    => '0',
					'letterSpacing'   => '0px',
				),
			),
			'padding'   => array(
				'top'    => 4,
				'right'  => 8,
				'bottom' => 4,
				'left'   => 8,
			),
			'align'     => 'center',
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

		// Build container styles
		$container_styles = array(
			'display'     => 'flex',
			'gap'         => '16px',
			'align-items' => 'center',
			'flex-wrap'   => 'wrap',
			'padding'     => $this->format_padding( $props['padding'] ),
		);

		// Add alignment class
		$justify_content = $this->get_alignment_justify( $props['align'] );
		if ( $justify_content ) {
			$container_styles['justify-content'] = $justify_content;
		}

		$container_style_string = $this->build_style_string( $container_styles );

		$menu_items_html = '';
		foreach ( $props['menuItems'] as $index => $item ) {
			$menu_items_html .= $this->render_menu_item( $item, $index, $merge_tags );
		}

		return "<div style=\"{$container_style_string}\">{$menu_items_html}</div>";
	}

	/**
	 * Render individual menu item
	 *
	 * @param array $item Menu item properties
	 * @param int   $index Item index
	 * @param array $merge_tags Merge tags
	 * @return string HTML output
	 */
	private function render_menu_item( array $item, int $index, array $merge_tags ): string {
		// Process content for merge tags
		$name = $this->process_merge_tags( $item['name'], $merge_tags );
		$link = $this->process_merge_tags( $item['link'], $merge_tags );

		// Handle text decoration
		$text_decoration = array();
		if ( ! empty( $item['underline'] ) ) {
			$text_decoration[] = 'underline';
		}
		if ( ! empty( $item['strikethrough'] ) ) {
			$text_decoration[] = 'line-through';
		}

		// Build menu item styles
		$item_styles = array(
			'font-size'             => $item['fontSize'] . 'px',
			'color'                 => $item['color'],
			'font-family'           => $item['fontFamily'],
			'font-weight'           => ! empty( $item['bold'] ) ? 'bold' : 'normal',
			'font-style'            => ! empty( $item['italic'] ) ? 'italic' : 'normal',
			'text-decoration'       => ! empty( $text_decoration ) ? implode( ' ', $text_decoration ) : 'none',
			'background-color'      => $item['backgroundColor'],
			'border-radius'         => $item['borderRadius'] . 'px',
			'letter-spacing'        => $item['letterSpacing'],
			'text-decoration-color' => $item['color'],
		);

		$item_style_string = $this->build_style_string( $item_styles );

		// Use name or fallback to default
		$display_name = ! empty( $name ) ? $name : 'MenuItem ' . str_pad( $index + 1, 2, '0', STR_PAD_LEFT );

		return "<a href=\"{$link}\" style=\"{$item_style_string}\">{$display_name}</a>";
	}

	/**
	 * Get alignment justify content value
	 *
	 * @param string $align Alignment value
	 * @return string Justify content value
	 */
	private function get_alignment_justify( string $align ): string {
		switch ( $align ) {
			case 'left':
				return 'flex-start';
			case 'right':
				return 'flex-end';
			case 'center':
			default:
				return 'center';
		}
	}
}
