<?php
/**
 * Class Pipeline_Stage
 * This class is responsible for handling the pipeline stage model
 *
 * @since 1.0.0
 *
 * @package QuillCRM
 */

namespace QuillCRM\Models;

use WPEloquent\Eloquent\Model;

/**
 * Pipeline_Stage class
 */
class Pipeline_Stage extends Model {

	/**
	 * Table name
	 *
	 * @var string
	 *
	 * @since 1.0.0
	 */
	protected $table = 'quillcrm_pipeline_stages';

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
		'pipeline_id',
		'name',
		'color',
		'sort_order',
		'win_probability',
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
	 * Cast attributes
	 *
	 * @var array
	 *
	 * @since 1.0.0
	 */
	protected $casts = array(
		'win_probability' => 'float',
		'sort_order' => 'integer',
	);

	/**
	 * Rules
	 *
	 * @since 1.0.0
	 *
	 * @return array
	 */
	public $rules = array(
		'pipeline_id' => 'required|integer',
		'name' => 'required|string|max:255',
		'color' => 'nullable|string|size:7',
		'sort_order' => 'nullable|integer',
		'win_probability' => 'nullable|numeric|between:0,100',
	);

	/**
	 * Messages
	 *
	 * @since 1.0.0
	 *
	 * @return array
	 */
	public $messages = array(
		'pipeline_id.required' => 'Pipeline ID is required.',
		'name.required' => 'Stage name is required.',
		'name.max' => 'Stage name must not exceed 255 characters.',
		'color.size' => 'Color must be a valid hex color code (7 characters).',
		'win_probability.between' => 'Win probability must be between 0 and 100.',
	);

	/**
	 * Get the pipeline this stage belongs to
	 *
	 * @since 1.0.0
	 *
	 * @return \Illuminate\Database\Eloquent\Relations\BelongsTo
	 */
	public function pipeline() {
		return $this->belongsTo( Pipeline::class, 'pipeline_id', 'id' );
	}

	/**
	 * Get the deals in this stage
	 *
	 * @since 1.0.0
	 *
	 * @return \Illuminate\Database\Eloquent\Relations\HasMany
	 */
	public function deals() {
		return $this->hasMany( Deal::class, 'stage_id', 'id' );
	}

	/**
	 * Get active deals (open status) in this stage
	 *
	 * @since 1.0.0
	 *
	 * @return \Illuminate\Database\Eloquent\Relations\HasMany
	 */
	public function active_deals() {
		return $this->hasMany( Deal::class, 'stage_id', 'id' )->where( 'status', 'open' );
	}

	/**
	 * Get stage total value
	 *
	 * @since 1.0.0
	 *
	 * @return float
	 */
	public function getTotalValueAttribute() {
		return $this->active_deals()->sum( 'value' );
	}

	/**
	 * Get stage deal count
	 *
	 * @since 1.0.0
	 *
	 * @return int
	 */
	public function getDealCountAttribute() {
		return $this->active_deals()->count();
	}

	/**
	 * Get weighted value (value * win probability)
	 *
	 * @since 1.0.0
	 *
	 * @return float
	 */
	public function getWeightedValueAttribute() {
		return $this->total_value * ( $this->win_probability / 100 );
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

		static::deleting(
			function( $stage ) {
				// Move all deals to the first stage of the same pipeline
				$first_stage = Pipeline_Stage::where( 'pipeline_id', $stage->pipeline_id )
					->where( 'id', '!=', $stage->id )
					->orderBy( 'sort_order' )
					->first();

				if ( $first_stage ) {
					$stage->deals()->update( array( 'stage_id' => $first_stage->id ) );
				}
			}
		);
	}
}