<?php
/**
 * Class Deal_Model
 * This class is responsible for handling the deal model
 *
 * @since 1.0.0
 *
 * @package QuillCRM
 */

namespace QuillCRM\Models;

use WPEloquent\Eloquent\Model;
use QuillCRM\Models\Contact_Model;
use QuillCRM\Models\User_Model;

/**
 * Deal_Model class
 */
class Deal_Model extends Model {

	/**
	 * Table name
	 *
	 * @var string
	 *
	 * @since 1.0.0
	 */
	protected $table = 'quillcrm_deals';

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
		'contact_id',
		'pipeline_id',
		'stage_id',
		'value',
		'currency',
		'expected_close_date',
		'status',
		'owner_id',
		'source',
		'lost_reason',
		'won_time',
		'lost_time',
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
		'value' => 'float',
		'expected_close_date' => 'date',
		'won_time' => 'datetime',
		'lost_time' => 'datetime',
	);

	/**
	 * Rules
	 *
	 * @since 1.0.0
	 *
	 * @return array
	 */
	public $rules = array(
		'title' => 'required|string|max:255',
		'contact_id' => 'required|integer',
		'pipeline_id' => 'required|integer',
		'stage_id' => 'required|integer',
		'value' => 'nullable|numeric|min:0',
		'currency' => 'nullable|string|size:3',
		'status' => 'required|in:open,won,lost',
		'owner_id' => 'nullable|integer',
	);

	/**
	 * Messages
	 *
	 * @since 1.0.0
	 *
	 * @return array
	 */
	public $messages = array(
		'title.required' => 'Deal title is required.',
		'title.max' => 'Deal title must not exceed 255 characters.',
		'contact_id.required' => 'Contact is required.',
		'pipeline_id.required' => 'Pipeline is required.',
		'stage_id.required' => 'Stage is required.',
		'value.numeric' => 'Deal value must be a number.',
		'value.min' => 'Deal value cannot be negative.',
		'currency.size' => 'Currency must be a 3-letter code.',
		'status.in' => 'Status must be open, won, or lost.',
	);

	/**
	 * Get the contact this deal belongs to
	 *
	 * @since 1.0.0
	 *
	 * @return \Illuminate\Database\Eloquent\Relations\BelongsTo
	 */
	public function contact() {
		return $this->belongsTo( Contact_Model::class, 'contact_id', 'id' );
	}

	/**
	 * Get the pipeline this deal belongs to
	 *
	 * @since 1.0.0
	 *
	 * @return \Illuminate\Database\Eloquent\Relations\BelongsTo
	 */
	public function pipeline() {
		return $this->belongsTo( Pipeline_Model::class, 'pipeline_id', 'id' );
	}

	/**
	 * Get the stage this deal is in
	 *
	 * @since 1.0.0
	 *
	 * @return \Illuminate\Database\Eloquent\Relations\BelongsTo
	 */
	public function stage() {
		return $this->belongsTo( Pipeline_Stage_Model::class, 'stage_id', 'id' );
	}

	/**
	 * Get the deal owner (WordPress user)
	 *
	 * @since 1.0.0
	 *
	 * @return \Illuminate\Database\Eloquent\Relations\BelongsTo
	 */
	public function owner() {
		return $this->belongsTo( User_Model::class, 'owner_id', 'ID' );
	}

	/**
	 * Get the deal activities
	 *
	 * @since 1.0.0
	 *
	 * @return \Illuminate\Database\Eloquent\Relations\HasMany
	 */
	public function activities() {
		return $this->hasMany( Deal_Activity_Model::class, 'deal_id', 'id' )->orderBy( 'created_at', 'desc' );
	}

	/**
	 * Check if deal is overdue
	 *
	 * @since 1.0.0
	 *
	 * @return bool
	 */
	public function getIsOverdueAttribute() {
		return $this->expected_close_date && 
			   $this->expected_close_date->isPast() && 
			   $this->status === 'open';
	}

	/**
	 * Get days until close
	 *
	 * @since 1.0.0
	 *
	 * @return int|null
	 */
	public function getDaysUntilCloseAttribute() {
		if ( ! $this->expected_close_date ) {
			return null;
		}

		return (new \DateTime())->diff($this->expected_close_date)->days * (($this->expected_close_date > new \DateTime()) ? 1 : -1);
	}

	/**
	 * Get weighted value based on stage win probability
	 *
	 * @since 1.0.0
	 *
	 * @return float
	 */
	public function getWeightedValueAttribute() {
		$stage = $this->stage;
		if ( ! $stage ) {
			return 0;
		}

		return $this->value * ( $stage->win_probability / 100 );
	}

	/**
	 * Move deal to a different stage
	 *
	 * @since 1.0.0
	 *
	 * @param int $stage_id New stage ID
	 * @param int|null $user_id User making the change
	 *
	 * @return bool
	 */
	public function moveToStage( $stage_id, $user_id = null ) {
		$old_stage_id = $this->stage_id;
		
		if ( $old_stage_id == $stage_id ) {
			return false;
		}

		$this->stage_id = $stage_id;
		$saved = $this->save();

		if ( $saved ) {
			// Log the stage change activity
			Deal_Activity_Model::create( array(
				'deal_id' => $this->id,
				'activity_type' => 'stage_changed',
				'data' => wp_json_encode( array(
					'old_stage_id' => $old_stage_id,
					'new_stage_id' => $stage_id,
				) ),
				'user_id' => $user_id,
			) );

			do_action( 'quillcrm_deal_stage_changed', $this, $old_stage_id, $stage_id );
		}

		return $saved;
	}

	/**
	 * Mark deal as won
	 *
	 * @since 1.0.0
	 *
	 * @param int|null $user_id User making the change
	 *
	 * @return bool
	 */
	public function markAsWon( $user_id = null ) {
		$this->status = 'won';
		$this->won_time = current_time('mysql');
		$saved = $this->save();

		if ( $saved ) {
			Deal_Activity_Model::create( array(
				'deal_id' => $this->id,
				'activity_type' => 'status_changed',
				'data' => wp_json_encode( array(
					'status' => 'won',
				) ),
				'user_id' => $user_id,
			) );

			do_action( 'quillcrm_deal_won', $this );
		}

		return $saved;
	}

	/**
	 * Mark deal as lost
	 *
	 * @since 1.0.0
	 *
	 * @param string $reason Reason for losing the deal
	 * @param int|null $user_id User making the change
	 *
	 * @return bool
	 */
	public function markAsLost( $reason = '', $user_id = null ) {
		$this->status = 'lost';
		$this->lost_time = current_time('mysql');
		$this->lost_reason = $reason;
		$saved = $this->save();

		if ( $saved ) {
			Deal_Activity_Model::create( array(
				'deal_id' => $this->id,
				'activity_type' => 'status_changed',
				'data' => wp_json_encode( array(
					'status' => 'lost',
					'reason' => $reason,
				) ),
				'user_id' => $user_id,
			) );

			do_action( 'quillcrm_deal_lost', $this );
		}

		return $saved;
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

		static::created(
			function( $deal ) {
				// Log deal creation activity
				Deal_Activity_Model::create( array(
					'deal_id' => $deal->id,
					'activity_type' => 'created',
					'data' => wp_json_encode( array(
						'title' => $deal->title,
						'value' => $deal->value,
						'currency' => $deal->currency,
					) ),
					'user_id' => get_current_user_id(),
				) );

				do_action( 'quillcrm_deal_created', $deal );
			}
		);

		static::updated(
			function( $deal ) {
				$changes = $deal->getChanges();
				
				// Log value changes
				if ( isset( $changes['value'] ) ) {
					Deal_Activity_Model::create( array(
						'deal_id' => $deal->id,
						'activity_type' => 'value_changed',
						'data' => wp_json_encode( array(
							'old_value' => $deal->getOriginal( 'value' ),
							'new_value' => $changes['value'],
						) ),
						'user_id' => get_current_user_id(),
					) );
				}

				do_action( 'quillcrm_deal_updated', $deal, $changes );
			}
		);

		static::deleting(
			function( $deal ) {
				// Delete all activities
				$deal->activities()->delete();
			}
		);
	}
}