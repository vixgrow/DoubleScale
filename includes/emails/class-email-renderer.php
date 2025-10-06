<?php
/**
 * Email Renderer
 *
 * @since 1.0.0
 *
 * @package QuillCRM
 */

namespace QuillCRM\Emails;

use QuillCRM\Models\Template_Model;
use QuillCRM\Managers\Merge_Tags_Manager;

/**
 * Renderer for email templates
 */
class Email_Renderer {
	/**
	 * Block registry instance
	 *
	 * @var Block_Registry
	 */
	private $block_registry;

	/**
	 * Button settings from template
	 *
	 * @var array
	 */
	private $button_settings = array();

	/**
	 * Constructor
	 */
	public function __construct() {
		$this->block_registry = Block_Registry::instance();
	}

	/**
	 * Render email template
	 *
	 * @param int   $template_id Template ID
	 * @param array $merge_tags Merge tags
	 * @return string HTML output
	 */
	public function render_template( $template_id, $merge_tags = array() ) {
		// Use the Template_Model to fetch the template
		$template = Template_Model::find( $template_id );

		if ( ! $template ) {
			return '';
		}

		// Parse the JSON content
		$content = json_decode( $template->body, true );
		if ( json_last_error() !== JSON_ERROR_NONE ) {
			// Handle legacy templates or error cases
			return $template->body;
		}

		// Get global settings from content (builder stores them in body.globalSettings)
		$global_settings = isset( $content['globalSettings'] ) ? $content['globalSettings'] : array();

		// Get preview_text from template and process merge tags
		$preview_text = ! empty( $template->preview_text ) ? $template->preview_text : '';
		if ( ! empty( $preview_text ) && ! empty( $merge_tags ) ) {
			$preview_text = Merge_Tags_Manager::instance()->process_merge_tags( $preview_text, $merge_tags );
		}

		// Generate HTML for email body
		$html = $this->build_email_structure( $content, $global_settings, $merge_tags, $preview_text );

		return $html;
	}

