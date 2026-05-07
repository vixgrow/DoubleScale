<?php

/**
 * Class Activity_Source_Model
 * This class is responsible for handling the activity source model
 * Links activities to their sources (deals, campaigns, companies)
 *
 * @since 1.0.0
 *
 * @package DoubleScale\Pro
 */

namespace DoubleScale\Modules\Activities\Models;

use WPEloquent\Eloquent\Model;

/**
 * Activity_Source_Model class
 */
class ActivityAssociationModel extends Model {






	/**
	 * Table name
	 *
	 * @var string
	 *
	 * @since 1.0.0
	 */
	protected $table = 'doublescale_activity_associations';

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
	 * Entity type constants
	 *
	 * @since 1.0.0
	 */
	const ENTITY_TYPE_DEAL     = 1;
	const ENTITY_TYPE_CAMPAIGN = 2;

	/**
	 * Validation rules
	 *
	 * @since 1.0.0
	 *
	 * @var array
	 */
	public $rules = array(
		'activity_id' => 'required|integer',
		'entity_type' => 'required|integer|in:1,2',
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
		'entity_type.in'       => 'Entity type must be 1 (Deal) or 2 (Campaign).',
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
		return $this->belongsTo( ActivityModel::class, 'activity_id', 'id' );
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
	 * Get deal association (if entity_type is ENTITY_TYPE_DEAL)
	 *
	 * @since 1.0.0
	 *
	 * @return \Illuminate\Database\Eloquent\Relations\BelongsTo|null
	 */
	public function deal() {
		if ( class_exists( '\DoubleScale\Modules\Deals\Models\DealModel' ) ) {
			return $this->belongsTo( '\DoubleScale\Modules\Deals\Models\DealModel', 'entity_id', 'id' )
				->where( 'entity_type', self::ENTITY_TYPE_DEAL );
		}
		return null;
	}

	/**
	 * Get campaign association (if entity_type is ENTITY_TYPE_CAMPAIGN)
	 * Note: Campaign model might be in Pro or added later
	 *
	 * @since 1.0.0
	 *
	 * @return \Illuminate\Database\Eloquent\Relations\BelongsTo|null
	 */
	public function campaign() {
		if ( class_exists( '\DoubleScale\Modules\Campaigns\Models\CampaignModel' ) ) {
			return $this->belongsTo( '\DoubleScale\Modules\Campaigns\Models\CampaignModel', 'entity_id', 'id' )
				->where( 'entity_type', self::ENTITY_TYPE_CAMPAIGN );
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
		return $query->where( 'entity_type', self::ENTITY_TYPE_DEAL )->where( 'entity_id', $deal_id );
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
		return $query->where( 'entity_type', self::ENTITY_TYPE_CAMPAIGN )->where( 'entity_id', $campaign_id );
	}

	/**
	 * Convert string entity type to integer
	 * For backward compatibility with Api requests
	 *
	 * @param string $entity_type_string Entity type string ('deal', 'campaign').
	 *
	 * @return int|null Entity type integer or null if invalid.
	 */
	public static function string_to_entity_type( $entity_type_string ) {
		$map = array(
			'deal'     => self::ENTITY_TYPE_DEAL,
			'campaign' => self::ENTITY_TYPE_CAMPAIGN,
		);

		return $map[ strtolower( $entity_type_string ) ] ?? null;
	}

	/**
	 * Convert integer entity type to string
	 * For backward compatibility with Api responses
	 *
	 * @param int $entity_type_int Entity type integer.
	 *
	 * @return string|null Entity type string or null if invalid.
	 */
	public static function entity_type_to_string( $entity_type_int ) {
		$map = array(
			self::ENTITY_TYPE_DEAL     => 'deal',
			self::ENTITY_TYPE_CAMPAIGN => 'campaign',
		);

		return $map[ $entity_type_int ] ?? null;
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
				// Convert string to integer if needed (for backward compatibility)
				if ( is_string( $association->entity_type ) ) {
					$association->entity_type = self::string_to_entity_type( $association->entity_type );
				}

				if ( ! in_array( $association->entity_type, array( self::ENTITY_TYPE_DEAL, self::ENTITY_TYPE_CAMPAIGN ), true ) ) {
					throw new \Exception( 'Invalid entity type. Must be 1 (Deal) or 2 (Campaign).' );
				}
			}
		);
	}
}
