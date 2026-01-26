<?php
/**
 * Class Tasks
 *
 * @since 1.0.0
 * @package QuillCRM
 */

namespace QuillCRM;


/**
 * Tasks class
 */
class Tasks {

	/**
	 * Group
	 *
	 * @since 1.0.0
	 *
	 * @var string
	 */
	private $group;

	/**
	 * Initialized
	 *
	 * @var boolean
	 */
	private static $initialized = false;

	/**
	 * Constructor.
	 *
	 * @since 1.0.0
	 *
	 * @param string $group Group.
	 */
	public function __construct( $group ) {
		if ( ! self::$initialized ) {
			self::initialize();
		}

		$this->group = $group;
	}

	/**
	 * Initialize
	 *
	 * @return void
	 */
	private static function initialize() {
		self::$initialized = true;
		add_action(
			'action_scheduler_deleted_action',
			function ( $action_id ) {
				self::delete_meta( array( 'action_id' => $action_id ) );
			}
		);
	}

	/**
	 * Get the next timestamp for a scheduled action
	 *
	 * @since 1.6.0
	 *
	 * @param string     $hook Hook name.
	 * @param array|null $args Args passed to hook.
	 * @return integer|false False if not scheduled
	 */
	public function get_next_timestamp( $hook, $args = null ) {
		return as_next_scheduled_action( "{$this->group}_$hook", $args, $this->group );
	}

	/**
	 * Enqueue async task
	 * Must be called after 'init' action
	 *
	 * @param string $hook Hook name.
	 * @param array  ...$args Args passed to hook.
	 * @return integer|false
	 */
	public function enqueue_async( $hook, ...$args ) {
		// add args meta.
		$meta_id = $this->add_meta( "{$this->group}_$hook", $args );
		if ( ! $meta_id ) {
			return false;
		}

		// add action.
		$action_id = as_enqueue_async_action( "{$this->group}_$hook", compact( 'meta_id' ), $this->group, false, 0 );
		if ( ! $action_id ) {
			return false;
		}

		// assign action to meta.
		$this->update_meta( $meta_id, array( 'action_id' => $action_id ), '%d' );

		return $action_id;
	}

	/**
	 * Enqueu sync task
	 *
	 * @param string $hook Hook name.
	 * @param array  ...$args Args passed to hook.
	 * @return void
	 */
	public function enqueue_sync( $hook, ...$args ) {
		do_action( "{$this->group}_$hook", ...$args );
	}


	/**
	 * Schedule recurring task
	 *
	 * @since 1.6.0
	 *
	 * @param integer $timestamp Timestamp of run.
	 * @param string  $hook Hook name.
	 * @param array   ...$args Args passed to hook.
	 * @return integer|false
	 */
	public function schedule_single( $timestamp, $hook, ...$args ) {
		// $this->enqueue_sync( $hook, ...$args );
		// return;
		// add args meta.
		$meta_id = $this->add_meta( "{$this->group}_$hook", $args );
		if ( ! $meta_id ) {
			return false;
		}

		// add action.
		$action_id = as_schedule_single_action( $timestamp, "{$this->group}_$hook", compact( 'meta_id' ), $this->group, false, 0 );
		if ( ! $action_id ) {
			return false;
		}

		// assign action to meta.
		$this->update_meta( $meta_id, array( 'action_id' => $action_id ), '%d' );

		return $action_id;
	}

	/**
	 * Schedule recurring task
	 *
	 * @since 1.6.0
	 *
	 * @param integer $timestamp Timestamp of first run.
	 * @param integer $interval Interval in seconds.
	 * @param string  $hook Hook name.
	 * @param array   ...$args Args passed to hook.
	 * @return integer|false
	 */
	public function schedule_recurring( $timestamp, $interval, $hook, ...$args ) {
		global $wpdb;
		$full_hook = "{$this->group}_$hook";

		// Check if meta already exists for this recurring task.
		$existing_meta_id = $wpdb->get_var(
			$wpdb->prepare(
				"SELECT ID FROM {$wpdb->prefix}quillcrm_task_meta
				WHERE hook = %s
				AND group_slug = %s
				ORDER BY ID DESC
				LIMIT 1",
				$full_hook,
				$this->group
			)
		);

		if ( $existing_meta_id ) {
			// Reuse existing meta for recurring tasks.
			$meta_id = $existing_meta_id;

			// Update the args in case they changed.
			$this->update_meta( $meta_id, array( 'value' => maybe_serialize( $args ) ), '%s' );
		} else {
			// Create new meta only if none exists (first-time scheduling).
			$meta_id = $this->add_meta( $full_hook, $args );
			if ( ! $meta_id ) {
				return false;
			}
		}

		// the action id isn't single, so we won't assign it to the meta.
		return as_schedule_recurring_action( $timestamp, $interval, $full_hook, compact( 'meta_id' ), $this->group, true );
	}

