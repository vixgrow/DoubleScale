<?php
/**
 * Timer Block
 *
 * @since 1.0.0
 *
 * @package QuillCRM
 */

namespace QuillCRM\Emails\Blocks;

use QuillCRM\Abstracts\Email_Block;

/**
 * Timer block for emails
 */
class Timer_Block extends Email_Block {
	/**
	 * Get block type
	 *
	 * @return string
	 */
	public function get_type(): string {
		return 'timer';
	}

	/**
	 * Get block name
	 *
	 * @return string
	 */
	public function get_name(): string {
		return __( 'Timer', 'quillcrm' );
	}

	/**
	 * Get default properties
	 *
	 * @return array
	 */
	public function get_default_props(): array {
		return array(
			// Timer settings
			'targetDate'          => '',
			'targetHour'          => 0,
			'targetMinute'        => 0,
			'timezone'            => 'UTC',

			// Display settings
			'width'               => '100',
			'link'                => '',
			'altText'             => '',

			// Styling
			'backgroundColor'     => '#ffffff',
			'digitsFontFamily'    => 'Arial, sans-serif',
			'digitsFontSize'      => 24,
			'digitsColor'         => '#333333',
			'separatorFontFamily' => 'Arial, sans-serif',
			'separatorFontSize'   => 24,
			'separatorColor'      => '#333333',
			'padding'             => array(
				'top'    => 20,
				'right'  => 20,
				'bottom' => 20,
				'left'   => 20,
			),

			// Legacy properties
			'content'             => 'Your text here',
			'fontSize'            => 16,
			'color'               => '#333',
			'align'               => 'center',
		);
	}

	/**
	 * Render block
	 *
	 * @param array $props Block properties
	 * @param Contact_Model|Automation_Contact_Model|null $contact Contact model for merge tags
	 * @return string HTML output
	 */
	public function render( array $props, $contact = null ): string {
		// Merge with default props
		$props = wp_parse_args( $props, $this->get_default_props() );

		// If no target date is set, show placeholder
		if ( empty( $props['targetDate'] ) ) {
			return $this->render_placeholder( $props );
		}

		// Calculate time remaining
		$target_timestamp = $this->get_target_timestamp( $props );
		$time_left        = $this->calculate_time_left( $target_timestamp );

		// Build container styles
		$container_styles = array(
			'width'            => $this->format_width( $props['width'] ),
			'background-color' => $props['backgroundColor'],
			'text-align'       => $props['align'],
			'padding'          => $this->format_padding( $props['padding'] ),
			'border-radius'    => '8px',
			'display'          => 'inline-block',
		);

		// Build digit styles
		$digit_styles = array(
			'font-family' => $props['digitsFontFamily'],
			'font-size'   => $props['digitsFontSize'] . 'px',
			'color'       => $props['digitsColor'],
			'font-weight' => 'bold',
			'margin'      => '0 4px',
		);

		// Build separator styles
		$separator_styles = array(
			'font-family' => $props['separatorFontFamily'],
			'font-size'   => $props['separatorFontSize'] . 'px',
			'color'       => $props['separatorColor'],
			'font-weight' => 'bold',
			'margin'      => '0 4px',
		);

		$time_unit_styles = array(
			'display'    => 'inline-block',
			'text-align' => 'center',
			'margin'     => '0 8px',
		);

		$container_style_string = $this->build_style_string( $container_styles );
		$digit_style_string     = $this->build_style_string( $digit_styles );
		$separator_style_string = $this->build_style_string( $separator_styles );
		$time_unit_style_string = $this->build_style_string( $time_unit_styles );

		// Format time values
		$days    = str_pad( $time_left['days'], 2, '0', STR_PAD_LEFT );
		$hours   = str_pad( $time_left['hours'], 2, '0', STR_PAD_LEFT );
		$minutes = str_pad( $time_left['minutes'], 2, '0', STR_PAD_LEFT );
		$seconds = str_pad( $time_left['seconds'], 2, '0', STR_PAD_LEFT );

		// Build timer HTML
		$timer_html = "
			<div style=\"{$container_style_string}\">
				<div>
					<div style=\"{$time_unit_style_string}\">
						<div style=\"{$digit_style_string}\">{$days}</div>
					</div>
					<span style=\"{$separator_style_string}\">:</span>
					<div style=\"{$time_unit_style_string}\">
						<div style=\"{$digit_style_string}\">{$hours}</div>
					</div>
					<span style=\"{$separator_style_string}\">:</span>
					<div style=\"{$time_unit_style_string}\">
						<div style=\"{$digit_style_string}\">{$minutes}</div>
					</div>
					<span style=\"{$separator_style_string}\">:</span>
					<div style=\"{$time_unit_style_string}\">
						<div style=\"{$digit_style_string}\">{$seconds}</div>
					</div>
				</div>
			</div>
		";

		// Wrap in link if provided
		if ( ! empty( $props['link'] ) ) {
			$alt_text   = ! empty( $props['altText'] ) ? $props['altText'] : __( 'Countdown Timer', 'quillcrm' );
			$timer_html = "<a href=\"{$props['link']}\" style=\"text-decoration: none; display: block;\" title=\"{$alt_text}\">{$timer_html}</a>";
		}

		return $timer_html;
	}

