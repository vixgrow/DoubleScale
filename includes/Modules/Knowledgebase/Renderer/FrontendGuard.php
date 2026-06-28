<?php
/**
 * Front-end routing guard for the public Knowledge Base CPT.
 *
 * Because `doublescale_kb` is registered `public => true, has_archive => true`,
 * WordPress routes `/knowledgebase/<slug>/` and the archive through the THEME
 * template, bypassing the REST controller entirely. The `public_access` mode and
 * the per-article / per-group visibility therefore cannot be enforced from a
 * REST `permission_callback` alone — they must be applied at the WP front-end
 * routing layer. This class is that layer.
 *
 * All decisions defer to {@see Visibility} so the REST listing, the archive
 * query, and the single-article guard never drift.
 *
 * @since 1.0.0
 * @package DoubleScale\Modules\Knowledgebase
 */

namespace DoubleScale\Modules\Knowledgebase\Renderer;

defined( 'ABSPATH' ) || exit;

use DoubleScale\Modules\Knowledgebase\PostTypes\KnowledgebasePostType;
use DoubleScale\Modules\Knowledgebase\Services\KnowledgebaseSettings;
use DoubleScale\Modules\Knowledgebase\Services\Visibility;
use WP_Post;
use WP_Query;

/**
 * FrontendGuard class.
 */
final class FrontendGuard {

	/**
	 * Wire the front-end hooks (called from Module::boot, enabled-only).
	 *
	 * @return void
	 */
	public function register(): void {
		add_action( 'template_redirect', array( $this, 'guard_single_and_archive' ) );
		add_action( 'pre_get_posts', array( $this, 'filter_public_queries' ) );
	}

	/**
	 * Apply the global `public_access` mode + per-article visibility to direct
	 * URL hits on a single article or the archive.
	 *
	 * @return void
	 */
	public function guard_single_and_archive(): void {
		$is_single  = is_singular( KnowledgebasePostType::POST_TYPE );
		$is_archive = is_post_type_archive( KnowledgebasePostType::POST_TYPE )
			|| is_tax( array( KnowledgebasePostType::TAXONOMY_GROUP, KnowledgebasePostType::TAXONOMY_TAG ) );

		if ( ! $is_single && ! $is_archive ) {
			return;
		}

		$access = (string) KnowledgebaseSettings::get( 'public_access' );

		if ( 'disabled' === $access ) {
			$this->deny( null );
			return;
		}

		if ( 'portal' === $access && ! is_user_logged_in() ) {
			$this->redirect_to_login();
			return;
		}

		if ( $is_single ) {
			$post = get_queried_object();
			if ( $post instanceof WP_Post
				&& ! Visibility::viewer_can_see( Visibility::effective_visibility( $post ) ) ) {
				$this->deny( $post );
			}
		}
	}

	/**
	 * Exclude members-only / restricted-group articles from the theme-served
	 * archive + feed queries for ineligible viewers.
	 *
	 * @param WP_Query $query The query.
	 * @return void
	 */
	public function filter_public_queries( WP_Query $query ): void {
		if ( is_admin() || ! $query->is_main_query() ) {
			return;
		}

		$targets_kb = $query->is_post_type_archive( KnowledgebasePostType::POST_TYPE )
			|| $query->is_tax( array( KnowledgebasePostType::TAXONOMY_GROUP, KnowledgebasePostType::TAXONOMY_TAG ) );

		if ( ! $targets_kb ) {
			return;
		}

		// Order the themed archive / taxonomy listings by the admin-curated
		// `menu_order` (matching the REST + portal surfaces) so drag-reordering in
		// the admin is reflected for anonymous visitors too. WordPress would
		// otherwise default these to date DESC. An explicit request orderby wins.
		if ( ! $query->get( 'orderby' ) ) {
			$query->set( 'orderby', 'menu_order' );
			$query->set( 'order', 'ASC' );
		}

		$clearance = Visibility::viewer_clearance();
		if ( Visibility::INTERNAL === $clearance ) {
			return;
		}

		$min_restriction = Visibility::PUBLIC === $clearance ? Visibility::MEMBERS : Visibility::INTERNAL;
		$restricted      = Visibility::restricted_group_term_ids( $min_restriction );

		if ( ! empty( $restricted ) ) {
			$tax_query   = (array) $query->get( 'tax_query' );
			$tax_query[] = array(
				'taxonomy' => KnowledgebasePostType::TAXONOMY_GROUP,
				'terms'    => $restricted,
				'operator' => 'NOT IN',
			);
			$query->set( 'tax_query', $tax_query );
		}

		if ( Visibility::PUBLIC === $clearance ) {
			$meta_query   = (array) $query->get( 'meta_query' );
			$meta_query[] = array(
				'relation' => 'OR',
				array(
					'key'     => KnowledgebasePostType::META_MEMBERS_ONLY,
					'compare' => 'NOT EXISTS',
				),
				array(
					'key'     => KnowledgebasePostType::META_MEMBERS_ONLY,
					'value'   => '1',
					'compare' => '!=',
				),
			);
			$query->set( 'meta_query', $meta_query );
		}
	}

	/**
	 * Send an ineligible visitor to the configured redirect URL, else 404.
	 *
	 * @param WP_Post|null $post The article being denied (for a login return URL).
	 * @return void
	 */
	private function deny( ?WP_Post $post ): void {
		$redirect = (string) KnowledgebaseSettings::get( 'restricted_redirect_url' );
		if ( '' !== $redirect ) {
			wp_safe_redirect( $redirect );
			exit;
		}

		if ( ! is_user_logged_in() && $post instanceof WP_Post ) {
			$this->redirect_to_login( $post );
			return;
		}

		$this->force_404();
	}

	/**
	 * Redirect to the WP login screen, returning to the requested article.
	 *
	 * @param WP_Post|null $post Optional article for the return URL.
	 * @return void
	 */
	private function redirect_to_login( ?WP_Post $post = null ): void {
		$redirect = (string) KnowledgebaseSettings::get( 'restricted_redirect_url' );
		if ( '' !== $redirect ) {
			wp_safe_redirect( $redirect );
			exit;
		}

		$return = $post instanceof WP_Post ? get_permalink( $post ) : home_url( add_query_arg( array() ) );
		wp_safe_redirect( wp_login_url( $return ) );
		exit;
	}

	/**
	 * Render the theme's 404 for a restricted/disabled KB request.
	 *
	 * @return void
	 */
	private function force_404(): void {
		global $wp_query;
		$wp_query->set_404();
		status_header( 404 );
		nocache_headers();

		$template = get_query_template( '404' );
		if ( $template ) {
			include $template;
		}
		exit;
	}
}