	/**
	 * Build email HTML structure
	 *
	 * @param array  $content Template content
	 * @param array  $global_settings Global email settings (canvas, background, etc.)
	 * @param array  $merge_tags Merge tags
	 * @param string $preview_text Preview text for email clients
	 * @return string HTML output
	 */
	private function build_email_structure( $content, $global_settings, $merge_tags, $preview_text = '' ) {
		// Extract button settings from content if available
		if ( isset( $content['buttonSettings'] ) && is_array( $content['buttonSettings'] ) ) {
			$this->button_settings = $content['buttonSettings'];
		}

		// Extract global settings (with defaults)
		$canvas_color        = isset( $global_settings['canvasColor'] ) ? $global_settings['canvasColor'] : '#ffffff';
		$canvas_width        = isset( $global_settings['canvasWidth'] ) ? $global_settings['canvasWidth'] : 600;
		$background_image    = isset( $global_settings['backgroundImage']['url'] ) ? $global_settings['backgroundImage']['url'] : '';
		$background_repeat   = isset( $global_settings['backgroundRepeat'] ) ? $global_settings['backgroundRepeat'] : 'no-repeat';
		$background_size     = isset( $global_settings['backgroundSize'] ) ? $global_settings['backgroundSize'] : 'cover';
		$background_position = isset( $global_settings['backgroundPosition'] ) ? $global_settings['backgroundPosition'] : 'center';

		// Use a light gray for outer wrapper background (email client background)
		$bg_color = '#f7f7f7';

		// Generate preheader HTML if preview_text is provided
		$preheader_html = '';
		if ( ! empty( $preview_text ) ) {
			// Add hidden preheader text - this appears in email client previews but not in the email body
			$preheader_html = '<div style="display:none;font-size:1px;color:#ffffff;line-height:1px;max-height:0px;max-width:0px;opacity:0;overflow:hidden;">'
				. esc_html( $preview_text )
				// Add invisible characters to push unwanted preview text out of view
				. str_repeat( '&nbsp;&zwnj;', 50 )
				. '</div>';
		}

		// Start with proper email structure using tables for compatibility
		$html = "<!DOCTYPE html PUBLIC \"-//W3C//DTD XHTML 1.0 Transitional//EN\" \"http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd\">
		<html xmlns=\"http://www.w3.org/1999/xhtml\">
		<head>
			<meta http-equiv=\"Content-Type\" content=\"text/html; charset=UTF-8\" />
			<meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\" />
			<title>Email Template</title>
			<!--[if !mso]><!-->
			<meta http-equiv=\"X-UA-Compatible\" content=\"IE=edge\" />
			<!--<![endif]-->
			<style type=\"text/css\">
				/* Email Client Compatibility Reset */
				body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
				table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
				img { -ms-interpolation-mode: bicubic; border: 0; outline: none; text-decoration: none; }
				
				/* Reset styles */
				body { margin: 0 !important; padding: 0 !important; background-color: {$bg_color} !important; }
				table { border-collapse: collapse !important; }
				
				/* Container styles */
				.email-wrapper { width: 100% !important; background-color: {$bg_color} !important; }
				.email-container { max-width: {$canvas_width}px !important; background-color: {$canvas_color} !important; }
				
				/* Image styles */
				img { max-width: 100% !important; height: auto !important; }
				
				/* Font inheritance */
				* { font-family: Arial, sans-serif !important; }
				
				/* Link styles */
				a { text-decoration: none; }
				a:hover { text-decoration: underline !important; }
				
			/* Mobile responsiveness */
			@media only screen and (max-width: " . ( $canvas_width + 40 ) . "px) {
				.email-container { width: 100% !important; }
				.mobile-padding { padding: 10px !important; }
				.mobile-hide { display: none !important; }
				.mobile-center { text-align: center !important; }
				.mobile-full-width { width: 100% !important; }
			}
				
				/* Outlook specific */
				<!--[if mso]>
				table { border-collapse: collapse; border-spacing: 0; }
				<![endif]-->
			</style>
		</head>
		<body style=\"margin: 0; padding: 0; background-color: {$bg_color};\">
			{$preheader_html}
			<!-- Email Wrapper Table -->
			<table role=\"presentation\" class=\"email-wrapper\" width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" border=\"0\" style=\"background-color: {$bg_color};\">
				<tr>
					<td align=\"center\" style=\"padding: 20px 0;\">
					<!-- Main Email Container -->";

		// Build canvas inline styles
		$canvas_styles = array(
			'background-color' => $canvas_color,
			'max-width'        => $canvas_width . 'px',
		);

		// Add background image styles if set
		if ( ! empty( $background_image ) ) {
			$canvas_styles['background-image']    = "url('{$background_image}')";
			$canvas_styles['background-repeat']   = $background_repeat;
			$canvas_styles['background-size']     = $background_size;
			$canvas_styles['background-position'] = $background_position;
		}

		$canvas_style_string = $this->build_style_string( $canvas_styles );

		$html .= "<table role=\"presentation\" class=\"email-container\" width=\"{$canvas_width}\" cellpadding=\"0\" cellspacing=\"0\" border=\"0\" style=\"{$canvas_style_string}\">
						<tr>
							<td style=\"padding: 0;\">";

		// Process all sections
		if ( isset( $content['sections'] ) && is_array( $content['sections'] ) ) {
			// Structure with explicit 'sections' property
			foreach ( $content['sections'] as $section ) {
				$html .= $this->render_section( $section, $merge_tags );
			}
		} elseif ( is_array( $content ) ) {
			// Check if this is an array of section objects
			$is_section_array = false;
			foreach ( $content as $item ) {
				if ( is_array( $item ) && isset( $item['columns'] ) ) {
					$is_section_array = true;
					break;
				}
			}

			if ( $is_section_array ) {
				// Content is an array of section objects (each with id, columns, styles)
				foreach ( $content as $section ) {
					$html .= $this->render_section( $section, $merge_tags );
				}
			} else {
				// Handle flat content structure (no sections) - wrap in a default section
				$html .= '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">';
				foreach ( $content as $block ) {
					if ( isset( $block['type'] ) ) {
						$html .= '<tr><td style="padding: 10px;">' . $this->render_block( $block, $merge_tags ) . '</td></tr>';
					}
				}
				$html .= '</table>';
			}
		}

		$html .= '
								</td>
							</tr>
						</table>
					</td>
				</tr>
			</table>
		</body>
		</html>';

		return $html;
	}

