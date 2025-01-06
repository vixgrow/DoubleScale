<?php
/**
 * Class Log_Handler_DB file.
 *
 * @package QuillCRM
 * @subpackage Log_Handlers
 *
 * @since 1.0.0
 */

namespace QuillCRM\Log_Handlers;

use Automattic\Jetpack\Constants;
use QuillCRM\Abstracts\Log_Handler;
use QuillCRM\Abstracts\Log_Levels;
use QuillCRM\Models\Log_Model;

/**
 * Handles log entries by writing to database.
 *
 * @class          Log_Handler_DB
 *
 * @since        1.0.0
 */
class Log_Handler_DB extends Log_Handler {

	/**
	 * Handle a log entry.
	 *
	 * @since 1.0.0
	 *
	 * @param int    $timestamp Log timestamp.
	 * @param string $level emergency|alert|critical|error|warning|notice|info|debug.
	 * @param string $message Log message.
	 * @param array  $context {
	 *      Additional information for log handlers.
	 *
	 *     @type string $source Optional. Source will be available in log table.
	 *                  If no source is provided, attempt to provide sensible default.
	 * }
	 *
	 * @see Log_Handler_DB::get_log_source() for default source.
	 *
	 * @return bool False if value was not handled and true if value was handled.
	 */
	public function handle( $timestamp, $level, $message, $context ) {
		// source.
		if ( ! empty( $context['source'] ) ) {
			$source = $context['source'];
			unset( $context['source'] );
		} else {
			$source = $this->get_log_source();
		}

		// versions.
		$context['versions'] = array();
		// add main plugin version.
		$context['versions']['QuillCRM'] = QUILLCRM_VERSION;
		// add pro plugin version.
		$main_namespace = explode( '\\', $source )[0];
		if ( 'QuillCRM_PRO' === $main_namespace ) {
			$context['versions'][ $main_namespace ] = QUILLCRM_PRO_VERSION;
		}

		return $this->add( $timestamp, $level, $message, $source, $context );
	}

	/**
	 * Add a log entry to chosen file.
	 *
	 * @since 1.0.0
	 *
	 * @param int    $timestamp Log timestamp.
	 * @param string $level emergency|alert|critical|error|warning|notice|info|debug.
	 * @param string $message Log message.
	 * @param string $source Log source. Useful for filtering and sorting.
	 * @param array  $context Context will be serialized and stored in database.
	 *
	 * @return bool True if write was successful.
	 */
	protected static function add( $timestamp, $level, $message, $source, $context ) {
		$insert = array(
			'timestamp' => gmdate( 'Y-m-d H:i:s', $timestamp ),
			'level'     => Log_Levels::get_level_severity( $level ),
			'message'   => $message,
			'source'    => $source,
			'context'   => $context,
		);

		return Log_Model::create( $insert );
	}

	/**
	 * Get all logs
	 *
	 * @since 1.6.0
	 *
	 * @param array|false $levels Array of levels, false for all.
	 * @param integer     $offset Offset.
	 * @param integer     $count Count.
	 * @return array
	 */
	public static function get_all( $levels = false, $offset = 0, $count = 10000000 ) {
		// Initialize query builder
		$query = Log_Model::query();

		// If specific levels are passed, filter by those levels
		if ( ! empty( $levels ) ) {
			$levels = array_filter(
				array_map(
					function( $level ) {
						return Log_Levels::get_level_severity( $level );
					},
					$levels
				)
			);
			$query->whereIn( 'level', $levels );
		}

		// Apply offset and count (pagination)
		$query->skip( $offset )->take( $count );

		// Execute query and get results
		$logs = $query->orderBy( 'id', 'desc' )->get();

		// Prepare and format results for output
		return $logs->map(
			function ( $log ) {
				// level label
				$level = Log_Levels::get_severity_level( (int) $log->level );

				// source plugin
				$plugin         = '';
				$main_namespace = explode( '\\', $log->source )[0];
				if ( 'QuillCRM' === $main_namespace ) {
					  $plugin = esc_html__( 'Core', 'quillcrm' );
				} else {
					$plugin = esc_html__( 'Pro', 'quillcrm' );
				}

				// prepare context
				$context = maybe_unserialize( $log->context );

				// local datetime
				$local_datetime = get_date_from_gmt( $log->timestamp );

				return array(
					'id'             => $log->id,
					'plugin'         => $plugin,
					'level'          => $level,
					'message'        => $log->message,
					'source'         => $log->source,
					'context'        => $context,
					'datetime'       => $log->timestamp,
					'local_datetime' => $local_datetime,
				);
			}
		);
	}

