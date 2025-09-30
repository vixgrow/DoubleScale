<?php

/**
 * Class Deal_Manager
 * This class is responsible for handling deal management
 *
 * @since 1.0.0
 *
 * @package QuillCRM
 */

namespace QuillCRM\Managers;

use Exception;
use QuillCRM\Models\Deal_Model;
use QuillCRM\Models\Deal_Activity_Model;
use QuillCRM\Models\Contact_Model;
use QuillCRM\Models\Pipeline_Model;
use QuillCRM\Models\Pipeline_Stage_Model;
use QuillCRM\User_Roles\Permissions;

/**
 * Deal_Manager class
 */
final class Deal_Manager {







































	/**
	 * Class Instance.
	 *
	 * @since 1.0.0
	 *
	 * @var Deal_Manager
	 */
	private static $instance;

	/**
	 * Manager Instance.
	 *
	 * Instantiates or reuses an instance of Deal_Manager.
	 *
	 * @since  1.0.0
	 *
	 * @return Deal_Manager
	 */
	public static function instance() {
		if ( is_null( self::$instance ) ) {
			self::$instance = new self();
		}

		return self::$instance;
	}

	/**
	 * Constructor
	 *
	 * @since 1.0.0
	 */
	private function __construct() {
		add_action( 'quillcrm_loaded', array( $this, 'init' ) );
	}

	/**
	 * Initialize
	 *
	 * @since 1.0.0
	 *
	 * @return void
	 */
	public function init() {
		// Add any initialization hooks here
	}

	/**
	 * Create deal
	 *
	 * @since 1.0.0
	 *
	 * @param array $data Deal data
	 *
	 * @return Deal|null
	 */
	public function create_deal( $data ) {
		try {
			// Validate required fields
			if ( empty( $data['title'] ) || empty( $data['contact_id'] ) || empty( $data['pipeline_id'] ) || empty( $data['stage_id'] ) ) {
				throw new Exception( 'Missing required deal data' );
			}

			// Validate contact exists
			$contact = Contact_Model::find( $data['contact_id'] );
			if ( ! $contact ) {
				throw new Exception( 'Contact not found' );
			}

			// Validate pipeline and stage
			$stage = Pipeline_Stage_Model::where( 'id', $data['stage_id'] )
				->where( 'pipeline_id', $data['pipeline_id'] )
				->first();

			if ( ! $stage ) {
				throw new Exception( 'Invalid pipeline or stage' );
			}

			// Set defaults
			$deal_data = array_merge(
				array(
					'value'       => 0.00,
					'currency'    => 'USD',
					'status'      => Deal_Model::get_status_from_probability( $stage->win_probability ),
					'owner_id'    => get_current_user_id(),
					'probability' => $stage->win_probability,
				),
				$data
			);

			$deal = Deal_Model::create( $deal_data );

			do_action( 'quillcrm_deal_created_by_manager', $deal );

			return $deal;
		} catch ( Exception $e ) {
			error_log( 'QuillCRM Deal Manager Error: ' . $e->getMessage() );
			return null;
		}
	}

	/**
	 * Update deal
	 *
	 * @since 1.0.0
	 *
	 * @param int   $deal_id Deal ID
	 * @param array $data Updated data
	 *
	 * @return Deal|null
	 */
	public function update_deal( $deal_id, $data ) {
		$deal = Deal_Model::find( $deal_id );

		if ( ! $deal ) {
			return null;
		}

		if ( Permissions::is_deal_owner() ) {
			if ( $deal->owner_id != get_current_user_id() ) {
				return null;
			} else {
				// Deal owners cannot change these core relationship fields
				$data['owner_id']    = get_current_user_id();
				$data['pipeline_id'] = $deal->pipeline_id;
				$data['contact_id']  = $deal->contact_id;
			}
		}

		$old_owner_id = $deal->owner_id;
		$new_owner_id = $data['owner_id'];
		$old_value    = $deal->value;
		$new_value    = $data['value'];

		// If stage is being changed, validate it belongs to the pipeline
		if ( isset( $data['stage_id'] ) && $data['stage_id'] != $deal->stage_id ) {
			$stage = Pipeline_Stage_Model::where( 'id', $data['stage_id'] )
				->where( 'pipeline_id', $data['pipeline_id'] )
				->first();

			if ( ! $stage ) {
				throw new Exception( 'Invalid pipeline or stage' );
			}

			$data['probability'] = $stage->win_probability;
			$data['status']      = Deal_Model::get_status_from_probability( $stage->win_probability );
		}
		$old_status = $deal->status;
		$new_status = $data['status'];

		// Update status timestamps using helper method
		$this->update_status_timestamps( $deal, $new_status, $old_status );

		$deal->fill( $data );
		$deal->save();

		do_action( 'quillcrm_deal_updated_by_manager', $deal );
		do_action( 'quillcrm_automation_deal_owner_changed', $deal->contact, $deal, $old_owner_id, $new_owner_id );
		do_action( 'quillcrm_automation_deal_value_changed', $deal->contact, $deal, $old_value, $new_value );

		if ( isset( $data['status'] ) ) {
			do_action( 'quillcrm_automation_deal_status_changed', $deal->contact, $deal, $old_status, $new_status );
		}

		return $deal;
	}

