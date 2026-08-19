<?php
/**
 * Shared helpers for bulk write abilities.
 *
 * @package DoubleScale\Core
 */

namespace DoubleScale\Core\Abilities;

defined( 'ABSPATH' ) || exit;

use WP_Error;

/**
 * Batch validation, per-row processing, and the write envelope.
 *
 * Partial success is the atomicity model: valid rows save, failed rows come
 * back in `errors`. There is no transaction. Hooks cannot be deferred without
 * rewriting shared model code, and rolling back after a notify has already
 * emailed someone is worse than leaving the saved rows in place.
 *
 * Schema `maxItems` is a hint, same doctrine as {@see AbilityResult::limit()}.
 * Over-cap batches are rejected outright — never truncated — because dropping
 * a write silently would leave the agent believing records it never saved.
 */
final class AbilityBulk {

	/**
	 * Default batch size, mirroring {@see AbilityResult::MAX_LIMIT}.
	 */
	public const DEFAULT_MAX_ITEMS = 100;

	/**
	 * Filter ceiling. Matches FluentCRM's bulk-upsert cap.
	 */
	public const HARD_MAX_ITEMS = 500;

	/**
	 * The effective max for one ability, after the filter and the hard clamp.
	 *
	 * @since 1.0.0
	 *
	 * @param string $ability_name Full ability name.
	 * @return int In the closed range [1, HARD_MAX_ITEMS].
	 */
	public static function max_items( string $ability_name ): int {
		/**
		 * Filter the per-ability bulk write cap.
		 *
		 * The return is clamped into [1, HARD_MAX_ITEMS]. Returning a number
		 * above the hard ceiling does not raise it.
		 *
		 * @since 1.0.0
		 *
		 * @param int    $max          Proposed cap.
		 * @param string $ability_name Full ability name.
		 */
		$filtered = (int) apply_filters( 'doublescale_ability_bulk_max_items', self::DEFAULT_MAX_ITEMS, $ability_name );

		if ( $filtered < 1 ) {
			$filtered = 1;
		}

		return min( $filtered, self::HARD_MAX_ITEMS );
	}

	/**
	 * Validate that `$input[$key]` is a present, non-empty list within cap.
	 *
	 * Distinct codes so an agent can tell "you forgot the field" from "you
	 * sent an object instead of a list" from "split this and retry".
	 *
	 * @since 1.0.0
	 *
	 * @param array<string, mixed> $input        Ability input.
	 * @param string               $key          Array key holding the rows.
	 * @param string               $ability_name Full ability name, for the cap.
	 * @return WP_Error|null Null when the batch is acceptable.
	 */
	public static function validate_batch( array $input, string $key, string $ability_name ): ?WP_Error {
		$missing = AbilityInput::required( $input, array( $key ) );
		if ( $missing ) {
			return $missing;
		}

		$rows = $input[ $key ];

		if ( ! is_array( $rows ) || ! self::is_list( $rows ) ) {
			return new WP_Error(
				'doublescale_invalid_batch',
				sprintf(
					/* translators: %s: field name */
					__( '%s must be a list of objects.', 'doublescale' ),
					$key
				),
				array(
					'status' => 400,
					'field'  => $key,
				)
			);
		}

		if ( array() === $rows ) {
			return new WP_Error(
				'doublescale_empty_batch',
				__( 'The batch is empty. Provide at least one row.', 'doublescale' ),
				array(
					'status' => 400,
					'field'  => $key,
				)
			);
		}

		$max      = self::max_items( $ability_name );
		$received = count( $rows );

		if ( $received > $max ) {
			return new WP_Error(
				'doublescale_batch_too_large',
				sprintf(
					/* translators: 1: maximum allowed rows, 2: number of rows received */
					__( 'This batch has %2$d rows; the limit is %1$d. Split it into smaller batches and retry.', 'doublescale' ),
					$max,
					$received
				),
				array(
					'status'   => 400,
					'max'      => $max,
					'received' => $received,
				)
			);
		}

		return null;
	}