	/**
	 * Register callback
	 *
	 * @param string   $hook Hook name.
	 * @param callable $callback The callback to be run when the action is called.
	 * @return void
	 */
	public function register_callback( $hook, $callback ) {
		add_action( "{$this->group}_$hook", $callback, 10, 999 );
	}

	/**
	 * Add meta
	 *
	 * @param string $hook Hook.
	 * @param mixed  $value Value.
	 * @return integer|false
	 */
	private function add_meta( $hook, $value ) {
		global $wpdb;

		$insert = $wpdb->insert(
			"{$wpdb->prefix}quillcrm_task_meta",
			array(
				'hook'         => $hook,
				'group_slug'   => $this->group,
				'value'        => maybe_serialize( $value ),
				'date_created' => gmdate( 'Y-m-d H:i:s' ),
			)
		);

		if ( ! $insert ) {
			return false;
		}

		return $wpdb->insert_id;
	}

	/**
	 * Update meta
	 *
	 * @param integer      $id Meta id.
	 * @param array        $data Data to be updated.
	 * @param string|array $data_format Data format.
	 * @return boolean
	 */
	private function update_meta( $id, $data, $data_format = '%s' ) {
		global $wpdb;

		return (bool) $wpdb->update( "{$wpdb->prefix}quillcrm_task_meta", $data, array( 'ID' => $id ), $data_format, array( '%d' ) );
	}

	/**
	 * Get meta
	 *
	 * @param integer $id Meta id.
	 * @return array
	 */
	private function get_meta( $id ) {
		global $wpdb;

		$meta = $wpdb->get_row(
			$wpdb->prepare(
				"
					SELECT *
					FROM {$wpdb->prefix}quillcrm_task_meta
					WHERE ID = %d
				",
				$id
			),
			ARRAY_A
		);

		if ( ! empty( $meta['value'] ) ) {
			$meta['value'] = maybe_unserialize( $meta['value'] );
		}

		return $meta;
	}

	/**
	 * Delete meta
	 *
	 * @param array $where Where.
	 * @return boolean
	 */
	private static function delete_meta( $where ) {
		global $wpdb;

		return (bool) $wpdb->delete(
			"{$wpdb->prefix}quillcrm_task_meta",
			$where
		);
	}

	/**
	 * Update heartbeat timestamp after task execution
	 *
	 * This method records when a task last ran successfully,
	 * enabling health monitoring and overdue detection.
	 *
	 * Uses standard SQL with subquery for database portability.
	 *
	 * @since 1.0.0
	 *
	 * @param string $hook Hook name (without group prefix).
	 * @return bool Success.
	 */
	public function update_heartbeat( $hook ) {
		global $wpdb;

		$full_hook    = "{$this->group}_$hook";
		$current_time = current_time( 'mysql' );

		$result = $wpdb->query(
			$wpdb->prepare(
				"UPDATE {$wpdb->prefix}quillcrm_task_meta
				SET last_run = %s
				WHERE ID = (
					SELECT ID FROM (
						SELECT ID
						FROM {$wpdb->prefix}quillcrm_task_meta
						WHERE hook = %s
						AND group_slug = %s
						ORDER BY ID DESC
						LIMIT 1
					) AS tmp
				)",
				$current_time,
				$full_hook,
				$this->group
			)
		);

		// Log failure for debugging.
		if ( false === $result ) {
			quillcrm_get_logger()->warning(
				'Failed to update heartbeat timestamp',
				array(
					'hook'  => $full_hook,
					'group' => $this->group,
					'error' => $wpdb->last_error,
				)
			);
		}

		return (bool) $result;
	}