	/**
	 * Move deal to different stage
	 *
	 * @since 1.0.0
	 *
	 * @param int      $deal_id Deal ID
	 * @param int      $stage_id Target stage ID
	 * @param int|null $user_id User performing the action
	 * @param bool     $update_probability Whether to update deal probability to match new stage
	 *
	 * @return bool
	 */
	public function move_deal_to_stage( $deal_id, $stage_id, $user_id = null, $update_probability = false ) {
		$deal                  = Deal_Model::find( $deal_id );
		$stage                 = Pipeline_Stage_Model::find( $stage_id );
		$pipeline_id_for_stage = $stage->pipeline_id;
		if ( ! $deal ) {
			return false;
		}

		if ( Permissions::is_deal_owner() ) {
			if ( $deal->owner_id != $user_id && $deal->pipeline_id != $pipeline_id_for_stage ) {
				return false;
			}
		}

		$old_stage_id = $deal->stage_id;
		$new_stage_id = $stage_id;
		$move         = $deal->moveToStage( $stage_id, $user_id, true );
		$old_status   = $deal->status;
		$new_status   = $deal->get_status_from_probability( $stage->win_probability );

		// update status
		$deal->status = $new_status;
		$this->update_status_timestamps( $deal, $new_status, $old_status );
		$deal->save();

		if ( $move ) {
			do_action( 'quillcrm_automation_deal_stage_changed', $deal->contact, $deal, $old_stage_id, $new_stage_id );
			do_action( 'quillcrm_automation_deal_status_changed', $deal->contact, $deal, $old_status, $new_status );
		}
		return $move;
	}

	/**
	 * Move deal to different pipeline
	 *
	 * @since 1.0.0
	 *
	 * @param int      $deal_id Deal ID
	 * @param int      $pipeline_id Target pipeline ID
	 * @param int|null $stage_id Target stage ID (null = first stage)
	 * @param int|null $user_id User performing the action
	 *
	 * @return bool
	 */
	public function move_deal_to_pipeline( $deal_id, $pipeline_id, $stage_id = null, $user_id = null ) {

		$deal            = Deal_Model::find( $deal_id );
		$target_pipeline = Pipeline_Model::with( 'stages' )->find( $pipeline_id );

		if ( ! $deal || ! $target_pipeline ) {
			return false;
		}

		// If no stage specified, use first stage of target pipeline
		if ( ! $stage_id ) {
			$first_stage = $target_pipeline->stages->sortBy( 'sort_order' )->first();
			if ( ! $first_stage ) {
				return false;
			}
			$stage_id = $first_stage->id;
		}

		$old_pipeline_id = $deal->pipeline_id;
		$old_stage_id    = $deal->stage_id;

		$stage = Pipeline_Stage_Model::find( $stage_id );
		if ( ! $stage ) {
			return false;
		}

		$deal->pipeline_id = $pipeline_id;
		$deal->stage_id    = $stage_id;
		$old_status        = $deal->status;
		$new_status        = $deal->get_status_from_probability( $stage->win_probability );
		$deal->status      = $new_status;
		$this->update_status_timestamps( $deal, $new_status, $old_status );
		$saved = $deal->save();

		if ( $saved ) {
			// Log the pipeline change activity
			Deal_Activity_Model::create(
				array(
					'deal_id'       => $deal->id,
					'activity_type' => 'stage_changed',
					'data'          => array(
						'old_pipeline_id' => $old_pipeline_id,
						'new_pipeline_id' => $pipeline_id,
						'old_stage_id'    => $old_stage_id,
						'new_stage_id'    => $stage_id,
					),
					'user_id'       => $user_id ?: get_current_user_id(),
				)
			);

			do_action( 'quillcrm_deal_pipeline_changed', $deal, $old_pipeline_id, $pipeline_id );
			do_action( 'quillcrm_automation_deal_status_changed', $deal->contact, $deal, $old_status, $new_status );
		}

		return $saved;
	}


