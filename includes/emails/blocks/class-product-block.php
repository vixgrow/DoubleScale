<?php
/**
 * Product Block
 *
 * @since 1.0.0
 *
 * @package QuillCRM
 */

namespace QuillCRM\Emails\Blocks;

use QuillCRM\Abstracts\Email_Block;

/**
 * Product block for emails
 */
class Product_Block extends Email_Block {
	/**
	 * Get block type
	 *
	 * @return string
	 */
	public function get_type(): string {
		return 'product';
	}

	/**
	 * Get block name
	 *
	 * @return string
	 */
	public function get_name(): string {
		return __( 'Product', 'quillcrm' );
	}

	/**
	 * Get default properties
	 *
	 * @return array
	 */
	public function get_default_props(): array {
		return array(
			'imageSrc'             => '',
			'imageAlt'             => 'Product Image',
			'width'                => '100%',
			'title'                => 'Product Title',
			'description'          => 'Product description goes here',
			'price'                => '99.99 EGP',
			'buttonText'           => 'Shop Now',
			'buttonLink'           => '#',
			'buttonStyle'          => 'primary',
			'padding'              => array(
				'top'    => 16,
				'right'  => 16,
				'bottom' => 16,
				'left'   => 16,
			),
			'imagePadding'         => array(
				'top'    => 8,
				'right'  => 8,
				'bottom' => 8,
				'left'   => 8,
			),
			'borderColor'          => '#e5e7eb',
			'titleColor'           => '#1f2937',
			'descriptionColor'     => '#000000',
			'priceColor'           => '#059669',
			'imageBackgroundColor' => '#f9fafb',
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

		// Process content for merge tags
		$image_src   = $this->process_merge_tags( $props['imageSrc'], $merge_tags );
		$image_alt   = $this->process_merge_tags( $props['imageAlt'], $merge_tags );
		$title       = $this->process_merge_tags( $props['title'], $merge_tags );
		$description = $this->process_merge_tags( $props['description'], $merge_tags );
		$price       = $this->process_merge_tags( $props['price'], $merge_tags );
		$button_text = $this->process_merge_tags( $props['buttonText'], $merge_tags );
		$button_link = $this->process_merge_tags( $props['buttonLink'], $merge_tags );

		// Get button settings
		$button_settings = $this->get_global_button_settings( $props['buttonStyle'] );

		// Build wrapper styles (always centered)
		$wrapper_styles = array(
			'text-align' => 'center',
			'width'      => '100%',
		);

		// Build container styles
		$container_styles = array(
			'width'          => $props['width'],
			'padding'        => $this->format_padding( $props['padding'] ),
			'border'         => '1px solid ' . $props['borderColor'],
			'border-radius'  => '8px',
			'display'        => 'inline-block',
			'vertical-align' => 'top',
			'margin'         => '0 auto',
		);

		// Build image styles
		$image_padding = $props['imagePadding'] ? $this->format_padding( $props['imagePadding'] ) : '8px';
		$image_styles  = array(
			'width'            => '100%',
			'height'           => '200px',
			'object-fit'       => 'cover',
			'border-radius'    => '4px',
			'background-color' => $props['imageBackgroundColor'],
			'padding'          => $image_padding,
		);

		$image_placeholder_styles = array(
			'width'            => '100%',
			'height'           => '200px',
			'background-color' => '#F5F5F580',
			'border-radius'    => '4px',
			'padding'          => $image_padding,
			'display'          => 'flex',
			'align-items'      => 'center',
			'justify-content'  => 'center',
			'color'            => '#6B7280',
			'font-size'        => '14px',
			'font-weight'      => '500',
		);

		// Build text styles
		$title_styles = array(
			'font-weight' => 'bold',
			'color'       => $props['titleColor'],
			'margin'      => '16px 0 8px 0',
			'font-size'   => '18px',
			'line-height' => '1.4',
		);

		$description_styles = array(
			'color'       => $props['descriptionColor'],
			'font-weight' => 'normal',
			'margin'      => '8px 0',
			'font-size'   => '14px',
			'line-height' => '1.5',
		);

		$price_styles = array(
			'color'       => $props['priceColor'],
			'font-weight' => 'bold',
			'margin'      => '8px 0 16px 0',
			'font-size'   => '18px',
			'line-height' => '1.4',
		);

		// Build button styles
		$button_styles = $this->get_button_style( $props['buttonStyle'], $button_settings );

		// Build style strings
		$wrapper_style_string           = $this->build_style_string( $wrapper_styles );
		$container_style_string         = $this->build_style_string( $container_styles );
		$image_style_string             = $this->build_style_string( $image_styles );
		$image_placeholder_style_string = $this->build_style_string( $image_placeholder_styles );
		$title_style_string             = $this->build_style_string( $title_styles );
		$description_style_string       = $this->build_style_string( $description_styles );
		$price_style_string             = $this->build_style_string( $price_styles );
		$button_style_string            = $this->build_style_string( $button_styles );

		// Render image or placeholder
		$image_html = '';
		if ( ! empty( $image_src ) ) {
			$image_html = "<img src=\"{$image_src}\" alt=\"{$image_alt}\" style=\"{$image_style_string}\" />";
		} else {
			$image_html = "<div style=\"{$image_placeholder_style_string}\">📷</div>";
		}

		// Render price with fallback
		$display_price = ! empty( $price ) ? $price : '0.00 EGP';

		return "<div style=\"{$wrapper_style_string}\">
			<div style=\"{$container_style_string}\">
				{$image_html}
				<h3 style=\"{$title_style_string}\">{$title}</h3>
				<p style=\"{$description_style_string}\">{$description}</p>
				<div style=\"{$price_style_string}\">{$display_price}</div>
				<a href=\"{$button_link}\" style=\"{$button_style_string}\">{$button_text}</a>
			</div>
		</div>";
	}

	/**
	 * Get global button settings
	 *
	 * @param string $button_style Button style type
	 * @return array Button settings
	 */
	private function get_global_button_settings( string $button_style = 'primary' ): array {
		// Get global button settings from QuillCRM settings
		$settings = get_option( 'quillcrm_button_settings', array() );

		$default_settings = array(
			'font'            => 'Arial, sans-serif',
			'size'            => 16,
			'letterSpacing'   => '0px',
			'borderRadius'    => 4,
			'bold'            => false,
			'italic'          => false,
			'underline'       => false,
			'padding'         => array(
				'top'    => 2,
				'right'  => 4,
				'bottom' => 2,
				'left'   => 4,
			),
			'backgroundColor' => '#007cba',
			'textColor'       => '#ffffff',
			'borderColor'     => '#007cba',
			'borderWidth'     => 1,
		);

		return wp_parse_args( $settings, $default_settings );
	}

	/**
	 * Get button style based on button type
	 *
	 * @param string $button_style Button style type
	 * @param array  $button_settings Button settings
	 * @return array Button styles
	 */
	private function get_button_style( string $button_style, array $button_settings ): array {
		$base_style = array(
			'display'         => 'inline-block',
			'font-family'     => $button_settings['font'],
			'font-size'       => $button_settings['size'] . 'px',
			'letter-spacing'  => $button_settings['letterSpacing'],
			'border-radius'   => $button_settings['borderRadius'] . 'px',
			'font-weight'     => ! empty( $button_settings['bold'] ) ? 'bold' : 'normal',
			'font-style'      => ! empty( $button_settings['italic'] ) ? 'italic' : 'normal',
			'text-decoration' => 'none',
			'padding'         => $this->format_button_padding( $button_settings['padding'] ),
		);

		// Apply button type specific styling
		switch ( $button_style ) {
			case 'primary':
				return array_merge(
					$base_style,
					array(
						'color'            => $button_settings['textColor'],
						'background-color' => $button_settings['backgroundColor'],
						'border'           => $button_settings['borderWidth'] . 'px solid ' . $button_settings['borderColor'],
					)
				);

			case 'secondary':
				return array_merge(
					$base_style,
					array(
						'color'            => $button_settings['backgroundColor'],
						'background-color' => 'transparent',
						'border'           => $button_settings['borderWidth'] . 'px solid ' . $button_settings['backgroundColor'],
					)
				);

			case 'tertiary':
				return array_merge(
					$base_style,
					array(
						'color'            => $button_settings['backgroundColor'],
						'background-color' => 'transparent',
						'border'           => 'none',
					)
				);

			default:
				return $base_style;
		}
	}

	/**
	 * Format button padding
	 *
	 * @param array $padding Padding array
	 * @return string CSS padding string
	 */
	private function format_button_padding( array $padding ): string {
		$top    = ( $padding['top'] ?? 2 ) * 2;
		$right  = ( $padding['right'] ?? 4 ) * 4;
		$bottom = ( $padding['bottom'] ?? 2 ) * 2;
		$left   = ( $padding['left'] ?? 4 ) * 4;

		return "{$top}px {$right}px {$bottom}px {$left}px";
	}
}