	/**
	 * Get heartbeat status for a hook
	 *
	 * Returns last run time for monitoring task health.
	 *
	 * @since 1.0.0
	 *
	 * @param string $hook Hook name (without group prefix).
	 * @return array|null Heartbeat data with last_run.
	 */
	public function get_heartbeat_status( $hook ) {
		global $wpdb;

		$full_hook = "{$this->group}_$hook";

		return $wpdb->get_row(
			$wpdb->prepare(
				"SELECT last_run
				FROM {$wpdb->prefix}quillcrm_task_meta
				WHERE hook = %s
				AND group_slug = %s
				ORDER BY ID DESC
				LIMIT 1",
				$full_hook,
				$this->group
			),
			ARRAY_A
		);
	}

	/**
	 * Clean up old Action Scheduler entries and orphaned task meta
	 *
	 * Removes completed/failed actions older than 7 days from all QuillCRM groups,
	 * their associated logs, orphaned claims, and orphaned task meta entries.
	 *
	 * @since 1.0.0
	 *
	 * @return array Cleanup statistics
	 */
	public static function cleanup_old_tasks() {
		global $wpdb;

		$stats = array(
			'actions_deleted'   => 0,
			'orphaned_meta'     => 0,
			'orphaned_claims'   => 0,
		);

		$days_old    = 7;
		$cutoff_date = gmdate( 'Y-m-d H:i:s', strtotime( "-{$days_old} days" ) );

		// Get all QuillCRM group IDs
		$group_slugs = array(
			'quillcrm_campaigns',
			'quillcrm_automations',
			'quillcrm_daily',
			'quillcrm_abandoned_cart',
			'quillcrm_forms',
		);

		$placeholders = implode( ', ', array_fill( 0, count( $group_slugs ), '%s' ) );

		// phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared
		$group_ids = $wpdb->get_col(
			$wpdb->prepare(
				"SELECT group_id FROM {$wpdb->prefix}actionscheduler_groups WHERE slug IN ($placeholders)",
				...$group_slugs
			)
		);

		if ( ! empty( $group_ids ) ) {
			$group_placeholders = implode( ', ', array_fill( 0, count( $group_ids ), '%d' ) );

			// Delete old completed/failed actions and their associated logs
			// phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared
			$deleted = $wpdb->query(
				$wpdb->prepare(
					"DELETE a, l
					FROM {$wpdb->prefix}actionscheduler_actions a
					LEFT JOIN {$wpdb->prefix}actionscheduler_logs l ON a.action_id = l.action_id
					WHERE a.group_id IN ($group_placeholders)
					AND a.status IN ('complete', 'failed')
					AND a.scheduled_date_gmt < %s",
					...array_merge( $group_ids, array( $cutoff_date ) )
				)
			);

			$stats['actions_deleted'] = $deleted !== false ? $deleted : 0;
		}

		// Clean up orphaned claims
		$orphaned_claims = $wpdb->query(
			"DELETE c
			FROM {$wpdb->prefix}actionscheduler_claims c
			LEFT JOIN {$wpdb->prefix}actionscheduler_actions a ON c.claim_id = a.claim_id
			WHERE a.action_id IS NULL"
		);

		$stats['orphaned_claims'] = $orphaned_claims !== false ? $orphaned_claims : 0;

		// Clean up orphaned task meta (meta entries without corresponding action)
		// Only clean meta that has an action_id (async tasks), not recurring task meta
		$orphaned_meta = $wpdb->query(
			$wpdb->prepare(
				"DELETE tm
				FROM {$wpdb->prefix}quillcrm_task_meta tm
				LEFT JOIN {$wpdb->prefix}actionscheduler_actions a ON tm.action_id = a.action_id
				WHERE tm.action_id IS NOT NULL
				AND a.action_id IS NULL
				AND tm.date_created < %s",
				$cutoff_date
			)
		);

		$stats['orphaned_meta'] = $orphaned_meta !== false ? $orphaned_meta : 0;

		// Log cleanup results
		if ( function_exists( 'quillcrm_get_logger' ) ) {
			quillcrm_get_logger()->info(
				__( 'Task cleanup completed', 'quillcrm' ),
				array(
					'code'  => 'task_cleanup_completed',
					'stats' => $stats,
				)
			);
		}

		return $stats;
	}
}
