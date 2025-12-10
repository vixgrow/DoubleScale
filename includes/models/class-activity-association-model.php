<?php

/**
 * Class Activity_Source_Model
 * This class is responsible for handling the activity source model
 * Links activities to their sources (deals, campaigns, companies)
 *
 * @since 1.0.0
 *
 * @package QuillCRM
 */

namespace QuillCRM\Models;

use WPEloquent\Eloquent\Model;

/**
 * Activity_Source_Model class
 */
class Activity_Association_Model extends Model {



	/**
	 * Table name
	 *
	 * @var string
	 *
	 * @since 1.0.0
	 */
	protected $table = 'quillcrm_activity_associations';

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
		'activity_id',
		'entity_type',
		'entity_id',
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
	 * Validation rules
	 *
	 * @since 1.0.0
	 *
	 * @var array
	 */
	public $rules = array(
		'activity_id' => 'required|integer',
		'entity_type' => 'required|in:deal,campaign,company',
		'entity_id'   => 'required|integer',
	);

	/**
	 * Validation messages
	 *
	 * @since 1.0.0
	 *
	 * @var array
	 */
	public $messages = array(
		'activity_id.required' => 'Activity ID is required.',
		'entity_type.required' => 'Entity type is required.',
		'entity_type.in'       => 'Entity type must be deal, campaign, or company.',
		'entity_id.required'   => 'Entity ID is required.',
	);

	/**
	 * Get the activity this association belongs to
	 *
	 * @since 1.0.0
	 *
	 * @return \Illuminate\Database\Eloquent\Relations\BelongsTo
	 */
	public function activity() {
		return $this->belongsTo( Activity_Model::class, 'activity_id', 'id' );
	}

	/**
	 * Get the associated entity (polymorphic relationship)
	 * This returns the actual deal, campaign, or company
	 *
	 * @since 1.0.0
	 *
	 * @return \Illuminate\Database\Eloquent\Relations\MorphTo
	 */
	public function entity() {
		return $this->morphTo( 'entity', 'entity_type', 'entity_id' );
	}

	/**
	 * Get deal association (if entity_type is 'deal')
	 *
	 * @since 1.0.0
	 *
	 * @return \Illuminate\Database\Eloquent\Relations\BelongsTo|null
	 */
	public function deal() {
		if ( class_exists( '\QuillCRM_Pro\Models\Deal_Model' ) ) {
			return $this->belongsTo( '\QuillCRM_Pro\Models\Deal_Model', 'entity_id', 'id' )
				->where( 'entity_type', 'deal' );
		}
		return null;
	}

	/**
	 * Get campaign association (if entity_type is 'campaign')
	 * Note: Campaign model might be in Pro or added later
	 *
	 * @since 1.0.0
	 *
	 * @return \Illuminate\Database\Eloquent\Relations\BelongsTo|null
	 */
	public function campaign() {
		if ( class_exists( '\QuillCRM_Pro\Models\Campaign_Model' ) ) {
			return $this->belongsTo( '\QuillCRM_Pro\Models\Campaign_Model', 'entity_id', 'id' )
				->where( 'entity_type', 'campaign' );
		}
		return null;
	}

	/**
	 * Scope: Filter by entity type
	 *
	 * @param \Illuminate\Database\Eloquent\Builder $query Query builder.
	 * @param string                                $type Entity type.
	 *
	 * @return \Illuminate\Database\Eloquent\Builder
	 */
	public function scopeByEntityType( $query, $type ) {
		return $query->where( 'entity_type', $type );
	}

	/**
	 * Scope: Filter by entity
	 *
	 * @param \Illuminate\Database\Eloquent\Builder $query Query builder.
	 * @param string                                $type Entity type.
	 * @param int                                   $id Entity ID.
	 *
	 * @return \Illuminate\Database\Eloquent\Builder
	 */
	public function scopeByEntity( $query, $type, $id ) {
		return $query->where( 'entity_type', $type )->where( 'entity_id', $id );
	}

	/**
	 * Scope: Filter by deal
	 *
	 * @param \Illuminate\Database\Eloquent\Builder $query Query builder.
	 * @param int                                   $deal_id Deal ID.
	 *
	 * @return \Illuminate\Database\Eloquent\Builder
	 */
	public function scopeForDeal( $query, $deal_id ) {
		return $query->where( 'entity_type', 'deal' )->where( 'entity_id', $deal_id );
	}

	/**
	 * Scope: Filter by campaign
	 *
	 * @param \Illuminate\Database\Eloquent\Builder $query Query builder.
	 * @param int                                   $campaign_id Campaign ID.
	 *
	 * @return \Illuminate\Database\Eloquent\Builder
	 */
	public function scopeForCampaign( $query, $campaign_id ) {
		return $query->where( 'entity_type', 'campaign' )->where( 'entity_id', $campaign_id );
	}


	/**
	 * Boot method
	 *
	 * @since 1.0.0
	 *
	 * @return void
	 */
	public static function boot() {
		 parent::boot();

		// Validate entity type before creating
		static::creating(
			function ( $association ) {
				if ( ! in_array( $association->entity_type, array( 'deal', 'campaign' ), true ) ) {
					throw new \Exception( 'Invalid entity type. Must be deal, campaign.' );
				}
			}
		);
	}
}
