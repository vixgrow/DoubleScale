<?php
/**
 * Knowledge Base post type + taxonomy registration.
 *
 * Storage is WordPress-native: a `doublescale_kb` custom post type plus the
 * `doublescale_kb_group` (hierarchical) and `doublescale_kb_tag` taxonomies.
 * The admin SPA edits these through the `doublescale/v1` REST surface, so the
 * post type is registered with `show_ui=false` / `show_in_rest=false`.
 *
 * The post type uses a custom `capability_type` (`doublescale_kb` /
 * `doublescale_kbs`) with `map_meta_cap=true` so CRM/Support Managers — who do
 * NOT hold the blanket `edit_posts` / `read_private_posts` caps — can still
 * read `private` internal articles and CRUD them once granted the KB caps in
 * {@see \DoubleScale\Core\UserRoles\UserRoles}.
 *
 * @since 1.0.0
 * @package DoubleScale\Modules\Knowledgebase
 */

namespace DoubleScale\Modules\Knowledgebase\PostTypes;

defined( 'ABSPATH' ) || exit;

/**
 * KnowledgebasePostType class.
 */
final class KnowledgebasePostType {

	/**
	 * Custom post type slug.
	 */
	public const POST_TYPE = 'doublescale_kb';

	/**
	 * Hierarchical "group/category" taxonomy slug.
	 */
	public const TAXONOMY_GROUP = 'doublescale_kb_group';

	/**
	 * Non-hierarchical "tag" taxonomy slug.
	 */
	public const TAXONOMY_TAG = 'doublescale_kb_tag';

	/**
	 * Post meta: integer view counter.
	 */
	public const META_VIEWS = '_doublescale_kb_views';

	/**
	 * Post meta: related-article post-ID array.
	 */
	public const META_RELATED = '_doublescale_kb_related';

	/**
	 * Post meta: members-only flag (1 = logged-in users + staff only).
	 */
	public const META_MEMBERS_ONLY = '_doublescale_kb_members_only';

	/**
	 * Post meta: "Was this helpful?" — yes counter.
	 */
	public const META_HELPFUL = '_doublescale_kb_helpful';

	/**
	 * Post meta: "Was this helpful?" — no counter.
	 */
	public const META_NOT_HELPFUL = '_doublescale_kb_not_helpful';

	/**
	 * Term meta: hex colour for a group.
	 */
	public const TERM_META_COLOR = '_doublescale_kb_color';

	/**
	 * Term meta: integer display order for a group.
	 */
	public const TERM_META_ORDER = '_doublescale_kb_order';

	/**
	 * Term meta: group visibility (`public` | `members` | `internal`).
	 */
	public const TERM_META_VISIBILITY = '_doublescale_kb_group_visibility';

	/**
	 * Option storing the rewrite-rule version so a one-shot flush runs the first
	 * time the post type is registered on any install (fresh activation,
	 * upgrade-seed, OR an admin toggling the module on via Settings → Modules —
	 * the toggle path fires no activation hook, so the flush has to be driven
	 * from the registration callback itself).
	 */
	private const REWRITE_VERSION_OPTION = 'doublescale_kb_rewrite_version';

	/**
	 * Bump when the post-type/taxonomy rewrite shape changes to force a re-flush.
	 */
	private const REWRITE_VERSION = '2026-06-25-kb-1';

	/**
	 * Public URL slug (the post type rewrite base and the portal/menu token).
	 */
	public const PUBLIC_SLUG = 'knowledgebase';

	/**
	 * Register the CPT + taxonomies + meta on `init`.
	 *
	 * Called only when the module is enabled (the registry never boots a disabled
	 * module), so the gate here is belt-and-suspenders.
	 *
	 * @return void
	 */
	public static function register(): void {
		self::register_taxonomies();
		self::register_post_type();
		self::register_meta();
		self::maybe_flush_rewrite_rules();
	}

