<?php
/**
 * Class Tasks
 *
 * @since 1.0.0
 * @package DoubleScale\Pro
 */

namespace DoubleScale\Core;

// phpcs:disable WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching -- transactional CRM/scheduler/campaign DB ops; persistent caching is impractical for write-heavy or per-request lookups (matches WooCommerce/FluentCRM precedent).


defined( 'ABSPATH' ) || exit;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

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
	 * @since 1.0.0
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
		// phpcs:ignore WordPress.NamingConventions.PrefixAllGlobals.DynamicHooknameFound -- Hook names are prefixed with the group name.
		do_action( "{$this->group}_$hook", ...$args );
	}


	/**
	 * Schedule recurring task
	 *
	 * @since 1.0.0
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
	 * @since 1.0.0
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
				"SELECT ID FROM {$wpdb->prefix}doublescale_task_meta
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

		if ( as_has_scheduled_action( $full_hook, compact( 'meta_id' ), $this->group ) ) {
			return as_next_scheduled_action( $full_hook, compact( 'meta_id' ), $this->group );
		}

		$wpdb->suppress_errors( true );
		$had_error = false;

		try {
			$result = as_schedule_recurring_action( $timestamp, $interval, $full_hook, compact( 'meta_id' ), $this->group, true );
		} catch ( \Exception $e ) {
			$had_error    = true;
			$error_detail = $e->getMessage();
			$result       = false;
		}

		$db_error = $wpdb->last_error;
		$wpdb->suppress_errors( false );

		if ( ! $had_error && $db_error && stripos( $db_error, 'Deadlock' ) !== false ) {
			$had_error    = true;
			$error_detail = $db_error;
			$result       = false;
		}

		if ( $had_error && function_exists( 'doublescale_get_logger' ) ) {
			doublescale_get_logger()->info(
				'Failed to schedule recurring action (possible deadlock)',
				array(
					'hook'  => $full_hook,
					'group' => $this->group,
					'error' => $error_detail,
				)
			);
		}

		if ( false === $result || 0 === $result ) {
			$existing = as_next_scheduled_action( $full_hook, compact( 'meta_id' ), $this->group );
			return $existing ? $existing : false;
		}

		return $result;
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
	 * Unschedule all instances of a recurring or single action.
	 *
	 * Uses the same hook-naming convention as schedule_recurring() and schedule_single():
	 * the full hook name is "{$this->group}_{$hook}" within the group.
	 *
	 * @since 1.0.0
	 *
	 * @param string $hook Hook name (without group prefix).
	 * @return void
	 */
	public function unschedule_all( $hook ) {
		$full_hook = "{$this->group}_{$hook}";
		if ( function_exists( 'as_unschedule_all_actions' ) ) {
			as_unschedule_all_actions( $full_hook, null, $this->group );
		}
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
			"{$wpdb->prefix}doublescale_task_meta",
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

		return (bool) $wpdb->update( "{$wpdb->prefix}doublescale_task_meta", $data, array( 'ID' => $id ), $data_format, array( '%d' ) );
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
					FROM {$wpdb->prefix}doublescale_task_meta
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
			"{$wpdb->prefix}doublescale_task_meta",
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
		$current_time = gmdate( 'Y-m-d H:i:s' );

		$result = $wpdb->query(
			$wpdb->prepare(
				"UPDATE {$wpdb->prefix}doublescale_task_meta
				SET last_run = %s
				WHERE ID = (
					SELECT ID FROM (
						SELECT ID
						FROM {$wpdb->prefix}doublescale_task_meta
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
			doublescale_get_logger()->info(
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
				FROM {$wpdb->prefix}doublescale_task_meta
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
	 * Removes completed/failed actions older than 7 days from all Plugin groups,
	 * their associated logs, orphaned claims, and orphaned task meta entries.
	 *
	 * @since 1.0.0
	 *
	 * @return array Cleanup statistics
	 */
	public static function cleanup_old_tasks() {
		global $wpdb;

		$stats = array(
			'actions_deleted' => 0,
			'orphaned_meta'   => 0,
			'orphaned_claims' => 0,
		);

		$days_old    = 7;
		$cutoff_date = gmdate( 'Y-m-d H:i:s', strtotime( "-{$days_old} days" ) );

		// Get all Plugin group IDs
		$group_slugs = array(
			'doublescale_campaigns',
			'doublescale_automations',
			'doublescale_daily',
			'doublescale_abandoned_cart',
			'doublescale_forms',
		);

		$placeholders = implode( ', ', array_fill( 0, count( $group_slugs ), '%s' ) );

		// phpcs:disable WordPress.DB.PreparedSQL.InterpolatedNotPrepared, WordPress.DB.PreparedSQLPlaceholders.UnfinishedPrepare -- $placeholders is a dynamically built '%s,%s…' string bound via spread $group_slugs; Action Scheduler table is a trusted core constant.
		$group_ids = $wpdb->get_col(
			$wpdb->prepare(
				"SELECT group_id FROM {$wpdb->prefix}actionscheduler_groups WHERE slug IN ($placeholders)",
				...$group_slugs
			)
		);
		// phpcs:enable WordPress.DB.PreparedSQL.InterpolatedNotPrepared, WordPress.DB.PreparedSQLPlaceholders.UnfinishedPrepare

		if ( ! empty( $group_ids ) ) {
			$group_placeholders = implode( ', ', array_fill( 0, count( $group_ids ), '%d' ) );

			// Delete old completed/failed actions and their associated logs.
			// phpcs:disable WordPress.DB.PreparedSQL.InterpolatedNotPrepared, WordPress.DB.PreparedSQLPlaceholders.UnfinishedPrepare -- $group_placeholders is a dynamically built '%d,%d…' string bound via spread; Action Scheduler tables are trusted core constants.
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
			// phpcs:enable WordPress.DB.PreparedSQL.InterpolatedNotPrepared, WordPress.DB.PreparedSQLPlaceholders.UnfinishedPrepare

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
				FROM {$wpdb->prefix}doublescale_task_meta tm
				LEFT JOIN {$wpdb->prefix}actionscheduler_actions a ON tm.action_id = a.action_id
				WHERE tm.action_id IS NOT NULL
				AND a.action_id IS NULL
				AND tm.date_created < %s",
				$cutoff_date
			)
		);

		$stats['orphaned_meta'] = $orphaned_meta !== false ? $orphaned_meta : 0;

		// Log cleanup results
		if ( function_exists( 'doublescale_get_logger' ) ) {
			doublescale_get_logger()->info(
				__( 'Task cleanup completed', 'doublescale'),
				array(
					'code'  => 'task_cleanup_completed',
					'stats' => $stats,
				)
			);
		}

		return $stats;
	}
}
