<?php
/**
 * Class Merge Tag Manager
 *
 * This class is responsible for handling the merge tags
 *
 * @since 1.0.0
 *
 * @package DoubleScale
 */

namespace DoubleScale\Modules\Booking\Managers;

use DoubleScale\Modules\Booking\Abstracts\MergeTag;
use DoubleScale\Modules\Booking\Models\BookingModel;
use DoubleScale\Modules\Booking\Abstracts\Manager;
use DoubleScale\Modules\Booking\Traits\Singleton;

final class MergeTagsManager extends \DoubleScale\Modules\Booking\Abstracts\Manager {

	use \DoubleScale\Modules\Booking\Traits\Singleton;

	/**
	 * Merge Tag Groups
	 *
	 * @var array
	 */
	private $groups = array();

	/**
	 * Register Merge Tag
	 *
	 * @since 1.0.0
	 *
	 * @param MergeTag $merge_tag Merge Tag.
	 */
	public function register_merge_tag( MergeTag $merge_tag ) {
		$slug            = $merge_tag->slug;
		$merge_tag->slug = $merge_tag->group . '_' . $merge_tag->slug;
		parent::register( $merge_tag, MergeTag::class, 'slug' );

		$this->groups[ $merge_tag->group ]['mergeTags'][ $slug ] = array(
			'name'  => $merge_tag->name,
			'value' => "{{{$merge_tag->group}:{$slug}}}",
		);
	}

	/**
	 * Get Merge Tag
	 *
	 * @since 1.0.0
	 *
	 * @param string $slug Slug.
	 *
	 * @return MergeTag|null
	 */
	public function get_merge_tag( $slug ) {
		return $this->get_item( $slug );
	}

	/**
	 * Get Merge Tags
	 *
	 * @since 1.0.0
	 *
	 * @return array
	 */
	public function get_merge_tags() {
		return $this->get_items();
	}

	/**
	 * Get Merge Tag Groups
	 *
	 * @since 1.0.0
	 *
	 * @return array
	 */
	public function get_groups() {
		return $this->groups;
	}

	/**
	 * Process Merge Tags
	 *
	 * @since 1.0.0
	 *
	 * @param string             $content Content.
	 * @param BookingModel|null $booking Booking Model.
	 *
	 * @return string
	 */
	/**
	 * Legacy dot-notation aliases used by some frontend-generated templates.
	 * Maps "group.slug" -> "group:slug" that the registered merge tags use.
	 *
	 * @var array
	 */
	private static $dot_aliases = array(
		'guest.full_name' => 'guest:name',
		'guest.name'      => 'guest:name',
		'guest.email'     => 'guest:email',
		'guest.note'      => 'guest:note',
		'guest.timezone'  => 'guest:timezone',
		'host.name'       => 'host:name',
		'host.email'      => 'host:email',
		'host.timezone'   => 'host:timezone',
		'booking.event_name'    => 'booking:event_name',
		'booking.service_name'  => 'booking:service_name',
		'booking.start_time'    => 'booking:start_time',
		'booking.end_time'      => 'booking:end_time',
		'booking.event_location' => 'booking:event_location',
		'booking.name'          => 'booking:name',
		'booking.timezone'      => 'booking:timezone',
		'booking.hash'          => 'booking:hash',
		'booking.cancel_url'    => 'booking:cancel_url',
		'booking.reschedule_url' => 'booking:reschedule_url',
		'booking.details_url'   => 'booking:details_url',
		'booking.confirm_url'   => 'booking:confirm_url',
		'booking.reject_url'    => 'booking:reject_url',
		'booking.start_date_time_for_host'    => 'booking:start_time',
		'booking.start_date_time_for_attendee' => 'booking:start_time',
		'booking.additional_guests'           => 'booking:additional_guests',
	);

	/**
	 * Process Merge Tags
	 *
	 * @since 1.0.0
	 *
	 * @param string             $content Content.
	 * @param BookingModel|null $booking Booking Model.
	 *
	 * @return string
	 */
	public function process_merge_tags( $content, $booking ) {
		if ( ! is_string( $content ) || empty( $content ) ) {
			return '';
		}

		// First pass: convert dot-notation tags to colon-notation
		$content = preg_replace_callback(
			'/\{\{([a-zA-Z_]+)\.([a-zA-Z_]+)\}\}/',
			function ( $matches ) {
				$dot_key = $matches[1] . '.' . $matches[2];
				if ( isset( self::$dot_aliases[ $dot_key ] ) ) {
					return '{{' . self::$dot_aliases[ $dot_key ] . '}}';
				}
				// Try direct group:slug conversion as fallback
				return '{{' . $matches[1] . ':' . $matches[2] . '}}';
			},
			$content
		);

		// Second pass: process colon-notation tags (the canonical format)
		return preg_replace_callback(
			'/{{(.*?):(.*?)}}/',
			function( $matches ) use ( $booking ) {
				$group   = $matches[1];
				$slug    = $matches[2];
				$options = array();

				// Extract options from the slug
				if ( preg_match_all( '/(\w+)="([^"]+)"/', $slug, $option_matches ) ) {
					foreach ( $option_matches[1] as $key => $option_name ) {
						$options[ $option_name ] = $option_matches[2][ $key ];
					}

					// Remove options from the slug
					$slug = strtok( $slug, ' ' );
				}

				// Get the merge tag instance by group and slug
				$merge_tag = $this->get_item( $group . '_' . $slug );

				if ( ! $merge_tag ) {
					return '';
				}

				return $merge_tag->get_value( $booking, $options );
			},
			$content
		);
	}
}
