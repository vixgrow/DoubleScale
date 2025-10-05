<?php
/**
 * Video Block
 *
 * @since 1.0.0
 *
 * @package QuillCRM
 */

namespace QuillCRM\Emails\Blocks;

use QuillCRM\Abstracts\Email_Block;

/**
 * Video block for emails
 */
class Video_Block extends Email_Block {
	/**
	 * Get block type
	 *
	 * @return string
	 */
	public function get_type(): string {
		return 'video';
	}

	/**
	 * Get block name
	 *
	 * @return string
	 */
	public function get_name(): string {
		return __( 'Video', 'quillcrm' );
	}

	/**
	 * Get default properties
	 *
	 * @return array
	 */
	public function get_default_props(): array {
		return array(
			'videoUrl'        => '',
			'imageUrl'        => '',
			'alt'             => 'Video',
			'width'           => '100%',
			'height'          => 'auto',
			'align'           => 'center',
			'backgroundColor' => '#000000',
			'padding'         => array(
				'top'    => 0,
				'right'  => 0,
				'bottom' => 0,
				'left'   => 0,
			),
			'borderRadius'    => '0',
			'shape'           => 'rectangle',
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

		// Process URLs for merge tags
		$video_url = $this->process_merge_tags( $props['videoUrl'], $merge_tags );
		$image_url = $this->process_merge_tags( $props['imageUrl'], $merge_tags );
		$alt_text  = $this->process_merge_tags( $props['alt'], $merge_tags );

		// Get background color (matches frontend getBackgroundColor)
		$background_color = '#000000'; // Default black
		if ( ! empty( $props['backgroundColor'] ) && $props['backgroundColor'] !== 'transparent' ) {
			$background_color = $props['backgroundColor'];
		}

		// Get alignment margin (matches frontend getContainerStyle)
		$margin = '0';
		switch ( $props['align'] ) {
			case 'center':
				$margin = '0 auto';
				break;
			case 'right':
				$margin = '0 0 0 auto';
				break;
			default: // left
				$margin = '0';
		}

		// Container styles (matches frontend getContainerStyle)
		$container_styles = array(
			'width'            => $props['width'] === 'auto' ? '100%' : $props['width'],
			'height'           => $props['height'] === 'auto' ? 'auto' : $props['height'],
			'position'         => 'relative',
			'border-radius'    => $props['borderRadius'] . 'px',
			'background-color' => $background_color,
			'padding'          => $this->format_padding( $props['padding'] ),
			'margin'           => $margin,
			'overflow'         => 'hidden',
		);

		$container_style_string = $this->build_style_string( $container_styles );

		// If no video URL, show placeholder (matches frontend)
		if ( empty( $video_url ) ) {
			return $this->render_placeholder( $container_style_string );
		}

		// If there's a thumbnail image, show it with play button (matches frontend)
		if ( ! empty( $image_url ) ) {
			return $this->render_with_thumbnail( $container_style_string, $image_url, $alt_text, $video_url, $props );
		}

		// Direct video link (fallback for email clients that don't support video)
		return $this->render_video_link( $container_style_string, $video_url, $alt_text );
	}

	/**
	 * Render placeholder when no video URL (matches frontend)
	 *
	 * @param string $container_style Container style string
	 * @return string HTML output
	 */
	private function render_placeholder( string $container_style ): string {
		// Add height for placeholder (matches frontend isPlaceholder = true)
		$container_style_with_height = str_replace( 'height: auto;', 'height: 300px;', $container_style );
		if ( strpos( $container_style_with_height, 'height: 300px;' ) === false ) {
			$container_style_with_height = $container_style . ' height: 300px;';
		}

		$placeholder_styles = array(
			'display'         => 'flex',
			'flex-direction'  => 'column',
			'align-items'     => 'center',
			'justify-content' => 'center',
			'color'           => 'white',
			'height'          => '100%',
		);

		$placeholder_style_string = $this->build_style_string( $placeholder_styles );

		return "<div style=\"{$container_style_with_height}\">
			<div style=\"{$placeholder_style_string}\">📹</div>
		</div>";
	}

	/**
	 * Render with thumbnail image (matches frontend)
	 *
	 * @param string $container_style Container style string
	 * @param string $image_url Image URL
	 * @param string $alt_text Alt text
	 * @param string $video_url Video URL
	 * @param array  $props Block properties
	 * @return string HTML output
	 */
	private function render_with_thumbnail( string $container_style, string $image_url, string $alt_text, string $video_url, array $props ): string {
		// Image styles (matches frontend)
		$image_styles = array(
			'width'         => '100%',
			'height'        => '100%',
			'object-fit'    => 'cover',
			'border-radius' => $props['borderRadius'] . 'px',
		);

		// Play button styles (matches frontend)
		$play_button_styles = array(
			'position'         => 'absolute',
			'top'              => '50%',
			'left'             => '50%',
			'transform'        => 'translate(-50%, -50%)',
			'background-color' => 'rgba(0, 0, 0, 0.7)',
			'border-radius'    => '50%',
			'width'            => '60px',
			'height'           => '60px',
			'display'          => 'flex',
			'align-items'      => 'center',
			'justify-content'  => 'center',
			'cursor'           => 'pointer',
			'transition'       => 'all 0.3s ease',
		);

		$image_style_string       = $this->build_style_string( $image_styles );
		$play_button_style_string = $this->build_style_string( $play_button_styles );

		// Simple structure matching frontend exactly
		return "<div style=\"{$container_style}\">
			<img src=\"{$image_url}\" alt=\"{$alt_text}\" style=\"{$image_style_string}\" />
			<div style=\"{$play_button_style_string}\">
				<a href=\"{$video_url}\" target=\"_blank\" style=\"color: white; text-decoration: none; font-size: 24px;\">▶</a>
			</div>
		</div>";
	}

	/**
	 * Render video link (fallback)
	 *
	 * @param string $container_style Container style string
	 * @param string $video_url Video URL
	 * @param string $alt_text Alt text
	 * @return string HTML output
	 */
	private function render_video_link( string $container_style, string $video_url, string $alt_text ): string {
		$link_styles = array(
			'display'         => 'flex',
			'align-items'     => 'center',
			'justify-content' => 'center',
			'color'           => 'white',
			'text-decoration' => 'none',
			'height'          => '200px',
			'font-size'       => '16px',
		);

		$link_style_string = $this->build_style_string( $link_styles );

		return "<div style=\"{$container_style}\">
			<a href=\"{$video_url}\" target=\"_blank\" rel=\"noopener noreferrer\" style=\"{$link_style_string}\">
				▶ {$alt_text}
			</a>
		</div>";
	}

	/**
	 * Get alignment margin
	 *
	 * @param string $align Alignment value
	 * @return string Margin value
	 */
	private function get_alignment_margin( string $align ): string {
		switch ( $align ) {
			case 'center':
				return '0 auto';
			case 'right':
				return '0 0 0 auto';
			case 'left':
			default:
				return '0';
		}
	}
}
