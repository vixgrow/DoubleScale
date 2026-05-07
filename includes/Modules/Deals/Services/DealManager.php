<?php

/**
 * Class DealManager
 * This class is responsible for handling deal management
 *
 * @since 1.0.0
 *
 * @package DoubleScale\Pro
 */

namespace DoubleScale\Modules\Deals\Services;

use Exception;
use DoubleScale\Modules\Deals\Models\DealModel;
use DoubleScale\Modules\Activities\Models\ActivityModel;
use DoubleScale\Constants\ActivityTypes;
use DoubleScale\Modules\Contacts\Models\ContactModel;
use DoubleScale\Modules\Deals\Models\PipelineModel;
use DoubleScale\Modules\Deals\Models\PipelineStageModel;
use DoubleScale\UserRoles\Permissions;
use DoubleScale\Core\UserRoles\PermissionsCompat;

/**
 * DealManager class
 */
final class DealManager
{

	/**
	 * @deprecated Retained for backward compatibility; prefer container resolution.
	 * @var DealManager|null
	 */
	private static $instance;

	/**
	 * Get the singleton instance.
	 *
	 * The DI container is registered to call this method; the singleton must
	 * not re-enter the container with the same FQCN (that would recurse until
	 * the process runs out of memory).
	 *
	 * @since 1.0.0
	 *
	 * @return DealManager
	 */
	public static function instance()
	{
		if (is_null(self::$instance)) {
			self::$instance = new self();
		}

		return self::$instance;
	}

	/**
	 * Constructor
	 *
	 * @since 1.0.0
	 */
	private function __construct()
	{
		add_action('doublescale_loaded', array($this, 'init'));
	}