	/**
	 * Get logs count
	 *
	 * @param array|false $levels Levels.
	 * @return int
	 */
	public static function get_count( $levels = false ) {
		// Initialize query builder
		$query = Log_Model::query();

		// If specific levels are passed, filter by those levels
		if ( ! empty( $levels ) ) {
			$levels = array_filter(
				array_map(
					function( $level ) {
						return Log_Levels::get_level_severity( $level );
					},
					$levels
				)
			);
			$query->whereIn( 'level', $levels );
		}

		// Get the count of logs
		return $query->count();
	}

	/**
	 * Clear all logs from the DB using Eloquent ORM.
	 *
	 * @since 1.0.0
	 *
	 * @return bool True if flush was successful.
	 */
	public static function flush() {
		return Log_Model::truncate(); // Truncate the logs table
	}

	/**
	 * Clear entries for a chosen handle/source using Eloquent ORM.
	 *
	 * @since 1.0.0
	 *
	 * @param string $source Log source.
	 * @return bool
	 */
	public function clear( $source ) {
		return Log_Model::where( 'source', $source )->delete(); // Delete logs by source
	}

	/**
	 * Delete selected logs from DB using Eloquent ORM.
	 *
	 * @since 1.0.0
	 *
	 * @param int|string|array $ids Log ID or array of Log IDs to be deleted.
	 * @return bool
	 */
	public static function delete( $ids ) {
		// Ensure $ids is an array
		if ( ! is_array( $ids ) ) {
			$ids = array( $ids );
		}

		return Log_Model::whereIn( 'id', $ids )->delete(); // Delete logs by ID
	}

	/**
	 * Delete all logs older than a defined timestamp using Eloquent ORM.
	 *
	 * @since 1.0.0
	 *
	 * @param integer $timestamp Timestamp to delete logs before.
	 */
	public static function delete_logs_before_timestamp( $timestamp = 0 ) {
		if ( ! $timestamp ) {
			return;
		}

		// Convert timestamp to datetime and delete logs older than that timestamp
		Log_Model::where( 'timestamp', '<', gmdate( 'Y-m-d H:i:s', $timestamp ) )->delete();
	}

	/**
	 * Get appropriate source based on file name.
	 *
	 * Try to provide an appropriate source in case none is provided.
	 *
	 * @since 1.0.0
	 *
	 * @return string Text to use as log source. "" (empty string) if none is found.
	 */
	protected static function get_log_source() {
		static $ignore_classes = array( 'QuillCRM\Log_Handlers\Log_Handler_DB', 'QuillCRM\Logger' );

		/**
		 * PHP < 5.3.6 correct behavior
		 *
		 * @see http://php.net/manual/en/function.debug-backtrace.php#refsect1-function.debug-backtrace-parameters
		 */
		if ( Constants::is_defined( 'DEBUG_BACKTRACE_IGNORE_ARGS' ) ) {
			$debug_backtrace_arg = DEBUG_BACKTRACE_IGNORE_ARGS; // phpcs:ignore PHPCompatibility.Constants.NewConstants.debug_backtrace_ignore_argsFound
		} else {
			$debug_backtrace_arg = false;
		}

		$trace = debug_backtrace( $debug_backtrace_arg ); // @codingStandardsIgnoreLine.
		foreach ( $trace as $t ) {
			if ( isset( $t['class'] ) ) {
				if ( in_array( $t['class'], $ignore_classes, true ) ) {
					continue;
				}
				return $t['class'] . $t['type'] . $t['function'];
			}
			if ( isset( $t['file'] ) ) {
				return static::clean_filename( $t['file'] );
			}
		}

		return '';
	}

	/**
	 * Clean filename
	 *
	 * @param string $filename Full path of file.
	 * @return string
	 */
	protected static function clean_filename( $filename ) {
		if ( substr( $filename, 0, strlen( ABSPATH ) ) === ABSPATH ) {
			$filename = substr( $filename, strlen( ABSPATH ) );
		}
		return $filename;
	}

}
