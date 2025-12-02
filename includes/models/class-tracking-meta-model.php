<?php
namespace QuillCRM\Models;

use WPEloquent\Eloquent\Model;
use QuillCRM\Models\Tracking_Model;
use QuillCRM\Models\Contact_Model;
use QuillCRM\Managers\Merge_Tags_Manager;

class Tracking_Meta_Model extends Model {
	protected $table       = 'quillcrm_tracking_meta';
	protected $primary_key = 'id';
	protected $fillable    = array(
		'tracking_id',
		'merge_tags',
		'sections_ids',
	);
	protected $casts       = array(
		'tracking_id'  => 'integer',
		'merge_tags'   => 'array',
		'sections_ids' => 'array',
	);

	public $timestamps = true;

	public function tracking() {
		return $this->belongsTo( Tracking_Model::class, 'tracking_id' );
	}

	/**
	 * Capture merge tags using pre-extracted keys (optimized approach)
	 *
	 * @param int           $tracking_id Tracking ID
	 * @param array         $merge_tag_keys Pre-extracted merge tag keys
	 * @param Contact_Model $contact Contact model
	 * @return Tracking_Meta_Model
	 */
	public static function capture_merge_tags_from_keys( $tracking_id, $merge_tag_keys, Contact_Model $contact ) {
		$merge_tag_values = Merge_Tags_Manager::instance()->get_merge_tag_values_for_keys(
			$merge_tag_keys,
			$contact
		);

		return self::create(
			array(
				'tracking_id' => $tracking_id,
				'merge_tags'  => $merge_tag_values,
			)
		);
	}

	/**
	 * Render template content using stored merge tag values
	 *
	 * @param string $template_content Original template content
	 * @return string Rendered content with stored values
	 */
	public function render_with_stored_values( $template_content ) {
		if ( empty( $this->merge_tags ) ) {
			return $template_content;
		}

		// Use the same regex pattern as Merge_Tags_Manager
		return preg_replace_callback(
			'/{{(.*?):(.*?)}}/',
			function ( $matches ) {
				$group          = $matches[1];
				$slug           = $matches[2];
				$slug_parts     = explode( ' ', $slug );
				$merge_tag_slug = $slug_parts[0];
				$full_tag       = "{$group}:{$merge_tag_slug}";

				// Return stored value if exists, otherwise return empty
				return isset( $this->merge_tags[ $full_tag ] ) ? $this->merge_tags[ $full_tag ] : '';
			},
			$template_content
		);
	}
}
