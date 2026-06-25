<?php
/**
 * Tier 3 — per-contact article-read tracking (the CRM differentiator).
 *
 * Writes a `kb_article_viewed` activity to the reading contact's timeline so an
 * agent opening a ticket can see what that contact already read. Agent-facing
 * only — the type is deliberately NOT whitelisted into the portal timeline.
 * Gated by the `track_contact_views` setting (GDPR off-switch).
 *
 * @since 1.0.0
 * @package DoubleScale\Modules\Knowledgebase
 */

namespace DoubleScale\Modules\Knowledgebase\Services;

defined( 'ABSPATH' ) || exit;

use DoubleScale\Core\Constants\ActivityTypes;
use DoubleScale\Modules\Activities\Models\ActivityModel;
use DoubleScale\Modules\Contacts\Models\ContactModel;
use WP_Post;

/**
 * ContactViewTracker class.
 */
class ContactViewTracker {

	/**
	 * Contact resolver (for identified guests).
	 *
	 * @var ContactResolver
	 */
	private $resolver;

	/**
	 * Constructor.
	 *
	 * @param ContactResolver|null $resolver Resolver (injectable for tests).
	 */
	public function __construct( ?ContactResolver $resolver = null ) {
		$this->resolver = $resolver ?? new ContactResolver();
	}

	/**
	 * Record a read against whoever is identifiable.
	 *
	 * @param WP_Post     $article     The article being read.
	 * @param string|null $guest_email Optional email supplied by a guest in the flow.
	 * @return void
	 */
	public function record( WP_Post $article, ?string $guest_email = null ): void {
		if ( ! KnowledgebaseSettings::get( 'track_contact_views' ) ) {
			return;
		}

		$contact = $this->resolve_contact( $guest_email );
		if ( ! $contact instanceof ContactModel ) {
			return;
		}

		try {
			ActivityModel::create(
				array(
					'contact_id'    => (int) $contact->id,
					'activity_type' => ActivityTypes::KB_ARTICLE_VIEWED,
					'user_id'       => null,
					'data'          => array(
						'article_id'    => (int) $article->ID,
						'article_title' => (string) $article->post_title,
						'article_url'   => (string) get_permalink( $article ),
					),
				)
			);
		} catch ( \Throwable $e ) {
			if ( function_exists( 'doublescale_get_logger' ) ) {
				doublescale_get_logger()->error(
					'KB article-view tracking failed',
					array(
						'source'     => 'knowledgebase-view-tracker',
						'exception'  => $e->getMessage(),
						'article_id' => (int) $article->ID,
					)
				);
			}
		}
	}

	/**
	 * Resolve the reading contact: the logged-in portal user first, otherwise an
	 * identified-guest email (find-or-create).
	 *
	 * @param string|null $guest_email Optional guest email.
	 * @return ContactModel|null
	 */
	private function resolve_contact( ?string $guest_email ): ?ContactModel {
		if ( is_user_logged_in()
			&& class_exists( '\\DoubleScale\\Modules\\Portal\\Services\\PortalIdentity' ) ) {
			$contact = \DoubleScale\Modules\Portal\Services\PortalIdentity::current_contact();
			if ( $contact instanceof ContactModel ) {
				return $contact;
			}
		}

		if ( is_string( $guest_email ) && '' !== trim( $guest_email ) ) {
			return $this->resolver->find_or_create( $guest_email );
		}

		return null;
	}
}
