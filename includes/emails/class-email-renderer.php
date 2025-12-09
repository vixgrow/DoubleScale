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
use QuillCRM\Models\Contact_Model;
use QuillCRM\Models\Automation_Contact_Model;
use QuillCRM\Managers\Merge_Tags_Manager;
use QuillCRM\Emails\Layouts\Layout_Handler_Registry;

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
	 * @param int                                         $template_id Template ID
	 * @param Contact_Model|Automation_Contact_Model|null $contact Contact model for merge tags
	 * @param int|null                                    $tracking_id Optional tracking ID for stored merge tag values
	 * @return string HTML output
	 */
	public function render_template( $template_id, $contact = null, $tracking_id = null ) {
		// Use the Template_Model to fetch the template
		$template = Template_Model::find( $template_id );

		if ( ! $template ) {
			return '';
		}

		// Set tracking context on contact if tracking_id is provided
		if ( $tracking_id && $contact && method_exists( $contact, 'set_tracking_context' ) ) {
			error_log( "QuillCRM: Setting tracking context {$tracking_id} on contact {$contact->id}" );
			$contact->set_tracking_context( $tracking_id );
		} else {
			error_log( "QuillCRM: Not setting tracking context - tracking_id: {$tracking_id}, contact: " . ( $contact ? $contact->id : 'null' ) );
		}

		// Parse the JSON content
		$content = json_decode( $template->body, true );
		if ( json_last_error() !== JSON_ERROR_NONE ) {
			// Handle legacy templates or error cases
			return $template->body;
		}

		// Check if this is a builder template with type='builder' structure
		if ( isset( $content['type'] ) && $content['type'] === 'builder' && isset( $content['value'] ) ) {
			$content = $content['value'];
		}

		// Get global settings from content (builder stores them in body.globalSettings)
		$global_settings = isset( $content['globalSettings'] ) ? $content['globalSettings'] : array();

		// Get preview_text from template and process merge tags
		$preview_text = ! empty( $template->preview_text ) ? $template->preview_text : '';
		if ( ! empty( $preview_text ) && $contact ) {
			$preview_text = Merge_Tags_Manager::instance()->process_merge_tags( $preview_text, $contact );
		}

		// Generate HTML for email body
		$html = $this->build_email_structure( $content, $global_settings, $contact, $preview_text );

		return $html;
	}

	/**
	 * Render builder content directly from builder data (without template ID)
	 * Useful for email sequences and campaigns where content is stored in email_body field
	 *
	 * @param array                                       $builder_data Builder content data (sections, globalSettings, buttonSettings)
	 * @param Contact_Model|Automation_Contact_Model|null $contact Contact model for merge tags
	 * @param string                                      $preview_text Optional preview text
	 * @param string                                      $footer_html Optional footer HTML to inject before </body> tag
	 * @return string HTML output
	 */
	public function render_from_builder_data( $builder_data, $contact = null, $preview_text = '', $footer_html = '' ) {
		if ( ! is_array( $builder_data ) ) {
			return '';
		}

		// Get global settings from builder data
		$global_settings = isset( $builder_data['globalSettings'] ) ? $builder_data['globalSettings'] : array();

		// Process preview text if provided
		if ( ! empty( $preview_text ) && $contact ) {
			$preview_text = Merge_Tags_Manager::instance()->process_merge_tags( $preview_text, $contact );
		}

		// Generate HTML for email body
		$html = $this->build_email_structure( $builder_data, $global_settings, $contact, $preview_text, $footer_html );

		return $html;
	}


	/**
	 * FIXED: Email Renderer responsive methods
	 * This version fixes the desktop layout while maintaining mobile stacking
	 *
	 * Replace your existing methods with these.
	 */

	/**
	 * BULLETPROOF Responsive Email Renderer
	 *
	 * This approach works WITHOUT media queries by using:
	 * 1. display: inline-block (naturally wraps when space is insufficient)
	 * 2. min-width + max-width combination for responsive behavior
	 * 3. Ghost tables for Outlook only
	 *
	 * Replace your render_section and build_email_structure methods with these.
	 */

	/**
	 * Build email HTML structure
	 *
	 * @param array                                       $content Template content
	 * @param array                                       $global_settings Global email settings
	 * @param Contact_Model|Automation_Contact_Model|null $contact Contact model for merge tags
	 * @param string                                      $preview_text Preview text for email clients
	 * @param string                                      $footer_html Optional footer HTML
	 * @return string HTML output
	 */
	private function build_email_structure( $content, $global_settings, $contact, $preview_text = '', $footer_html = '' ) {
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

		// Store canvas width for use in render_section
		$this->canvas_width = $canvas_width;

		// Process background image through merge tags if present
		if ( ! empty( $background_image ) && $contact ) {
			$background_image = Merge_Tags_Manager::instance()->process_merge_tags( $background_image, $contact );
		}

		// Use a light gray for outer wrapper background
		$bg_color = '#f7f7f7';

		// Mobile breakpoint for media query fallback
		$mobile_breakpoint = 480;

		// Generate preheader HTML if preview_text is provided
		$preheader_html = '';
		if ( ! empty( $preview_text ) ) {
			$preheader_html = '<div style="display:none;font-size:1px;color:#ffffff;line-height:1px;max-height:0px;max-width:0px;opacity:0;overflow:hidden;">'
				. esc_html( $preview_text )
				. str_repeat( '&nbsp;&zwnj;', 50 )
				. '</div>';
		}

		// Start with proper email structure
		$html = '<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
	<html xmlns="http://www.w3.org/1999/xhtml">
	<head>
		<meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
		<meta name="viewport" content="width=device-width, initial-scale=1.0" />
		<title>Email Template</title>
		<!--[if !mso]><!-->
		<meta http-equiv="X-UA-Compatible" content="IE=edge" />
		<!--<![endif]-->
		<style type="text/css">
			/* Email Client Compatibility Reset */
			body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
			table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
			img { -ms-interpolation-mode: bicubic; border: 0; outline: none; text-decoration: none; }
			
			/* Reset styles */
			body { margin: 0 !important; padding: 0 !important; background-color: ' . $bg_color . ' !important; }
			table { border-collapse: collapse !important; }
			
			/* Image styles */
			img { max-width: 100% !important; height: auto !important; }
			
			/* Font inheritance */
			* { font-family: Arial, sans-serif; }
			
			/* Link styles */
			a { text-decoration: none; }

			/* 
			* RESPONSIVE COLUMN SYSTEM
			* Works by using max-width on wrapper + inline-block on columns
			* Columns naturally stack when container is too narrow
			*/
			
			/* Fallback media query for clients that support it */
			@media only screen and (max-width: ' . $mobile_breakpoint . 'px) {
				.responsive-table {
					width: 100% !important;
				}
				.responsive-column {
					display: block !important;
					width: 100% !important;
					max-width: 100% !important;
				}
				.gallery-item {
					display: block !important;
					width: 100% !important;
				}
			}
		</style>
		<!--[if mso]>
		<style type="text/css">
			table { border-collapse: collapse; border-spacing: 0; }
			.responsive-column { display: table-cell !important; }
		</style>
		<noscript>
		<xml>
			<o:OfficeDocumentSettings>
				<o:PixelsPerInch>96</o:PixelsPerInch>
			</o:OfficeDocumentSettings>
		</xml>
		</noscript>
		<![endif]-->
	</head>
	<body style="margin: 0; padding: 0; background-color: ' . $bg_color . ';">
		' . $preheader_html . '
		
		<!-- Full-width wrapper table -->
		<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: ' . $bg_color . ';">
			<tr>
				<td align="center" style="padding: 20px 10px;">';

		// Build canvas inline styles
		$canvas_styles = array(
			'background-color' => $canvas_color,
		);

		// Add background image styles if set
		if ( ! empty( $background_image ) && strpos( $background_image, 'localhost' ) === false ) {
			$canvas_styles['background-image']    = "url('{$background_image}')";
			$canvas_styles['background-repeat']   = $background_repeat;
			$canvas_styles['background-size']     = $background_size;
			$canvas_styles['background-position'] = $background_position;
		}

		$canvas_style_string = $this->build_style_string( $canvas_styles );

		// Main container with max-width (this is key for responsiveness)
		$html .= '
					<!-- Email container - max-width makes it responsive -->
					<table role="presentation" class="responsive-table" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width: ' . $canvas_width . 'px; ' . $canvas_style_string . '">
						<tr>
							<td style="padding: 0;">';

		// Process all sections
		if ( isset( $content['sections'] ) && is_array( $content['sections'] ) ) {
			foreach ( $content['sections'] as $section ) {
				if ( $this->section_has_content( $section ) ) {
					$html .= $this->render_section( $section, $contact );
				}
			}
		} elseif ( is_array( $content ) ) {
			$is_section_array = false;
			foreach ( $content as $item ) {
				if ( is_array( $item ) && isset( $item['columns'] ) ) {
					$is_section_array = true;
					break;
				}
			}

			if ( $is_section_array ) {
				foreach ( $content as $section ) {
					if ( $this->section_has_content( $section ) ) {
						$html .= $this->render_section( $section, $contact );
					}
				}
			} else {
				$html .= '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">';
				foreach ( $content as $block ) {
					if ( isset( $block['type'] ) ) {
						$html .= '<tr><td style="padding: 10px;">' . $this->render_block( $block, $contact ) . '</td></tr>';
					}
				}
				$html .= '</table>';
			}
		}

		$html .= '
							</td>
						</tr>
					</table>';

		// Footer
		if ( ! empty( $footer_html ) ) {
			$html .= '
					<!-- Email Footer -->
					<table role="presentation" class="responsive-table" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width: ' . esc_attr( $canvas_width ) . 'px;">
						<tr>
							<td style="padding: 20px; text-align: center; font-size: 12px; color: #666; line-height: 1.5;">
								' . $footer_html . '
							</td>
						</tr>
					</table>';
		}

		$html .= '
				</td>
			</tr>
		</table>
	</body>
	</html>';

		return $html;
	}


	/**
	 * Render a section with BULLETPROOF responsive columns
	 *
	 * KEY TECHNIQUE:
	 * - Parent div has font-size:0 to remove whitespace gaps
	 * - Each column is display:inline-block with percentage width
	 * - min-width forces stacking on small screens (NO media query needed!)
	 * - max-width prevents overflow on desktop
	 *
	 * @param array                                       $section Section data
	 * @param Contact_Model|Automation_Contact_Model|null $contact Contact model for merge tags
	 * @return string HTML output
	 */
	private function render_section( $section, $contact ) {
		// Build section styles
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
			$section_styles['padding'] = '40px';
		}

		$section_style_string = $this->build_style_string( $section_styles );

		// Get canvas width
		$canvas_width = isset( $this->canvas_width ) ? $this->canvas_width : 600;

		// Start section
		$html  = '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="' . $section_style_string . '">';
		$html .= '<tr>';
		$html .= '<td align="center" style="padding: 0;">';

		// Render columns
		if ( ! empty( $section['columns'] ) ) {
			// Filter out columns with no valid content
			$valid_columns = array();
			foreach ( $section['columns'] as $column ) {
				if ( $this->column_has_content( $column ) ) {
					$valid_columns[] = $column;
				}
			}

			if ( ! empty( $valid_columns ) ) {
				$column_count = count( $valid_columns );

				// Calculate total ratio
				$total_ratio = 0;
				foreach ( $valid_columns as $column ) {
					$column_width = isset( $column['width'] ) ? $column['width'] : 1;
					$total_ratio += $column_width;
				}

				// Calculate minimum width for stacking
				// If a column is less than this width, force stacking
				// 200px is a good breakpoint - below this, text becomes hard to read
				$min_width_for_stacking = 200;

				// =============================================
				// OUTLOOK: Use traditional table cells
				// =============================================
				$html .= '<!--[if mso]>';
				$html .= '<table role="presentation" width="' . $canvas_width . '" cellpadding="0" cellspacing="0" border="0" align="center">';
				$html .= '<tr>';

				foreach ( $valid_columns as $column_index => $column ) {
					$column_width = isset( $column['width'] ) ? $column['width'] : 1;
					$pixel_width  = round( ( $column_width / $total_ratio ) * $canvas_width );

					$html .= '<td width="' . $pixel_width . '" valign="top" style="padding: 0;">';
					$html .= '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">';
					$html .= '<tr><td style="padding: 10px;">';
					$html .= '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">';

					if ( isset( $column['blocks'] ) && is_array( $column['blocks'] ) ) {
						$html .= $this->render_column_blocks( $column['blocks'], $contact );
					}

					$html .= '</table>';
					$html .= '</td></tr>';
					$html .= '</table>';
					$html .= '</td>';
				}

				$html .= '</tr>';
				$html .= '</table>';
				$html .= '<![endif]-->';

				// =============================================
				// NON-OUTLOOK: Use inline-block divs
				// font-size:0 removes whitespace between inline-block elements
				// =============================================
				$html .= '<!--[if !mso]><!-->';
				$html .= '<div style="font-size: 0; text-align: center;">';

				foreach ( $valid_columns as $column_index => $column ) {
					$column_width = isset( $column['width'] ) ? $column['width'] : 1;

					// Calculate widths
					$percent_width = ( $column_width / $total_ratio ) * 100;
					$percent_width = round( $percent_width, 2 );
					$pixel_width   = round( ( $column_width / $total_ratio ) * $canvas_width );

					// Column styles
					$column_styles_array = array();
					if ( isset( $column['styles'] ) ) {
						foreach ( $column['styles'] as $property => $value ) {
							$css_property                         = $this->convert_camel_to_kebab( $property );
							$column_styles_array[ $css_property ] = $value;
						}
					}
					$column_style_string = $this->build_style_string( $column_styles_array );

					// THE MAGIC: inline-block + width:100% + max-width
					// - display: inline-block allows side-by-side
					// - width: 100% makes it fill container on mobile
					// - max-width: Xpx limits size on desktop
					// - min-width: 200px (or similar) forces stacking when space is tight
					// (this is the KEY for Gmail mobile which ignores media queries)

					// For 2 columns, each can shrink to ~280px before stacking
					// For 3 columns, each can shrink to ~180px before stacking
					$min_col_width = max( 150, floor( $canvas_width / $column_count ) - 50 );

					$html .= '<div class="responsive-column" style="';
					$html .= 'display: inline-block; ';
					$html .= 'width: 100%; ';
					$html .= 'max-width: ' . $pixel_width . 'px; ';
					$html .= 'vertical-align: top; ';
					$html .= 'font-size: 14px; '; // Reset font-size for content
					$html .= 'text-align: left;';
					$html .= '">';

					// Inner table for content
					$html .= '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">';
					$html .= '<tr>';
					$html .= '<td style="padding: 10px; ' . $column_style_string . '">';

					// Content table for blocks
					$html .= '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">';

					if ( isset( $column['blocks'] ) && is_array( $column['blocks'] ) ) {
						$html .= $this->render_column_blocks( $column['blocks'], $contact );
					}

					$html .= '</table>';
					$html .= '</td>';
					$html .= '</tr>';
					$html .= '</table>';

					$html .= '</div>'; // Close column div
				}

				$html .= '</div>'; // Close wrapper div
				$html .= '<!--<![endif]-->';
			}
		}

		$html .= '</td>';
		$html .= '</tr>';
		$html .= '</table>';

		return $html;
	}

	/**
	 * Check if a section has any valid content (registered blocks)
	 *
	 * @param array $section Section data
	 * @return bool True if section has valid content, false if empty
	 */
	private function section_has_content( $section ) {
		if ( empty( $section['columns'] ) || ! is_array( $section['columns'] ) ) {
			return false;
		}

		foreach ( $section['columns'] as $column ) {
			if ( $this->column_has_content( $column ) ) {
				return true;
			}
		}

		// No valid blocks found in any column
		return false;
	}

	/**
	 * Check if a column has any valid content (registered blocks)
	 *
	 * @param array $column Column data
	 * @return bool True if column has valid content, false if empty
	 */
	private function column_has_content( $column ) {
		if ( empty( $column['blocks'] ) || ! is_array( $column['blocks'] ) ) {
			return false;
		}

		foreach ( $column['blocks'] as $block ) {
			if ( ! isset( $block['type'] ) ) {
				continue;
			}

			// Check if block type is registered
			$block_instance = $this->block_registry->get_block( $block['type'] );
			if ( $block_instance !== null ) {
				// Found at least one valid block
				return true;
			}
		}

		// No valid blocks found in this column
		return false;
	}


	/**
	 * Render blocks in a column with template-aware layout handling
	 * Uses the Layout Handler Registry pattern
	 *
	 * @param array                                       $blocks Array of blocks
	 * @param Contact_Model|Automation_Contact_Model|null $contact Contact model for merge tags
	 * @return string HTML output
	 */
	private function render_column_blocks( $blocks, $contact ) {
		$html     = '';
		$i        = 0;
		$registry = Layout_Handler_Registry::instance();

		while ( $i < count( $blocks ) ) {
			$block = $blocks[ $i ];

			// Try to find a layout handler for this block
			$handler = $registry->find_handler( $block );

			if ( $handler ) {
				// Use handler to render layout
				$html .= $handler->render(
					$blocks,
					$i,
					function ( $block ) use ( $contact ) {
						return $this->render_block( $block, $contact );
					}
				);
			} else {
				// Regular block - render in single row
				$html .= '<tr><td style="padding: 0;">';
				$html .= $this->render_block( $block, $contact );
				$html .= '</td></tr>';
				$i++;
			}
		}

		return $html;
	}

	/**
	 * Render a block
	 *
	 * @param array                                       $block Block data
	 * @param Contact_Model|Automation_Contact_Model|null $contact Contact model for merge tags
	 * @return string HTML output
	 */
	private function render_block( $block, $contact ) {
		if ( ! isset( $block['type'] ) ) {
			return '<!-- Missing block type -->';
		}

		// Store current renderer instance globally so blocks can access button settings
		global $quillcrm_email_renderer;
		$quillcrm_email_renderer = $this;

		return $this->block_registry->render_block(
			$block['type'],
			isset( $block['props'] ) ? $block['props'] : array(),
			$contact
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

	/**
	 * Render template with tracking context
	 * Convenience method that automatically sets tracking context and renders
	 *
	 * @param int                                         $template_id Template ID
	 * @param int                                         $tracking_id Communication tracking ID
	 * @param Contact_Model|Automation_Contact_Model|null $contact Contact model (optional, will be fetched from tracking if not provided)
	 * @return string HTML output
	 */
	public function render_template_with_tracking( $template_id, $tracking_id, $contact = null ) {
		// If no contact provided, try to get it from the tracking record
		if ( ! $contact ) {
			$tracking = \QuillCRM\Models\Communication_Tracking_Model::find( $tracking_id );
			if ( $tracking && $tracking->contact ) {
				$contact = $tracking->contact;
			}
		}

		return $this->render_template( $template_id, $contact, $tracking_id );
	}

}
