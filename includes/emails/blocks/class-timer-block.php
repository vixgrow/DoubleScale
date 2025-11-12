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
	 * @param array                                       $props Block properties
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
		$time_left        = $this->calculate_time_left( $target_timestamp, $props );

		// Email-friendly (table-based) layout and styles
		$container_styles = array(
			'width'            => $this->format_width( $props['width'] ),
			'background-color' => $props['backgroundColor'],
			'text-align'       => $props['align'],
			'padding'          => $this->format_padding( $props['padding'] ),
			'border-radius'    => '8px',
		);

		$digit_styles = array(
			'font-family' => $props['digitsFontFamily'],
			'font-size'   => $props['digitsFontSize'] . 'px',
			'line-height' => ( $props['digitsFontSize'] + 6 ) . 'px',
			'color'       => $props['digitsColor'],
			'font-weight' => 'bold',
			'text-align'  => 'center',
			'padding'     => '8px 6px',
			'min-width'   => '32px',
			'display'     => 'inline-block',
		);

		$separator_styles = array(
			'font-family' => $props['separatorFontFamily'],
			'font-size'   => $props['separatorFontSize'] . 'px',
			'line-height' => ( $props['separatorFontSize'] + 6 ) . 'px',
			'color'       => $props['separatorColor'],
			'font-weight' => 'bold',
			'text-align'  => 'center',
			'padding'     => '8px 2px',
			'min-width'   => '8px',
			'display'     => 'inline-block',
		);

		$label_styles = array(
			'font-family' => $props['digitsFontFamily'],
			'font-size'   => '12px',
			'color'       => '#666666',
			'text-align'  => 'center',
			'padding-top' => '2px',
			'display'     => 'block',
		);

		// Format time values
		$days    = str_pad( $time_left['days'], 2, '0', STR_PAD_LEFT );
		$hours   = str_pad( $time_left['hours'], 2, '0', STR_PAD_LEFT );
		$minutes = str_pad( $time_left['minutes'], 2, '0', STR_PAD_LEFT );
		$seconds = str_pad( $time_left['seconds'], 2, '0', STR_PAD_LEFT );

		$container_style_string = $this->build_style_string( $container_styles );
		$digit_style_string     = $this->build_style_string( $digit_styles );
		$separator_style_string = $this->build_style_string( $separator_styles );
		$label_style_string     = $this->build_style_string( $label_styles );

		// Build timer HTML using tables for email client compatibility
		$timer_html  = '<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%"><tr><td style="' . $container_style_string . '">';
		$timer_html .= '<table role="presentation" cellspacing="0" cellpadding="0" border="0" align="' . esc_attr( $props['align'] ) . '" style="margin:0 auto;"><tr>';

		$timer_html .= '<td align="center"><span style="' . $digit_style_string . '">' . $days . '</span><span style="' . $label_style_string . '">' . esc_html__( 'Days', 'quillcrm' ) . '</span></td>';
		$timer_html .= '<td align="center"><span style="' . $separator_style_string . '">:</span></td>';
		$timer_html .= '<td align="center"><span style="' . $digit_style_string . '">' . $hours . '</span><span style="' . $label_style_string . '">' . esc_html__( 'Hours', 'quillcrm' ) . '</span></td>';
		$timer_html .= '<td align="center"><span style="' . $separator_style_string . '">:</span></td>';
		$timer_html .= '<td align="center"><span style="' . $digit_style_string . '">' . $minutes . '</span><span style="' . $label_style_string . '">' . esc_html__( 'Minutes', 'quillcrm' ) . '</span></td>';
		$timer_html .= '<td align="center"><span style="' . $separator_style_string . '">:</span></td>';
		$timer_html .= '<td align="center"><span style="' . $digit_style_string . '">' . $seconds . '</span><span style="' . $label_style_string . '">' . esc_html__( 'Seconds', 'quillcrm' ) . '</span></td>';

		$timer_html .= '</tr></table>';
		$timer_html .= '</td></tr></table>';

		// Wrap in link if provided
		if ( ! empty( $props['link'] ) ) {
			$alt_text   = ! empty( $props['altText'] ) ? $props['altText'] : __( 'Countdown Timer', 'quillcrm' );
			$timer_html = '<a href="' . esc_url( $props['link'] ) . '" style="text-decoration: none; display: block;" title="' . esc_attr( $alt_text ) . "\">{$timer_html}</a>";
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
			'border'           => '2px dashed #e5e5e5',
		);

		$digit_styles = array(
			'font-family' => $props['digitsFontFamily'],
			'font-size'   => $props['digitsFontSize'] . 'px',
			'line-height' => ( $props['digitsFontSize'] + 6 ) . 'px',
			'color'       => $props['digitsColor'],
			'font-weight' => 'bold',
			'text-align'  => 'center',
			'padding'     => '8px 6px',
			'min-width'   => '32px',
			'display'     => 'inline-block',
		);

		$separator_styles = array(
			'font-family' => $props['separatorFontFamily'],
			'font-size'   => $props['separatorFontSize'] . 'px',
			'line-height' => ( $props['separatorFontSize'] + 6 ) . 'px',
			'color'       => $props['separatorColor'],
			'font-weight' => 'bold',
			'text-align'  => 'center',
			'padding'     => '8px 2px',
			'min-width'   => '8px',
			'display'     => 'inline-block',
		);

		$label_styles = array(
			'font-family' => $props['digitsFontFamily'],
			'font-size'   => '12px',
			'color'       => '#666666',
			'text-align'  => 'center',
			'padding-top' => '2px',
			'display'     => 'block',
		);

		$container_style_string = $this->build_style_string( $placeholder_styles );
		$digit_style_string     = $this->build_style_string( $digit_styles );
		$separator_style_string = $this->build_style_string( $separator_styles );
		$label_style_string     = $this->build_style_string( $label_styles );

		$html  = '<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%"><tr><td style="' . $container_style_string . '">';
		$html .= '<table role="presentation" cellspacing="0" cellpadding="0" border="0" align="' . esc_attr( $props['align'] ) . '" style="margin:0 auto;"><tr>';
		$html .= '<td align="center"><span style="' . $digit_style_string . '">00</span><span style="' . $label_style_string . '">' . esc_html__( 'Days', 'quillcrm' ) . '</span></td>';
		$html .= '<td align="center"><span style="' . $separator_style_string . '">:</span></td>';
		$html .= '<td align="center"><span style="' . $digit_style_string . '">00</span><span style="' . $label_style_string . '">' . esc_html__( 'Hours', 'quillcrm' ) . '</span></td>';
		$html .= '<td align="center"><span style="' . $separator_style_string . '">:</span></td>';
		$html .= '<td align="center"><span style="' . $digit_style_string . '">00</span><span style="' . $label_style_string . '">' . esc_html__( 'Minutes', 'quillcrm' ) . '</span></td>';
		$html .= '<td align="center"><span style="' . $separator_style_string . '">:</span></td>';
		$html .= '<td align="center"><span style="' . $digit_style_string . '">00</span><span style="' . $label_style_string . '">' . esc_html__( 'Seconds', 'quillcrm' ) . '</span></td>';
		$html .= '</tr></table>';
		$html .= '</td></tr></table>';

		return $html;
	}

	/**
	 * Get target timestamp
	 *
	 * @param array $props Block properties
	 * @return int Target timestamp
	 */
	private function get_target_timestamp( array $props ): int {
		$tz_string = ! empty( $props['timezone'] ) ? $props['timezone'] : wp_timezone_string();
		if ( empty( $tz_string ) ) {
			$tz_string = 'UTC';
		}

		try {
			$tz = new \DateTimeZone( $tz_string );

			// If targetDate includes time info, use it; otherwise use targetHour/Minute
			$includes_time = (bool) preg_match( '/\d{1,2}:\d{2}/', $props['targetDate'] ) || strpos( $props['targetDate'], 'T' ) !== false;

			if ( $includes_time ) {
				$target = new \DateTime( $props['targetDate'], $tz );
			} else {
				$target = new \DateTime( $props['targetDate'], $tz );
				$hour   = is_numeric( $props['targetHour'] ) ? (int) $props['targetHour'] : 0;
				$minute = is_numeric( $props['targetMinute'] ) ? (int) $props['targetMinute'] : 0;
				$target->setTime( $hour, $minute, 0 );
			}

			return $target->getTimestamp();
		} catch ( \Exception $e ) {
			return time();
		}
	}

	/**
	 * Calculate time left until target
	 *
	 * @param int   $target_timestamp Target timestamp
	 * @param array $props Block properties (for timezone)
	 * @return array Time left array
	 */
	private function calculate_time_left( int $target_timestamp, array $props ): array {
		$tz_string = ! empty( $props['timezone'] ) ? $props['timezone'] : wp_timezone_string();
		if ( empty( $tz_string ) ) {
			$tz_string = 'UTC';
		}

		try {
			$tz     = new \DateTimeZone( $tz_string );
			$now    = new \DateTime( 'now', $tz );
			$now_ts = $now->getTimestamp();
		} catch ( \Exception $e ) {
			$now_ts = time();
		}

		$difference = $target_timestamp - $now_ts;

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
