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

		// Get settings - already parsed by model if $casts is working
		$settings = is_array( $template->settings ) ? $template->settings : ( json_decode( $template->settings, true ) ?: array() );

		// Generate HTML for email body
		$html = $this->build_email_structure( $content, $settings, $merge_tags );

		return $html;
	}

	/**
	 * Build email HTML structure
	 *
	 * @param array $content Template content
	 * @param array $settings Template settings
	 * @param array $merge_tags Merge tags
	 * @return string HTML output
	 */
	private function build_email_structure( $content, $settings, $merge_tags ) {
		// Default settings
		$bg_color     = isset( $settings['backgroundColor'] ) ? $settings['backgroundColor'] : '#f7f7f7';
		$canvas_color = isset( $settings['canvasColor'] ) ? $settings['canvasColor'] : '#ffffff';

		// Start with basic email structure
		$html = "<!DOCTYPE html>
		<html>
		<head>
			<meta charset=\"utf-8\">
			<meta name=\"viewport\" content=\"width=device-width, initial-scale=1\">
			<style>
				/* Base email styles */
				body { margin: 0; padding: 0; background-color: {$bg_color}; }
				.email-container { max-width: 600px; margin: 0 auto; background-color: {$canvas_color}; }
				img { max-width: 100%; }
				
				/* Ensure all block content inherits fonts */
				* { font-family: inherit; }
				
				/* Mobile responsiveness */
				@media only screen and (max-width: 620px) {
					.email-container {
						width: 100% !important;
					}
				}
			</style>
		</head>
		<body>
			<div class=\"email-container\">";

		// Process all sections
		if ( isset( $content['sections'] ) && is_array( $content['sections'] ) ) {
			foreach ( $content['sections'] as $section ) {
				$html .= $this->render_section( $section, $merge_tags );
			}
		} else {
			// Handle flat content structure (no sections)
			foreach ( $content as $block ) {
				if ( isset( $block['type'] ) ) {
					$html .= $this->render_block( $block, $merge_tags );
				}
			}
		}

		$html .= '</div></body></html>';

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
		// Build section styles
		$style = '';
		if ( isset( $section['styles'] ) ) {
			foreach ( $section['styles'] as $property => $value ) {
				$property = $this->convert_camel_to_kebab( $property );
				$style   .= "{$property}: {$value}; ";
			}
		}

		$html = "<div style=\"{$style}\">";

		// Render columns
		if ( ! empty( $section['columns'] ) ) {
			$html .= '<table width="100%" cellpadding="0" cellspacing="0" border="0"><tr>';

			foreach ( $section['columns'] as $column ) {
				$width = isset( $column['width'] ) ? $column['width'] : 100;
				$html .= "<td width=\"{$width}%\" valign=\"top\">";

				// Render blocks in this column
				if ( isset( $column['blocks'] ) && is_array( $column['blocks'] ) ) {
					foreach ( $column['blocks'] as $block ) {
						$html .= $this->render_block( $block, $merge_tags );
					}
				}

				$html .= '</td>';
			}

			$html .= '</tr></table>';
		}

		$html .= '</div>';
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
}

