<?php
/**
 * Thin contact resolver for the Knowledge Base.
 *
 * KB's dependencies are `['core','contacts','activities']` and deliberately do
 * NOT include `support`, so KB must not reach into Support's `ContactResolver`.
 * This owns a minimal find-or-create over the canonical `ContactModel`
 * (`get_by_email()` + a race-safe `create()`), keeping KB free of a Support
 * dependency while still attributing identified-guest reads.
 *
 * @since 1.0.0
 * @package DoubleScale\Modules\Knowledgebase
 */

namespace DoubleScale\Modules\Knowledgebase\Services;

defined( 'ABSPATH' ) || exit;

use DoubleScale\Modules\Contacts\Models\ContactModel;

/**
 * ContactResolver class.
 */
class ContactResolver {

	/**
	 * Return an existing contact for the email, or create one.
	 *
	 * @param string $email Email address.
	 * @return ContactModel|null Null when the email is invalid.
	 */
	public function find_or_create( string $email ): ?ContactModel {
		$email = strtolower( trim( $email ) );
		if ( '' === $email || ! is_email( $email ) ) {
			return null;
		}

		$existing = ContactModel::get_by_email( $email );
		if ( $existing ) {
			return $existing;
		}

		$first_name = null;
		$last_name  = null;
		$wp_user    = get_user_by( 'email', $email );
		if ( $wp_user ) {
			$first_name = ! empty( $wp_user->first_name ) ? $wp_user->first_name : null;
			$last_name  = ! empty( $wp_user->last_name ) ? $wp_user->last_name : null;
		}

		try {
			return ContactModel::create(
				array(
					'email'      => $email,
					'first_name' => $first_name,
					'last_name'  => $last_name,
					'source'     => 'knowledgebase',
				)
			);
		} catch ( \Illuminate\Database\QueryException $e ) {
			// Recover from a duplicate-key race on the email UNIQUE index.
			$winner = ContactModel::get_by_email( $email );
			if ( $winner ) {
				return $winner;
			}

			if ( function_exists( 'doublescale_get_logger' ) ) {
				doublescale_get_logger()->error(
					'KB contact find_or_create failed',
					array(
						'source'    => 'knowledgebase-contact-resolver',
						'exception' => $e->getMessage(),
					)
				);
			}

			return null;
		}
	}
}