	/**
	 * Render a section
	 *
	 * @param array $section Section data
	 * @param array $merge_tags Merge tags
	 * @return string HTML output
	 */
	private function render_section( $section, $merge_tags ) {
		// Build section styles - convert to inline styles for email compatibility
		$section_styles = array();
		if ( isset( $section['styles'] ) ) {
			foreach ( $section['styles'] as $property => $value ) {
				$css_property                    = $this->convert_camel_to_kebab( $property );
				$section_styles[ $css_property ] = $value;
			}
		}

		// Default section styles
		if ( ! isset( $section_styles['background-color'] ) ) {
			$section_styles['background-color'] = 'transparent';
		}
		if ( ! isset( $section_styles['padding'] ) ) {
			$section_styles['padding'] = '20px';
		}

		$section_style_string = $this->build_style_string( $section_styles );

		// Outer section table wrapper
		$html  = '<!--[if mso | IE]><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td><![endif]-->';
		$html .= '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="' . $section_style_string . '">';

		// Render columns
		if ( ! empty( $section['columns'] ) ) {
			$html .= '<tr>';

			// Calculate total ratio to convert ratio-based widths to percentages
			$total_ratio = 0;
			foreach ( $section['columns'] as $column ) {
				$column_width = isset( $column['width'] ) ? $column['width'] : 1;
				$total_ratio += $column_width;
			}

			$column_count = count( $section['columns'] );

			foreach ( $section['columns'] as $column_index => $column ) {
				$column_width = isset( $column['width'] ) ? $column['width'] : 1;

				// Calculate width as ratio-based to handle all layout patterns
				$width = ( $column_width / $total_ratio ) * 100;
				$width = round( $width, 2 );

				// Calculate pixel width for Outlook (600px max width container)
				$pixel_width = round( ( $width / 100 ) * 600 );

				// Column styles - ensuring proper vertical alignment and spacing
				$column_styles = array(
					'vertical-align'   => 'top',
					'padding'          => '0',
					'mso-table-lspace' => '0pt',
					'mso-table-rspace' => '0pt',
				);

				// Add column-specific styles if available
				if ( isset( $column['styles'] ) ) {
					foreach ( $column['styles'] as $property => $value ) {
						$css_property                   = $this->convert_camel_to_kebab( $property );
						$column_styles[ $css_property ] = $value;
					}
				}

				$column_style_string = $this->build_style_string( $column_styles );

				// Outlook conditional comment for column
				$html .= '<!--[if mso | IE]><td style="' . $column_style_string . '" width="' . $pixel_width . '"><![endif]-->';

				// Standard column wrapper
				$html .= '<td width="' . $width . '%" style="' . $column_style_string . '" class="mobile-full-width">';

				// Inner table for blocks (ensures proper stacking)
				$html .= '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse: collapse; mso-table-lspace: 0pt; mso-table-rspace: 0pt;">';

				// Render blocks in this column
				if ( isset( $column['blocks'] ) && is_array( $column['blocks'] ) ) {
					foreach ( $column['blocks'] as $block_index => $block ) {
						$html .= '<tr><td style="padding: 10px 0;">';
						$html .= $this->render_block( $block, $merge_tags );
						$html .= '</td></tr>';
					}
				}

				$html .= '</table>'; // Close inner blocks table
				$html .= '</td>'; // Close standard column
				$html .= '<!--[if mso | IE]></td><![endif]-->'; // Close Outlook column
			}

			$html .= '</tr>';
		}

		$html .= '</table>'; // Close section table
		$html .= '<!--[if mso | IE]></td></tr></table><![endif]-->'; // Close Outlook wrapper

		return $html;
	}

	/**
	 * Render a block
	 *
	 * @param array $block Block data
	 * @param array $merge_tags Merge tags
	 * @return string HTML output
	 */
	private function render_block( $block, $merge_tags ) {
		if ( ! isset( $block['type'] ) ) {
			return '<!-- Missing block type -->';
		}

		// Store current renderer instance globally so blocks can access button settings
		global $quillcrm_email_renderer;
		$quillcrm_email_renderer = $this;

		return $this->block_registry->render_block(
			$block['type'],
			isset( $block['props'] ) ? $block['props'] : array(),
			$merge_tags
		);
	}

	/**
	 * Convert camelCase to kebab-case
	 *
	 * @param string $string camelCase string
	 * @return string kebab-case string
	 */
	private function convert_camel_to_kebab( $string ) {
		return strtolower( preg_replace( '/([a-z0-9])([A-Z])/', '$1-$2', $string ) );
	}

	/**
	 * Build CSS style string from array
	 *
	 * @param array $styles Array of CSS properties
	 * @return string CSS style string
	 */
	private function build_style_string( array $styles ) {
		$style_string = '';

		foreach ( $styles as $property => $value ) {
			if ( $value !== null && $value !== '' ) {
				$style_string .= "{$property}: {$value}; ";
			}
		}

		return rtrim( $style_string );
	}

	/**
	 * Get button settings for a specific button style
	 *
	 * @param string $button_style Button style (primary, secondary, tertiary)
	 * @return array Button settings
	 */
	public function get_button_settings( $button_style = 'primary' ) {
		if ( ! empty( $this->button_settings ) && isset( $this->button_settings[ $button_style ] ) ) {
			return $this->button_settings[ $button_style ];
		}

		return array();
	}
}