	/**
	 * Get deals with filters
	 *
	 * @since 1.0.0
	 *
	 * @param array $filters Filter criteria
	 * @param int   $per_page Results per page
	 * @param int   $page Page number
	 *
	 * @return \Illuminate\Pagination\LengthAwarePaginator
	 */
	public function get_deals_with_filters( $filters = array(), $per_page = 20, $page = 1 ) {
		$query = Deal_Model::with( array( 'contact', 'pipeline', 'stage', 'owner' ) );

		// Filter by pipeline
		if ( ! empty( $filters['pipeline_id'] ) ) {
			$query->where( 'pipeline_id', $filters['pipeline_id'] );
		}

		// Filter by stage
		if ( ! empty( $filters['stage_id'] ) ) {
			$query->where( 'stage_id', $filters['stage_id'] );
		}

		// Filter by status
		if ( ! empty( $filters['status'] ) ) {
			$query->where( 'status', $filters['status'] );
		}

		// Filter by priority
		if ( ! empty( $filters['priority'] ) ) {
			$query->where( 'priority', $filters['priority'] );
		}

		if ( Permissions::is_deal_owner() ) {
			$query = $query->where( 'owner_id', get_current_user_id() );
		}
		// Filter by owner
		elseif ( ! empty( $filters['owner_id'] ) ) {
			$query->where( 'owner_id', $filters['owner_id'] );
		}

		// Filter by contact
		if ( ! empty( $filters['contact_id'] ) ) {
			$query->where( 'contact_id', $filters['contact_id'] );
		}

		// Filter by value range
		if ( ! empty( $filters['value_min'] ) ) {
			$query->where( 'value', '>=', $filters['value_min'] );
		}
		if ( ! empty( $filters['value_max'] ) ) {
			$query->where( 'value', '<=', $filters['value_max'] );
		}

		// Filter by date range
		if ( ! empty( $filters['date_from'] ) ) {
			$query->whereDate( 'created_at', '>=', $filters['date_from'] );
		}
		if ( ! empty( $filters['date_to'] ) ) {
			$query->whereDate( 'created_at', '<=', $filters['date_to'] );
		}

		// Filter by expected close date
		if ( ! empty( $filters['expected_close_from'] ) ) {
			$query->whereDate( 'expected_close_date', '>=', $filters['expected_close_from'] );
		}
		if ( ! empty( $filters['expected_close_to'] ) ) {
			$query->whereDate( 'expected_close_date', '<=', $filters['expected_close_to'] );
		}

		// Search in title or contact name
		if ( ! empty( $filters['search'] ) ) {
			$search_term = '%' . $filters['search'] . '%';
			$query->where(
				function ( $q ) use ( $search_term ) {
					$q->where( 'title', 'LIKE', $search_term )
						->orWhereHas(
							'contact',
							function ( $contact_query ) use ( $search_term ) {
								$contact_query->where( 'first_name', 'LIKE', $search_term )
									->orWhere( 'last_name', 'LIKE', $search_term )
									->orWhere( 'email', 'LIKE', $search_term );
							}
						);
				}
			);
		}

		// Sort options
		$sort_by    = $filters['sort_by'] ?? 'created_at';
		$sort_order = $filters['sort_order'] ?? 'desc';
		$query->orderBy( $sort_by, $sort_order );

		return $query->paginate( $per_page, array( '*' ), 'page', $page );
	}

	/**
	 * Get overdue deals
	 *
	 * @since 1.0.0
	 *
	 * @param int|null $owner_id Filter by owner
	 *
	 * @return \Illuminate\Database\Eloquent\Collection
	 */
	public function get_overdue_deals( $owner_id = null ) {
		$query = Deal_Model::with( array( 'contact', 'pipeline', 'stage' ) )
			->where( 'status', 'open' )
			->where( 'expected_close_date', '<', current_time( 'Y-m-d' ) )
			->whereNotNull( 'expected_close_date' );

		if ( Permissions::is_deal_owner() ) {
			$owner_id = get_current_user_id();
		}

		if ( $owner_id ) {
			$query->where( 'owner_id', $owner_id );
		}

		return $query->orderBy( 'expected_close_date', 'asc' )->get();
	}