	/**
	 * Initialize
	 *
	 * @since 1.0.0
	 *
	 * @return void
	 */
	public function init()
	{
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
	public function create_deal($data)
	{
		try {
			// Validate required fields
			if (empty($data['title']) || empty($data['contact_id']) || empty($data['pipeline_id']) || empty($data['stage_id'])) {
				throw new Exception('Missing required deal data');
			}

			// Validate contact exists
			$contact = ContactModel::find($data['contact_id']);
			if (! $contact) {
				throw new Exception('Contact not found');
			}

			// Validate pipeline and stage
			$stage = PipelineStageModel::where('id', $data['stage_id'])
				->where('pipeline_id', $data['pipeline_id'])
				->first();

			if (! $stage) {
				throw new Exception('Invalid pipeline or stage');
			}

			// Set defaults
			$current_user_id = get_current_user_id();
			$deal_data       = array_merge(
				array(
					'value'       => 0.00,
					// Note: 'currency' removed - now uses global currency from settings
					'status'      => DealModel::get_status_from_probability($stage->win_probability),
					'owner_id'    => $current_user_id > 0 ? $current_user_id : null,
					'probability' => $stage->win_probability,
				),
				$data
			);

			$deal = DealModel::create($deal_data);

			do_action('doublescale_deal_created_by_manager', $deal);

			return $deal;
		} catch (Exception $e) {
			error_log('DoubleScale Deal Manager Error: ' . $e->getMessage());
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
	public function update_deal($deal_id, $data)
	{
		$deal = DealModel::find($deal_id);

		if (! $deal) {
			return null;
		}

		// Sales Rep can only update their own deals and cannot change core fields
		// Sales Manager, CRM Manager, and Administrator can update any deal
		if (Permissions::is_sales_rep() && ! PermissionsCompat::has_sales_manager_access()) {
			if ($deal->owner_id != get_current_user_id()) {
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
		if (isset($data['stage_id']) && $data['stage_id'] != $deal->stage_id) {
			// Use provided pipeline_id or fall back to deal's current pipeline
			$pipeline_id = isset($data['pipeline_id']) ? $data['pipeline_id'] : $deal->pipeline_id;

			$stage = PipelineStageModel::where('id', $data['stage_id'])
				->where('pipeline_id', $pipeline_id)
				->first();

			if (! $stage) {
				throw new Exception('Invalid pipeline or stage');
			}

			$data['probability'] = $stage->win_probability;
			$data['status']      = DealModel::get_status_from_probability($stage->win_probability);
		}
		$old_status = $deal->status;
		$new_status = $data['status'];

		// Update status timestamps using helper method
		$this->update_status_timestamps($deal, $new_status, $old_status);

		$deal->fill($data);
		$deal->save();

		do_action('doublescale_deal_updated_by_manager', $deal);
		do_action('doublescale_automation_deal_owner_changed', $deal->contact, $deal, $old_owner_id, $new_owner_id);
		do_action('doublescale_automation_deal_value_changed', $deal->contact, $deal, $old_value, $new_value);

		if (isset($data['status'])) {
			do_action('doublescale_automation_deal_status_changed', $deal->contact, $deal, $old_status, $new_status);
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
	public function move_deal_to_stage($deal_id, $stage_id, $user_id = null, $update_probability = false)
	{
		$deal                  = DealModel::find($deal_id);
		$stage                 = PipelineStageModel::find($stage_id);
		$pipeline_id_for_stage = $stage->pipeline_id;
		if (! $deal) {
			return false;
		}

		// Sales Rep can only move their own deals within the same pipeline
		// Sales Manager, CRM Manager, and Administrator can move any deal
		if (Permissions::is_sales_rep() && ! PermissionsCompat::has_sales_manager_access()) {
			if ($deal->owner_id != $user_id && $deal->pipeline_id != $pipeline_id_for_stage) {
				return false;
			}
		}

		$old_stage_id = $deal->stage_id;
		$new_stage_id = $stage_id;
		$move         = $deal->moveToStage($stage_id, $user_id, true);
		$old_status   = $deal->status;
		$new_status   = $deal->get_status_from_probability($stage->win_probability);

		// update status
		$deal->status = $new_status;
		$this->update_status_timestamps($deal, $new_status, $old_status);
		$deal->save();

		if ($move) {
			do_action('doublescale_automation_deal_stage_changed', $deal->contact, $deal, $old_stage_id, $new_stage_id);
			do_action('doublescale_automation_deal_status_changed', $deal->contact, $deal, $old_status, $new_status);
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
	public function move_deal_to_pipeline($deal_id, $pipeline_id, $stage_id = null, $user_id = null)
	{

		$deal            = DealModel::find($deal_id);
		$target_pipeline = PipelineModel::with('stages')->find($pipeline_id);

		if (! $deal || ! $target_pipeline) {
			return false;
		}

		// If no stage specified, use first stage of target pipeline
		if (! $stage_id) {
			$first_stage = $target_pipeline->stages->sortBy('sort_order')->first();
			if (! $first_stage) {
				return false;
			}
			$stage_id = $first_stage->id;
		}

		$old_pipeline_id = $deal->pipeline_id;
		$old_stage_id    = $deal->stage_id;

		$stage = PipelineStageModel::find($stage_id);
		if (! $stage) {
			return false;
		}

		$deal->pipeline_id = $pipeline_id;
		$deal->stage_id    = $stage_id;
		$old_status        = $deal->status;
		$new_status        = $deal->get_status_from_probability($stage->win_probability);
		$deal->status      = $new_status;
		$this->update_status_timestamps($deal, $new_status, $old_status);
		$saved = $deal->save();

		if ($saved) {
			// Log the pipeline change activity
			$activity = ActivityModel::create(
				array(
					'contact_id'    => $deal->contact_id,
					'deal_id'       => $deal->id,
					'activity_type' => ActivityTypes::STAGE_CHANGED,
					'data'          => array(
						'old_pipeline_id' => $old_pipeline_id,
						'new_pipeline_id' => $pipeline_id,
						'old_stage_id'    => $old_stage_id,
						'new_stage_id'    => $stage_id,
					),
					'user_id'       => $user_id ?: get_current_user_id(),
				)
			);

			// Create activity association with this deal
			if ($activity && class_exists('\DoubleScale\Modules\Activities\Models\ActivityAssociationModel')) {
				\DoubleScale\Modules\Activities\Models\ActivityAssociationModel::create(
					array(
						'activity_id' => $activity->id,
						'entity_type' => \DoubleScale\Modules\Activities\Models\ActivityAssociationModel::ENTITY_TYPE_DEAL,
						'entity_id'   => $deal->id,
					)
				);
			}

			do_action('doublescale_deal_pipeline_changed', $deal, $old_pipeline_id, $pipeline_id);
			do_action('doublescale_automation_deal_status_changed', $deal->contact, $deal, $old_status, $new_status);
		}

		return $saved;
	}


	/**
	 * Get deals with filters
	 *
	 * @since 1.0.0
	 *
	 * @param array $filters Filter criteria
	 *
	 * @return \Illuminate\Database\Eloquent\Collection
	 */
	public function get_deals_with_filters($filters = array())
	{
		// Validate and swap value range if min > max
		if ( isset( $filters['value_min'] ) && isset( $filters['value_max'] ) ) {
			if ( $filters['value_min'] > $filters['value_max'] ) {
				$temp                  = $filters['value_min'];
				$filters['value_min']  = $filters['value_max'];
				$filters['value_max']  = $temp;
			}
		}

		$query = DealModel::with(array('contact', 'pipeline', 'stage', 'owner'));

		// Filter by pipeline
		if (! empty($filters['pipeline_id'])) {
			$query->where('pipeline_id', $filters['pipeline_id']);
		}

		// Filter by stage
		if (! empty($filters['stage_id'])) {
			$query->where('stage_id', $filters['stage_id']);
		}

		// Filter by status (skip if 'all' is selected)
		if (! empty($filters['status']) && $filters['status'] !== 'all') {
			$query->where('status', $filters['status']);
		}

		// Filter by priority
		if (! empty($filters['priority'])) {
			$query->where('priority', $filters['priority']);
		}

		// Sales Rep can only see their own deals
		// Sales Manager, CRM Manager, and Administrator can see all deals
		if (Permissions::is_sales_rep() && ! PermissionsCompat::has_sales_manager_access()) {
			$query = $query->where('owner_id', get_current_user_id());
		}
		// Filter by owner (for users with broader access)
		elseif (! empty($filters['owner_id'])) {
			$query->where('owner_id', $filters['owner_id']);
		}

		// Filter by contact
		if (! empty($filters['contact_id'])) {
			$query->where('contact_id', $filters['contact_id']);
		}

		// Filter by value range
		if (isset($filters['value_min']) && $filters['value_min'] !== '' && $filters['value_min'] !== null) {
			$query->where('value', '>=', $filters['value_min']);
		}
		if (isset($filters['value_max']) && $filters['value_max'] !== '' && $filters['value_max'] !== null) {
			$query->where('value', '<=', $filters['value_max']);
		}

		// Filter by date range
		if (! empty($filters['date_from'])) {
			$query->whereDate('created_at', '>=', $filters['date_from']);
		}
		if (! empty($filters['date_to'])) {
			$query->whereDate('created_at', '<=', $filters['date_to']);
		}

		// Filter by expected close date
		if (! empty($filters['expected_close_from'])) {
			$query->whereDate('expected_close_date', '>=', $filters['expected_close_from']);
		}
		if (! empty($filters['expected_close_to'])) {
			$query->whereDate('expected_close_date', '<=', $filters['expected_close_to']);
		}

		// Search in title or contact name
		if (! empty($filters['search'])) {
			$search_term = '%' . $filters['search'] . '%';
			$query->where(
				function ($q) use ($search_term) {
					$q->where('title', 'LIKE', $search_term)
						->orWhereHas(
							'contact',
							function ($contact_query) use ($search_term) {
								$contact_query->where('first_name', 'LIKE', $search_term)
									->orWhere('last_name', 'LIKE', $search_term)
									->orWhere('email', 'LIKE', $search_term);
							}
						);
				}
			);
		}

		// Sort options with validation to prevent SQL injection
		$allowed_sort_columns = array( 'created_at', 'updated_at', 'value', 'title', 'expected_close_date', 'priority', 'status' );
		$sort_by              = in_array( $filters['sort_by'] ?? '', $allowed_sort_columns, true )
			? $filters['sort_by']
			: 'created_at';

		$sort_order = in_array( strtolower( $filters['sort_order'] ?? '' ), array( 'asc', 'desc' ), true )
			? strtolower( $filters['sort_order'] )
			: 'desc';

		$query->orderBy($sort_by, $sort_order);

		return $query->get();
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
	public function get_overdue_deals($owner_id = null)
	{
		$query = DealModel::with(array('contact', 'pipeline', 'stage'))
			->where('status', 'open')
			->where('expected_close_date', '<', current_time('Y-m-d'))
			->whereNotNull('expected_close_date');

		// Sales Rep can only see their own overdue deals
		// Sales Manager, CRM Manager, and Administrator can see all overdue deals
		if (Permissions::is_sales_rep() && ! PermissionsCompat::has_sales_manager_access()) {
			$owner_id = get_current_user_id();
		}

		if ($owner_id) {
			$query->where('owner_id', $owner_id);
		}

		return $query->orderBy('expected_close_date', 'asc')->get();
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
	public function get_deal_statistics($user_id = null, $filters = array())
	{
		$query = DealModel::query();

		// Sales Rep can only see their own statistics
		// Sales Manager, CRM Manager, and Administrator can see all statistics
		if (Permissions::is_sales_rep() && ! PermissionsCompat::has_sales_manager_access()) {
			$user_id = get_current_user_id();
		}

		if ($user_id) {
			$query->where('owner_id', $user_id);
		}

		// Apply date filters
		if (! empty($filters['date_from'])) {
			$query->whereDate('created_at', '>=', $filters['date_from']);
		}
		if (! empty($filters['date_to'])) {
			$query->whereDate('created_at', '<=', $filters['date_to']);
		}

		$deals = $query->get();

		$total_deals = $deals->count();
		$won_deals   = $deals->where('status', 'won')->count();
		$lost_deals  = $deals->where('status', 'lost')->count();
		$open_deals  = $deals->where('status', 'open')->count();

		$total_value = $deals->where('status', 'open')->sum('value');
		$won_value   = $deals->where('status', 'won')->sum('value');

		// Calculate weighted value for open deals
		$weighted_value = 0;
		foreach ($deals->where('status', 'open') as $deal) {
			$weighted_value += $deal->weighted_value;
		}

		return array(
			'total_deals'        => $total_deals,
			'won_deals'          => $won_deals,
			'lost_deals'         => $lost_deals,
			'open_deals'         => $open_deals,
			'win_rate'           => $total_deals > 0 ? round(($won_deals / $total_deals) * 100, 2) : 0,
			'total_value'        => $total_value,
			'won_value'          => $won_value,
			'weighted_value'     => $weighted_value,
			'average_deal_value' => $total_deals > 0 ? round($total_value / $total_deals, 2) : 0,
			'conversion_rate'    => $total_deals > 0 ? round((($won_deals + $lost_deals) / $total_deals) * 100, 2) : 0,
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
	public function bulk_update_deals($deal_ids, $data, $user_id = null)
	{
		if (empty($deal_ids) || empty($data)) {
			return 0;
		}

		$updated_count = 0;

		foreach ($deal_ids as $deal_id) {
			$deal = $this->update_deal($deal_id, $data);
			if ($deal) {
				$updated_count++;
			}
		}

		do_action('doublescale_deals_bulk_updated', $deal_ids, $data, $updated_count);

		return $updated_count;
	}

	/**
	 * Bulk delete deals
	 *
	 * @since 1.0.0
	 *
	 * @param array $deal_ids Array of deal IDs to delete
	 *
	 * @return int Number of deals successfully deleted
	 */
	public function bulk_delete_deals($deal_ids)
	{
		if (empty($deal_ids) || ! is_array($deal_ids)) {
			return 0;
		}

		$deleted_count = 0;

		foreach ($deal_ids as $deal_id) {
			$deleted = $this->delete_deal($deal_id);
			if ($deleted) {
				$deleted_count++;
			}
		}

		do_action('doublescale_deals_bulk_deleted', $deal_ids, $deleted_count);

		return $deleted_count;
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
	public function delete_deal($deal_id)
	{
		$deal = DealModel::with('activities')->find($deal_id);

		if (! $deal) {
			return false;
		}

		do_action('doublescale_deal_before_delete', $deal);

		$deleted = $deal->delete();

		if ($deleted) {
			do_action('doublescale_deal_deleted', $deal_id);
		}

		return $deleted;
	}

	/**
	 * Update deal status timestamps based on status change
	 *
	 * @since 1.0.0
	 *
	 * @param DealModel $deal The deal object
	 * @param string     $new_status The new status
	 * @param string     $old_status The old status
	 *
	 * @return void
	 */
	private function update_status_timestamps($deal, $new_status, $old_status = null)
	{
		// Only update timestamps if status actually changed
		if ($old_status && $new_status === $old_status) {
			return;
		}

		if ($new_status === 'won') {
			$deal->won_time  = current_time('Y-m-d H:i:s');
			$deal->lost_time = null;
		} elseif ($new_status === 'lost') {
			$deal->lost_time = current_time('Y-m-d H:i:s');
			$deal->won_time  = null;
		} elseif ($new_status === 'open') {
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
	public function get_deal_priorities()
	{
		return array(
			'low'    => array(
				'label' => __('Low', 'doublescale'),
				'color' => '#2ecc71',
			),
			'medium' => array(
				'label' => __('Medium', 'doublescale'),
				'color' => '#f1c40f',
			),
			'high'   => array(
				'label' => __('High', 'doublescale'),
				'color' => '#e74c3c',
			),
		);
	}
}
