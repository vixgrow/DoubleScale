<?php
/**
 * Social Media Block
 *
 * @since 1.0.0
 *
 * @package QuillCRM
 */

namespace QuillCRM\Emails\Blocks;

use QuillCRM\Abstracts\Email_Block;

/**
 * Social Media block for emails
 */
class Social_Media_Block extends Email_Block {
	/**
	 * Get block type
	 *
	 * @return string
	 */
	public function get_type(): string {
		return 'social_media';
	}

	/**
	 * Get block name
	 *
	 * @return string
	 */
	public function get_name(): string {
		return __( 'Social Media', 'quillcrm' );
	}

	/**
	 * Get default properties
	 *
	 * @return array
	 */
	public function get_default_props(): array {
		return array(
			'platforms' => array(
				'facebook'   => array(
					'enabled' => true,
					'link'    => 'https://facebook.com',
				),
				'x'          => array(
					'enabled' => true,
					'link'    => 'https://x.com',
				),
				'instagram'  => array(
					'enabled' => true,
					'link'    => 'https://instagram.com',
				),
				'youtube'    => array(
					'enabled' => false,
					'link'    => '',
				),
				'pinterest'  => array(
					'enabled' => false,
					'link'    => '',
				),
				'linkedin'   => array(
					'enabled' => false,
					'link'    => '',
				),
				'tiktok'     => array(
					'enabled' => true,
					'link'    => 'https://tiktok.com',
				),
				'threads'    => array(
					'enabled' => false,
					'link'    => '',
				),
				'spotify'    => array(
					'enabled' => false,
					'link'    => '',
				),
				'snapchat'   => array(
					'enabled' => false,
					'link'    => '',
				),
				'soundcloud' => array(
					'enabled' => false,
					'link'    => '',
				),
				'mail'       => array(
					'enabled' => false,
					'link'    => '',
				),
				'website'    => array(
					'enabled' => false,
					'link'    => '',
				),
				'vimeo'      => array(
					'enabled' => false,
					'link'    => '',
				),
				'medium'     => array(
					'enabled' => false,
					'link'    => '',
				),
				'discord'    => array(
					'enabled' => false,
					'link'    => '',
				),
			),
			'iconSize'  => 'medium',
			'align'     => 'center',
			'shape'     => 'circle',
			'colorMode' => 'original',
			'color'     => '',
			'padding'   => array(
				'top'    => 16,
				'right'  => 16,
				'bottom' => 16,
				'left'   => 16,
			),
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

		// Container styles
		$container_style = $this->build_style_string(
			array(
				'padding'    => $this->format_padding( $props['padding'] ),
				'text-align' => $props['align'],
			)
		);

		// Get icon size in pixels
		$icon_size = 32; // Default medium
		if ( $props['iconSize'] === 'small' ) {
			$icon_size = 24;
		} elseif ( $props['iconSize'] === 'large' ) {
			$icon_size = 40;
		}

		// Get border radius based on shape
		$border_radius = '0';
		if ( $props['shape'] === 'circle' ) {
			$border_radius = '50%';
		} elseif ( $props['shape'] === 'rounded' ) {
			$border_radius = '4px';
		}

		// Find enabled platforms
		$enabled_platforms = array();
		foreach ( $props['platforms'] as $platform => $data ) {
			if ( ! empty( $data['enabled'] ) && ! empty( $data['link'] ) ) {
				$enabled_platforms[ $platform ] = $data;
			}
		}

		if ( empty( $enabled_platforms ) ) {
			// No platforms enabled, return placeholder
			return "<div style=\"{$container_style};text-align:center;padding:20px;\">
				" . esc_html__( 'No social media platforms selected', 'quillcrm' ) . '
			</div>';
		}

		// Start with a table for better email compatibility
		$html = "<div style=\"{$container_style}\">
			<table cellpadding=\"8\" cellspacing=\"0\" border=\"0\" align=\"{$props['align']}\">
				<tr>";

		// Add each platform icon
		foreach ( $enabled_platforms as $platform => $data ) {
			$link = $this->process_merge_tags( $data['link'], $merge_tags );

			// Get the icon URL
			$icon_url = $this->get_social_icon_url( $platform, $props['colorMode'] === 'original', $props['color'] );

			$html .= "<td align=\"center\" valign=\"middle\">
				<a href=\"{$link}\" target=\"_blank\" style=\"display:inline-block;\">
					<img src=\"{$icon_url}\" alt=\"{$platform}\" width=\"{$icon_size}\" height=\"{$icon_size}\" style=\"border-radius:{$border_radius};border:0;\" />
				</a>
			</td>";
		}

		$html .= '</tr></table></div>';

		return $html;
	}

	/**
	 * Get social icon URL
	 *
	 * @param string $platform Platform name
	 * @param bool   $original_colors Use original colors
	 * @param string $color Custom color (if not using original)
	 * @return string Icon URL
	 */
	private function get_social_icon_url( $platform, $original_colors = true, $color = '' ) {
		// Base directory for social icons
		$base_url = QUILLCRM_PLUGIN_URL . 'assets/images/';

		// Map platforms to icon filenames
		$icon_map = array(
			'facebook'   => 'facebook',
			'x'          => 'twitter', // Using twitter icon for X
			'instagram'  => 'instagram',
			'youtube'    => 'youtube',
			'pinterest'  => 'pinterest',
			'linkedin'   => 'linkedin',
			'tiktok'     => 'tiktok',
			'threads'    => 'threads',
			'spotify'    => 'spotify',
			'snapchat'   => 'snapchat',
			'soundcloud' => 'soundcloud',
			'mail'       => 'mail',
			'website'    => 'globe',
			'vimeo'      => 'vimeo',
			'medium'     => 'medium',
			'discord'    => 'discord',
		);

		$icon_filename = isset( $icon_map[ $platform ] ) ? $icon_map[ $platform ] : 'globe';

		// Use original color or custom color
		if ( $original_colors ) {
			return $base_url . 'social/' . $icon_filename . '.png';
		} else {
			// For custom color, we could either:
			// 1. Use a monochrome icon and apply CSS (not ideal for email)
			// 2. Use a monochrome icon file
			// 3. Generate a colored icon on the fly (more complex)

			// For now, use monochrome icons
			return $base_url . 'social/' . $icon_filename . '-mono.png';
		}
	}
}