	/**
	 * Get deal statistics for user or overall
	 *
	 * @since 1.0.0
	 *
	 * @param int|null $user_id User ID (null for overall)
	 * @param array    $filters Additional filters
	 *
	 * @return array
	 */
	public function get_deal_statistics( $user_id = null, $filters = array() ) {
		$query = Deal_Model::query();

		if ( Permissions::is_deal_owner() ) {
			$user_id = get_current_user_id();
		}

		if ( $user_id ) {
			$query->where( 'owner_id', $user_id );
		}

		// Apply date filters
		if ( ! empty( $filters['date_from'] ) ) {
			$query->whereDate( 'created_at', '>=', $filters['date_from'] );
		}
		if ( ! empty( $filters['date_to'] ) ) {
			$query->whereDate( 'created_at', '<=', $filters['date_to'] );
		}

		$deals = $query->get();

		$total_deals = $deals->count();
		$won_deals   = $deals->where( 'status', 'won' )->count();
		$lost_deals  = $deals->where( 'status', 'lost' )->count();
		$open_deals  = $deals->where( 'status', 'open' )->count();

		$total_value = $deals->where( 'status', 'open' )->sum( 'value' );
		$won_value   = $deals->where( 'status', 'won' )->sum( 'value' );

		// Calculate weighted value for open deals
		$weighted_value = 0;
		foreach ( $deals->where( 'status', 'open' ) as $deal ) {
			$weighted_value += $deal->weighted_value;
		}

		return array(
			'total_deals'        => $total_deals,
			'won_deals'          => $won_deals,
			'lost_deals'         => $lost_deals,
			'open_deals'         => $open_deals,
			'win_rate'           => $total_deals > 0 ? round( ( $won_deals / $total_deals ) * 100, 2 ) : 0,
			'total_value'        => $total_value,
			'won_value'          => $won_value,
			'weighted_value'     => $weighted_value,
			'average_deal_value' => $total_deals > 0 ? round( $total_value / $total_deals, 2 ) : 0,
			'conversion_rate'    => $total_deals > 0 ? round( ( ( $won_deals + $lost_deals ) / $total_deals ) * 100, 2 ) : 0,
		);
	}

	/**
	 * Bulk update deals
	 *
	 * @since 1.0.0
	 *
	 * @param array    $deal_ids Array of deal IDs
	 * @param array    $data Data to update
	 * @param int|null $user_id User performing the action
	 *
	 * @return int Number of updated deals
	 */
	public function bulk_update_deals( $deal_ids, $data, $user_id = null ) {
		if ( empty( $deal_ids ) || empty( $data ) ) {
			return 0;
		}

		$updated_count = 0;

		foreach ( $deal_ids as $deal_id ) {
			$deal = $this->update_deal( $deal_id, $data );
			if ( $deal ) {
				$updated_count++;
			}
		}

		do_action( 'quillcrm_deals_bulk_updated', $deal_ids, $data, $updated_count );

		return $updated_count;
	}

	/**
	 * Delete deal with cleanup
	 *
	 * @since 1.0.0
	 *
	 * @param int $deal_id Deal ID
	 *
	 * @return bool
	 */
	public function delete_deal( $deal_id ) {
		$deal = Deal_Model::with( 'activities' )->find( $deal_id );

		if ( ! $deal ) {
			return false;
		}

		do_action( 'quillcrm_deal_before_delete', $deal );

		$deleted = $deal->delete();

		if ( $deleted ) {
			do_action( 'quillcrm_deal_deleted', $deal_id );
		}

		return $deleted;
	}

	/**
	 * Update deal status timestamps based on status change
	 *
	 * @since 1.0.0
	 *
	 * @param Deal_Model $deal The deal object
	 * @param string     $new_status The new status
	 * @param string     $old_status The old status
	 *
	 * @return void
	 */
	private function update_status_timestamps( $deal, $new_status, $old_status = null ) {
		// Only update timestamps if status actually changed
		if ( $old_status && $new_status === $old_status ) {
			return;
		}

		if ( $new_status === 'won' ) {
			$deal->won_time  = current_time( 'Y-m-d H:i:s' );
			$deal->lost_time = null;
		} elseif ( $new_status === 'lost' ) {
			$deal->lost_time = current_time( 'Y-m-d H:i:s' );
			$deal->won_time  = null;
		} elseif ( $new_status === 'open' ) {
			$deal->won_time  = null;
			$deal->lost_time = null;
		}
	}


	/**
	 * Get deal priorities
	 *
	 * @since 1.0.0
	 *
	 * @return array
	 */
	public function get_deal_priorities() {
		 return array(
			 'low'    => array(
				 'label' => __( 'Low', 'quillcrm' ),
				 'color' => '#2ecc71',
			 ),
			 'medium' => array(
				 'label' => __( 'Medium', 'quillcrm' ),
				 'color' => '#f1c40f',
			 ),
			 'high'   => array(
				 'label' => __( 'High', 'quillcrm' ),
				 'color' => '#e74c3c',
			 ),
		 );
	}
}
