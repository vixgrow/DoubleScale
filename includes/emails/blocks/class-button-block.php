<?php
/**
 * Button Block
 *
 * @since 1.0.0
 *
 * @package QuillCRM
 */

namespace QuillCRM\Emails\Blocks;

use QuillCRM\Abstracts\Email_Block;

/**
 * Button block for emails
 */
class Button_Block extends Email_Block {
	/**
	 * Get block type
	 *
	 * @return string
	 */
	public function get_type(): string {
		return 'button';
	}

	/**
	 * Get block name
	 *
	 * @return string
	 */
	public function get_name(): string {
		return __( 'Button', 'quillcrm' );
	}

	/**
	 * Get default properties
	 *
	 * @return array
	 */
	public function get_default_props(): array {
		return array(
			'text'                     => 'Click Here',
			'url'                      => '#',
			'containerPadding'         => array(
				'top'    => 0,
				'right'  => 0,
				'bottom' => 0,
				'left'   => 0,
			),
			'containerBackgroundColor' => 'transparent',
			'align'                    => 'center',
			'buttonStyle'              => 'primary',
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

		// Process text and URL for merge tags
		$text = $this->process_merge_tags( $props['text'], $merge_tags );
		$url  = $this->process_merge_tags( $props['url'], $merge_tags );

		// Container style based on alignment
		$container_style = $this->build_style_string(
			array(
				'text-align' => $props['align'] === 'full' ? 'center' : $props['align'],
			)
		);

		// Button style
		$button_styles = array(
			'display'         => $props['align'] === 'full' ? 'block' : 'inline-block',
			'width'           => $props['align'] === 'full' ? '100%' : 'auto',
			'padding'         => $this->format_padding( $props['padding'] ),
			'font-family'     => 'Arial, sans-serif',
			'font-size'       => '16px',
			'color'           => '#ffffff',
			'text-align'      => 'center',
			'text-decoration' => 'none',
			'border-radius'   => '4px',
		);

		// Apply button type styling
		switch ( $props['buttonStyle'] ) {
			case 'primary':
				$button_styles['background-color'] = $props['backgroundColor'];
				$button_styles['border']           = '1px solid ' . $props['backgroundColor'];
				$button_styles['color']            = '#ffffff';
				break;

			case 'secondary':
				$button_styles['background-color'] = 'transparent';
				$button_styles['border']           = '1px solid ' . $props['backgroundColor'];
				$button_styles['color']            = $props['backgroundColor'];
				break;

			case 'tertiary':
				$button_styles['background-color'] = 'transparent';
				$button_styles['border']           = '0';
				$button_styles['color']            = $props['backgroundColor'];
				$button_styles['text-decoration']  = 'underline';
				break;
		}

		$button_style = $this->build_style_string( $button_styles );

		// For email client compatibility, use a table-based button
		return "
		<div style=\"{$container_style}\">
			<table border=\"0\" cellpadding=\"0\" cellspacing=\"0\" role=\"presentation\" style=\"" . ( $props['align'] === 'full' ? 'width: 100%;' : 'margin: 0 auto;' ) . "\">
				<tr>
					<td align=\"center\">
						<a href=\"{$url}\" target=\"_blank\" style=\"{$button_style}\">{$text}</a>
					</td>
				</tr>
			</table>
		</div>";
	}
}



