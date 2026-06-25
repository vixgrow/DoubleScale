<?php
/**
 * Knowledge Base module bootstrap.
 *
 * Free, self-hosted Knowledge Base modelled on BetterDocs + Perfex. Storage is
 * WordPress-native — a `doublescale_kb` custom post type plus the
 * `doublescale_kb_group` / `doublescale_kb_tag` taxonomies — so there are NO
 * content tables (and no content migrations). The admin SPA edits it through the
 * `doublescale/v1` REST surface; the public surface is the themed CPT
 * permalinks/archive plus the `[doublescale_knowledgebase]` shortcode.
 *
 * Three surfaces: admin SPA, logged-in portal tab, and the public anonymous
 * SEO-indexed site. The `public_access` setting + per-article/per-group
 * visibility are enforced at the WP front-end routing layer
 * ({@see Renderer\FrontendGuard}) because the public CPT serves its own pages.
 *
 * @since 1.0.0
 * @package DoubleScale\Modules\Knowledgebase
 */

namespace DoubleScale\Modules\Knowledgebase;

defined( 'ABSPATH' ) || exit;

use DoubleScale\Admin\AdminLoader;
use DoubleScale\Admin\MenuRegistry;
use DoubleScale\Core\AbstractModule;
use DoubleScale\Core\Container;
use DoubleScale\Modules\Knowledgebase\Integrations\KnowledgebaseAiProvider;
use DoubleScale\Modules\Knowledgebase\PostTypes\KnowledgebasePostType;
use DoubleScale\Modules\Knowledgebase\Renderer\FrontendGuard;
use DoubleScale\Modules\Knowledgebase\Renderer\KnowledgebaseShortcode;
use DoubleScale\Modules\Knowledgebase\Services\KnowledgebaseSettings;

/**
 * Module class.
 */
final class Module extends AbstractModule {

	/**
	 * Module slug — the single token used on every surface.
	 *
	 * @return string
	 */
	public function slug(): string {
		return 'knowledgebase';
	}

	/**
	 * Human label.
	 *
	 * @return string
	 */
	public function label(): string {
		return __( 'Knowledge Base', 'doublescale' );
	}

	/**
	 * Description.
	 *
	 * @return string
	 */
	public function description(): string {
		return __( 'Self-hosted help center: public, portal, and staff-internal articles with search and deflection.', 'doublescale' );
	}

	/**
	 * Version.
	 *
	 * @return string
	 */
	public function version(): string {
		return '1.0.0';
	}

	/**
	 * Toggleable so it renders in Settings → Modules.
	 *
	 * @return bool
	 */
	public function is_toggleable(): bool {
		return true;
	}

	/**
	 * Dependencies — Tier-3 tracking writes a contact-timeline activity, and both
	 * `contacts` and `activities` are always-on foundations, so these deps can
	 * never strand the module.
	 *
	 * @return array<int, string>
	 */
	public function dependencies(): array {
		return array( 'core', 'contacts', 'activities' );
	}

	/**
	 * Register DI bindings.
	 *
	 * @param Container $container DI container.
	 * @return void
	 */
	public function register( Container $container ): void {
		// Services are lightweight and self-constructing; no bindings required.
	}

	/**
	 * REST controllers (wired to rest_api_init by the parent boot()).
	 *
	 * @return array<int, string>
	 */
	public function restControllers(): array {
		return array(
			Rest\Controllers\RestArticleController::class,
			Rest\Controllers\RestGroupController::class,
			Rest\Controllers\RestPublicArticleController::class,
			Rest\Controllers\RestKnowledgebaseSettingsController::class,
		);
	}

	/**
	 * Boot WP hooks (enabled-only — the registry never boots a disabled module).
	 *
	 * @param Container $container DI container.
	 * @return void
	 */
	public function boot( Container $container ): void {
		parent::boot( $container );

		// Register the CPT + taxonomies + meta (and the deferred rewrite flush)
		// on init. Late priority so taxonomies/posts settle before the flush.
		add_action( 'init', array( KnowledgebasePostType::class, 'register' ), 9 );

		// Front-end routing guard for the themed CPT permalinks/archive.
		( new FrontendGuard() )->register();

		// Public SEO shortcode.
		( new KnowledgebaseShortcode() )->register();

		// AIAssistant knowledge-source wiring (no-op if the AI plugin is absent).
		( new KnowledgebaseAiProvider() )->register();

		// Client Portal: contribute the Knowledge Base section + inject its REST base.
		add_filter( 'doublescale_portal_sections', array( $this, 'register_portal_section' ) );
		add_filter( 'doublescale_client_portal_config', array( $this, 'inject_portal_config' ), 10, 2 );

		// Admin sidebar entry.
		MenuRegistry::add(
			array(
				'page_title'      => __( 'Knowledge Base', 'doublescale' ),
				'menu_title'      => __( 'Knowledge Base', 'doublescale' ),
				'capability'      => 'doublescale_manage_knowledgebase',
				'slug'            => 'doublescale&path=knowledgebase',
				'callback'        => array( AdminLoader::class, 'page_wrapper' ),
				'position'        => 47,
				'group'           => 'sales',
				'requires_module' => 'knowledgebase',
			)
		);
	}

	/**
	 * Contribute the Knowledge Base section to the Client Portal.
	 *
	 * @param array<int, array<string, mixed>> $sections Section descriptors.
	 * @return array<int, array<string, mixed>>
	 */
	public function register_portal_section( array $sections ): array {
		$sections[] = array(
			'slug'         => 'knowledgebase',
			'label'        => __( 'Knowledge Base', 'doublescale' ),
			'icon'         => 'book',
			'order'        => 20,
			'is_available' => static function (): bool {
				return doublescale_is_module_active( 'knowledgebase' )
					&& (bool) KnowledgebaseSettings::get( 'show_in_portal' );
			},
			'badge'        => static fn( $contact ) => 0,
		);

		return $sections;
	}

	/**
	 * Inject the KB public REST base into the Client Portal renderer config.
	 *
	 * @param array<string, mixed> $config Renderer config.
	 * @param \WP_User             $user   Current user (unused).
	 * @return array<string, mixed>
	 */
	public function inject_portal_config( array $config, $user ): array { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		$config['knowledgebase_rest_url'] = esc_url_raw( rest_url( 'doublescale/v1/knowledgebase/public' ) );

		return $config;
	}
}