	/**
	 * Run `$handler` on each row, catching per-row failures so one bad item
	 * cannot turn the whole batch into an opaque 500.
	 *
	 * Non-array rows never reach the handler. A thrown `\Throwable` becomes
	 * `doublescale_item_failed` — essential because ContactModel::save() throws
	 * a bare `\Exception` on identifier conflict.
	 *
	 * @since 1.0.0
	 *
	 * @param array<int, mixed> $rows    Submitted rows.
	 * @param callable          $handler fn(array $row, int $index): array|WP_Error.
	 * @param array<string, mixed> $options {
	 *     @type string $ability_name Full ability name, passed to the per-row hook.
	 *     @type string $batch_id     Optional override; generated when absent.
	 * }
	 * @return array{items: array<int, mixed>, errors: array<int, array<string, mixed>>, batch_id: string}
	 */
	public static function process( array $rows, callable $handler, array $options = array() ): array {
		$batch_id = ( isset( $options['batch_id'] ) && is_string( $options['batch_id'] ) && '' !== $options['batch_id'] )
			? $options['batch_id']
			: substr( md5( uniqid( 'ds_bulk_', true ) ), 0, 12 );

		$ability_name = isset( $options['ability_name'] ) ? (string) $options['ability_name'] : '';

		$items  = array();
		$errors = array();

		foreach ( $rows as $index => $row ) {
			$index = (int) $index;

			if ( ! is_array( $row ) ) {
				$shaped             = self::shape_error(
					$index,
					new WP_Error(
						'doublescale_invalid_item',
						__( 'Each row must be an object with named fields.', 'doublescale' ),
						array( 'status' => 400 )
					)
				);
				$shaped['batch_id'] = $batch_id;
				$errors[]           = $shaped;
				continue;
			}

			try {
				$result = call_user_func( $handler, $row, $index );
			} catch ( \Throwable $e ) {
				$shaped             = self::shape_error(
					$index,
					new WP_Error(
						'doublescale_item_failed',
						sprintf(
							/* translators: 1: row index, 2: failure reason */
							__( 'Row %1$d failed: %2$s', 'doublescale' ),
							$index,
							$e->getMessage()
						),
						array( 'status' => 500 )
					),
					self::identity_from_row( $row )
				);
				$shaped['batch_id'] = $batch_id;
				$errors[]           = $shaped;
				continue;
			}

			if ( is_wp_error( $result ) ) {
				$shaped             = self::shape_error( $index, $result, self::identity_from_row( $row ) );
				$shaped['batch_id'] = $batch_id;
				$errors[]           = $shaped;
				continue;
			}

			$items[] = $result;

			/**
			 * Fires after one row in a bulk write succeeds.
			 *
			 * AbilityGuard must not introspect envelope shape; per-row
			 * accountability lives here so a listener can write a timeline
			 * entry without parsing the batch result. `$batch_id` is the same
			 * value on the envelope and on every error entry, so N timeline
			 * rows from one call are distinguishable from N separate calls.
			 *
			 * @since 1.0.0
			 *
			 * @param string $ability_name Full ability name.
			 * @param int    $index        Row index in the submitted batch.
			 * @param mixed  $result       What the per-row handler returned.
			 * @param string $batch_id     Id shared with the envelope and errors.
			 * @param int    $user_id      User the write ran as.
			 */
			do_action(
				'doublescale_ability_bulk_item',
				$ability_name,
				$index,
				$result,
				$batch_id,
				(int) get_current_user_id()
			);
		}

		return array(
			'items'    => $items,
			'errors'   => $errors,
			'batch_id' => $batch_id,
		);
	}

	/**
	 * Shape one per-row error for the envelope.
	 *
	 * @since 1.0.0
	 *
	 * @param int                  $index    Row index in the submitted batch.
	 * @param WP_Error             $error    Failure.
	 * @param array<string, mixed> $identity Optional identifying fields (email, id).
	 * @return array<string, mixed>
	 */
	public static function shape_error( int $index, WP_Error $error, array $identity = array() ): array {
		$data  = $error->get_error_data();
		$extra = is_array( $data ) ? $data : array();

		return array_merge(
			array(
				'index'   => $index,
				'code'    => $error->get_error_code(),
				'message' => $error->get_error_message(),
			),
			$identity,
			$extra
		);
	}

	/**
	 * Build the bulk write envelope.
	 *
	 * `$verb` (`created` or `updated`) is a top-level int on purpose:
	 * {@see AbilityGuard::changed_something()} reads only those keys and casts
	 * to bool. Nesting the count under `summary` would fall through to
	 * `return true` and fire a phantom audit for a batch where every row
	 * failed. `created => 0` suppresses the audit with no change to the guard.
	 *
	 * @since 1.0.0
	 *
	 * @param array{items?: array<int, mixed>, errors?: array<int, mixed>, batch_id?: string} $processed From {@see process()}.
	 * @param string               $verb  `created` or `updated`.
	 * @param array<string, mixed> $extra Additional top-level keys.
	 * @return array<string, mixed>
	 */
	public static function envelope( array $processed, string $verb, array $extra = array() ): array {
		$items  = array_values( $processed['items'] ?? array() );
		$errors = array_values( $processed['errors'] ?? array() );
		$count  = count( $items );
		$failed = count( $errors );

		return array_merge(
			array(
				$verb      => $count,
				'failed'   => $failed,
				'total'    => $count + $failed,
				'items'    => $items,
				'errors'   => $errors,
				'partial'  => $count > 0 && $failed > 0,
				'batch_id' => (string) ( $processed['batch_id'] ?? '' ),
			),
			$extra
		);
	}

	/**
	 * Whether an array is a 0-indexed list (PHP 7.4 stand-in for array_is_list).
	 *
	 * @param array<mixed> $value Value.
	 * @return bool
	 */
	private static function is_list( array $value ): bool {
		$expected = 0;
		foreach ( array_keys( $value ) as $key ) {
			if ( $key !== $expected ) {
				return false;
			}
			++$expected;
		}
		return true;
	}

	/**
	 * Pull identifying fields off a row for error entries.
	 *
	 * @param array<string, mixed> $row Row.
	 * @return array<string, mixed>
	 */
	private static function identity_from_row( array $row ): array {
		$identity = array();

		if ( isset( $row['email'] ) && is_scalar( $row['email'] ) && '' !== (string) $row['email'] ) {
			$identity['email'] = (string) $row['email'];
		}

		if ( isset( $row['id'] ) && is_numeric( $row['id'] ) && (int) $row['id'] > 0 ) {
			$identity['id'] = (int) $row['id'];
		}

		return $identity;
	}
}