	/**
	 * Render placeholder when no target date is set
	 *
	 * @param array $props Block properties
	 * @return string HTML output
	 */
	private function render_placeholder( array $props ): string {
		$placeholder_styles = array(
			'width'            => $this->format_width( $props['width'] ),
			'background-color' => $props['backgroundColor'],
			'text-align'       => $props['align'],
			'padding'          => $this->format_padding( $props['padding'] ),
			'border-radius'    => '8px',
			'display'          => 'inline-block',
			'border'           => '2px dashed #e5e5e5',
		);

		$placeholder_text_styles = array(
			'font-family' => $props['digitsFontFamily'],
			'font-size'   => $props['digitsFontSize'] . 'px',
			'color'       => $props['digitsColor'],
			'font-weight' => 'bold',
			'text-align'  => 'center',
		);

		$placeholder_style_string      = $this->build_style_string( $placeholder_styles );
		$placeholder_text_style_string = $this->build_style_string( $placeholder_text_styles );

		return "<div style=\"{$placeholder_style_string}\">
			<div style=\"{$placeholder_text_style_string}\">00 : 00 : 00 : 00</div>
		</div>";
	}

	/**
	 * Get target timestamp
	 *
	 * @param array $props Block properties
	 * @return int Target timestamp
	 */
	private function get_target_timestamp( array $props ): int {
		try {
			$target_date = new \DateTime( $props['targetDate'] );
			$target_date->setTime( $props['targetHour'], $props['targetMinute'], 0 );

			// Convert to target timezone
			if ( ! empty( $props['timezone'] ) ) {
				$target_date->setTimezone( new \DateTimeZone( $props['timezone'] ) );
			}

			return $target_date->getTimestamp();
		} catch ( \Exception $e ) {
			return time(); // Fallback to current time
		}
	}

	/**
	 * Calculate time left until target
	 *
	 * @param int $target_timestamp Target timestamp
	 * @return array Time left array
	 */
	private function calculate_time_left( int $target_timestamp ): array {
		$now        = time();
		$difference = $target_timestamp - $now;

		if ( $difference <= 0 ) {
			return array(
				'days'    => 0,
				'hours'   => 0,
				'minutes' => 0,
				'seconds' => 0,
			);
		}

		$days    = floor( $difference / ( 60 * 60 * 24 ) );
		$hours   = floor( ( $difference % ( 60 * 60 * 24 ) ) / ( 60 * 60 ) );
		$minutes = floor( ( $difference % ( 60 * 60 ) ) / 60 );
		$seconds = $difference % 60;

		return array(
			'days'    => $days,
			'hours'   => $hours,
			'minutes' => $minutes,
			'seconds' => $seconds,
		);
	}

	/**
	 * Format width value
	 *
	 * @param string $width Width value
	 * @return string Formatted width
	 */
	private function format_width( string $width ): string {
		if ( empty( $width ) ) {
			return '100%';
		}

		// If width already has a unit, return as is
		if ( strpos( $width, '%' ) !== false || strpos( $width, 'px' ) !== false ) {
			return $width;
		}

		// If it's just a number, add % suffix
		return $width . '%';
	}
}