	/**
	 * Register the group + tag taxonomies (before the post type so the rewrite
	 * tree resolves cleanly).
	 *
	 * @return void
	 */
	private static function register_taxonomies(): void {
		register_taxonomy(
			self::TAXONOMY_GROUP,
			self::POST_TYPE,
			array(
				'public'            => true,
				'hierarchical'      => true,
				'show_ui'           => false,
				'show_in_rest'      => false,
				'show_admin_column' => false,
				'rewrite'           => array(
					'slug'         => self::PUBLIC_SLUG . '/group',
					'with_front'   => false,
					'hierarchical' => true,
				),
				'labels'            => array(
					'name'          => __( 'Knowledge Base Groups', 'doublescale' ),
					'singular_name' => __( 'Group', 'doublescale' ),
				),
			)
		);

		register_taxonomy(
			self::TAXONOMY_TAG,
			self::POST_TYPE,
			array(
				'public'       => true,
				'hierarchical' => false,
				'show_ui'      => false,
				'show_in_rest' => false,
				'rewrite'      => array(
					'slug'       => self::PUBLIC_SLUG . '/tag',
					'with_front' => false,
				),
				'labels'       => array(
					'name'          => __( 'Knowledge Base Tags', 'doublescale' ),
					'singular_name' => __( 'Tag', 'doublescale' ),
				),
			)
		);
	}

	/**
	 * Register the `doublescale_kb` post type.
	 *
	 * @return void
	 */
	private static function register_post_type(): void {
		register_post_type(
			self::POST_TYPE,
			array(
				'public'          => true,
				'show_ui'         => false,
				'show_in_rest'    => false,
				'has_archive'     => true,
				'hierarchical'    => false,
				'capability_type' => array( 'doublescale_kb', 'doublescale_kbs' ),
				'map_meta_cap'    => true,
				'rewrite'         => array(
					'slug'       => self::PUBLIC_SLUG,
					'with_front' => false,
				),
				'menu_icon'       => 'dashicons-book',
				'supports'        => array( 'title', 'editor', 'excerpt', 'author', 'revisions', 'custom-fields', 'thumbnail' ),
				'labels'          => array(
					'name'          => __( 'Knowledge Base', 'doublescale' ),
					'singular_name' => __( 'Article', 'doublescale' ),
				),
			)
		);
	}

	/**
	 * Register post meta so revisions/REST treat them as first-class fields.
	 *
	 * @return void
	 */
	private static function register_meta(): void {
		register_post_meta(
			self::POST_TYPE,
			self::META_VIEWS,
			array(
				'type'          => 'integer',
				'single'        => true,
				'default'       => 0,
				'show_in_rest'  => false,
				'auth_callback' => static function () {
					return current_user_can( 'doublescale_manage_knowledgebase' );
				},
			)
		);

		register_post_meta(
			self::POST_TYPE,
			self::META_MEMBERS_ONLY,
			array(
				'type'          => 'boolean',
				'single'        => true,
				'default'       => false,
				'show_in_rest'  => false,
				'auth_callback' => static function () {
					return current_user_can( 'doublescale_manage_knowledgebase' );
				},
			)
		);

		foreach ( array( self::META_HELPFUL, self::META_NOT_HELPFUL ) as $counter_key ) {
			register_post_meta(
				self::POST_TYPE,
				$counter_key,
				array(
					'type'          => 'integer',
					'single'        => true,
					'default'       => 0,
					'show_in_rest'  => false,
					'auth_callback' => static function () {
						return current_user_can( 'doublescale_manage_knowledgebase' );
					},
				)
			);
		}
	}

	/**
	 * Flush rewrite rules exactly once per {@see REWRITE_VERSION}, after the post
	 * type has been registered. Runs from the `init` callback (never from
	 * activation/install, which fire before this `init` registration), so it
	 * correctly covers the admin-toggle path where no activation hook fires.
	 *
	 * @return void
	 */
	private static function maybe_flush_rewrite_rules(): void {
		if ( self::REWRITE_VERSION === get_option( self::REWRITE_VERSION_OPTION ) ) {
			return;
		}

		flush_rewrite_rules( false );
		update_option( self::REWRITE_VERSION_OPTION, self::REWRITE_VERSION, false );
	}
}
