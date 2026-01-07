<?php

/**
 * Class Lead_Scoring_Rule_Model
 *
 * This class is responsible for handling the Lead Scoring Rule model
 *
 * @since 1.0.0
 *
 * @package QuillCRM
 */

namespace QuillCRM\Models;

use WPEloquent\Eloquent\Model;

/**
 * Lead_Scoring_Rule_Model class
 */
class Lead_Scoring_Rule_Model extends Model {




	/**
	 * Table name
	 *
	 * @var string
	 *
	 * @since 1.0.0
	 */
	protected $table = 'quillcrm_lead_scoring_rules';

	/**
	 * Primary key
	 *
	 * @var string
	 *
	 * @since 1.0.0
	 */
	protected $primary_key = 'id';

	/**
	 * Fillable columns
	 *
	 * @var array
	 *
	 * @since 1.0.0
	 */
	protected $fillable = array(
		'title',
		'status',
		'points',
		'is_adding',
		'settings',
		'created_at',
		'updated_at',
	);

	/**
	 * Timestamps
	 *
	 * @var bool
	 *
	 * @since 1.0.0
	 */
	public $timestamps = true;

	/**
	 * Casts
	 *
	 * @var array
	 */
	protected $casts = array(
		'settings'  => 'array',
		'is_adding' => 'boolean',
		'points'    => 'integer',
	);


	/**
	 * Get all active rules
	 *
	 * @since 1.0.0
	 *
	 * @return \Illuminate\Database\Eloquent\Collection
	 */
	public static function get_active_rules() {
		 return self::where( 'status', 'active' )->get();
	}

	/**
	 * Get rules by status
	 *
	 * @param string $status Status (active/inactive).
	 *
	 * @since 1.0.0
	 *
	 * @return \Illuminate\Database\Eloquent\Collection
	 */
	public static function get_by_status( $status ) {
		return self::where( 'status', $status )->get();
	}

	/**
	 * Check if the rule adds or subtracts points
	 *
	 * @since 1.0.0
	 *
	 * @return bool
	 */
	public function is_adding_points() {
		return (bool) $this->is_adding;
	}

	/**
	 * Get the points with proper sign
	 *
	 * @since 1.0.0
	 *
	 * @return int
	 */
	public function get_signed_points() {
		return $this->is_adding ? $this->points : -$this->points;
	}

	/**
	 * Scope to filter adding rules
	 *
	 * @param \Illuminate\Database\Eloquent\Builder $query Query builder.
	 *
	 * @since 1.0.0
	 *
	 * @return \Illuminate\Database\Eloquent\Builder
	 */
	public function scopeAdding( $query ) {
		return $query->where( 'is_adding', 1 );
	}

	/**
	 * Scope to filter subtracting rules
	 *
	 * @param \Illuminate\Database\Eloquent\Builder $query Query builder.
	 *
	 * @since 1.0.0
	 *
	 * @return \Illuminate\Database\Eloquent\Builder
	 */
	public function scopeSubtracting( $query ) {
		return $query->where( 'is_adding', 0 );
	}
}
