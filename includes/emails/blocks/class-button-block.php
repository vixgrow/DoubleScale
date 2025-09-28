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
	 * Get global button settings for a specific button style
	 *
	 * @param string $button_style Button style (primary, secondary, tertiary)
	 * @return array Global button settings
	 */
	private function get_global_button_settings( $button_style = 'primary' ): array {
		// Default settings matching the frontend ButtonSettingsContext
		$default_settings = array(
			'font'            => 'Arial',
			'size'            => 14,
			'letterSpacing'   => '0px',
			'borderRadius'    => 0,
			'textColor'       => '#FFFFFF',
			'backgroundColor' => '#1E3A8A',
			'borderWidth'     => 1,
			'borderColor'     => '#1E3A8A',
			'padding'         => array(
				'top'    => 4,
				'right'  => 8,
				'bottom' => 4,
				'left'   => 8,
			),
			'bold'            => false,
			'italic'          => false,
			'underline'       => false,
		);

		// Load settings from database
		$saved_settings = \QuillCRM\Settings::get( 'button_settings', array() );

		// Debug logging (remove in production)
		if ( defined( 'WP_DEBUG' ) && WP_DEBUG ) {
			error_log( 'Button Block Debug - Button Style: ' . $button_style );
			error_log( 'Button Block Debug - Saved Settings: ' . print_r( $saved_settings, true ) );
		}

		if ( ! empty( $saved_settings ) && is_array( $saved_settings ) ) {
			// Get settings for the specific button style
			$style_settings = isset( $saved_settings[ $button_style ] ) ? $saved_settings[ $button_style ] : array();

			// Debug logging
			if ( defined( 'WP_DEBUG' ) && WP_DEBUG ) {
				error_log( 'Button Block Debug - Style Settings: ' . print_r( $style_settings, true ) );
			}

			// Merge with defaults to ensure all properties exist
			$merged_settings = wp_parse_args( $style_settings, $default_settings );

			// Debug logging
			if ( defined( 'WP_DEBUG' ) && WP_DEBUG ) {
				error_log( 'Button Block Debug - Final Settings: ' . print_r( $merged_settings, true ) );
			}

			return $merged_settings;
		}

		// Debug logging
		if ( defined( 'WP_DEBUG' ) && WP_DEBUG ) {
			error_log( 'Button Block Debug - Using default settings' );
		}

		return $default_settings;
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

		// Container style based on alignment, background, and padding
		$container_padding = $this->format_padding( $props['containerPadding'] );

		// Handle alignment properly
		$text_align = 'center'; // default
		if ( $props['align'] === 'left' ) {
			$text_align = 'left';
		} elseif ( $props['align'] === 'right' ) {
			$text_align = 'right';
		} elseif ( $props['align'] === 'center' || $props['align'] === 'full' ) {
			$text_align = 'center';
		}

		$container_style = $this->build_style_string(
			array(
				'background-color' => $props['containerBackgroundColor'],
				'padding'          => $container_padding,
				'width'            => $props['align'] === 'full' ? '100%' : 'auto',
			)
		);

		// Get global button settings (matching frontend defaults)
		$global_settings = $this->get_global_button_settings( $props['buttonStyle'] );

		// Button style
		$button_styles = array(
			'display'         => $props['align'] === 'full' ? 'block' : 'inline-block',
			'width'           => $props['align'] === 'full' ? '100%' : 'auto',
			'padding'         => $this->format_padding( $global_settings['padding'] ),
			'font-family'     => $global_settings['font'],
			'font-size'       => $global_settings['size'] . 'px',
			'font-weight'     => $global_settings['bold'] ? 'bold' : 'normal',
			'font-style'      => $global_settings['italic'] ? 'italic' : 'normal',
			'text-decoration' => $global_settings['underline'] ? 'underline' : 'none',
			'letter-spacing'  => $global_settings['letterSpacing'],
			'border-radius'   => $global_settings['borderRadius'] . 'px',
			'text-align'      => 'center',
		);

		// Apply button type styling using global settings
		switch ( $props['buttonStyle'] ) {
			case 'primary':
				$button_styles['background-color'] = $global_settings['backgroundColor'];
				$button_styles['border']           = $global_settings['borderWidth'] . 'px solid ' . $global_settings['borderColor'];
				$button_styles['color']            = $global_settings['textColor'];
				break;

			case 'secondary':
				$button_styles['background-color'] = 'transparent';
				$button_styles['border']           = $global_settings['borderWidth'] . 'px solid ' . $global_settings['backgroundColor'];
				$button_styles['color']            = $global_settings['backgroundColor'];
				break;

			case 'tertiary':
				$button_styles['background-color'] = 'transparent';
				$button_styles['border']           = '0';
				$button_styles['color']            = $global_settings['backgroundColor'];
				$button_styles['text-decoration']  = 'underline';
				break;
		}

		$button_style = $this->build_style_string( $button_styles );

		// For email client compatibility, use a table-based button structure
		$wrapper_table_style = 'width: 100%; border-collapse: collapse;';

		// Alignment styles for the button cell
		$button_cell_align = 'center';
		switch ( $props['align'] ) {
			case 'left':
				$button_cell_align = 'left';
				break;
			case 'right':
				$button_cell_align = 'right';
				break;
			case 'full':
				$button_cell_align = 'center';
				break;
			default:
				$button_cell_align = 'center';
		}

		$button_cell_style = $this->build_style_string(
			array(
				'text-align' => $button_cell_align,
				'padding'    => $this->format_padding( $props['containerPadding'] ),
			)
		);

		// Inner button table for MSO compatibility
		$button_table_style = $this->build_style_string(
			array(
				'display'         => 'inline-block',
				'border-collapse' => 'separate',
				'line-height'     => '100%',
			)
		);

		// Set alignment styles
		if ( $props['align'] === 'full' ) {
			$button_cell_style  = 'width: 100%; text-align: center;';
			$button_table_style = 'width: 100%;';
		} elseif ( $props['align'] === 'left' ) {
			$button_cell_style  = 'text-align: left; width: auto;';
			$button_table_style = 'width: auto;';
		} elseif ( $props['align'] === 'right' ) {
			$button_cell_style  = 'text-align: right; width: auto;';
			$button_table_style = 'width: auto;';
		} else {
			// center
			$button_cell_style  = 'text-align: center; width: auto;';
			$button_table_style = 'width: auto; margin: 0 auto;';
		}

		return "
		<div style=\"{$container_style}\">
			<table border=\"0\" cellpadding=\"0\" cellspacing=\"0\" role=\"presentation\" style=\"{$wrapper_table_style}\">
				<tr>
					<td style=\"{$button_cell_style}\">
						<table border=\"0\" cellpadding=\"0\" cellspacing=\"0\" role=\"presentation\" style=\"{$button_table_style}\">
							<tr>
								<td>
									<a href=\"{$url}\" target=\"_blank\" style=\"{$button_style}\">{$text}</a>
								</td>
							</tr>
						</table>
					</td>
				</tr>
			</table>
		</div>";
	}
}



