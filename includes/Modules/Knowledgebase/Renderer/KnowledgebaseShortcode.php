<?php
/**
 * `[doublescale_knowledgebase]` shortcode — server-rendered, SEO-friendly index.
 *
 * Renders groups + their published articles + a search form in PHP (not a React
 * mount) so crawlers see the content. Only articles the current viewer is
 * cleared to see are listed (the shared {@see Visibility} resolver), and the
 * whole surface respects the `public_access` setting.
 *
 * @since 1.0.0
 * @package DoubleScale\Modules\Knowledgebase
 */

namespace DoubleScale\Modules\Knowledgebase\Renderer;

defined( 'ABSPATH' ) || exit;

use DoubleScale\Modules\Knowledgebase\PostTypes\KnowledgebasePostType;
use DoubleScale\Modules\Knowledgebase\Repositories\ArticleRepository;
use DoubleScale\Modules\Knowledgebase\Repositories\GroupRepository;
use DoubleScale\Modules\Knowledgebase\Services\KnowledgebaseSettings;
use DoubleScale\Modules\Knowledgebase\Services\Visibility;
use WP_Term;

/**
 * KnowledgebaseShortcode class.
 */
final class KnowledgebaseShortcode {

	/**
	 * Shortcode tag.
	 */
	public const TAG = 'doublescale_knowledgebase';

	/**
	 * Register the shortcode.
	 *
	 * @return void
	 */
	public function register(): void {
		add_shortcode( self::TAG, array( $this, 'render' ) );
	}

	/**
	 * Render the shortcode output.
	 *
	 * @param array<string, mixed>|string $atts Shortcode attributes.
	 * @return string
	 */
	public function render( $atts ): string {
		$atts = shortcode_atts(
			array(
				'group' => '',
			),
			is_array( $atts ) ? $atts : array(),
			self::TAG
		);

		$access = (string) KnowledgebaseSettings::get( 'public_access' );
		if ( 'disabled' === $access ) {
			return '';
		}
		if ( 'portal' === $access && ! is_user_logged_in() ) {
			return '<div class="doublescale-kb"><p>' . esc_html__( 'Please log in to view the knowledge base.', 'doublescale' ) . '</p></div>';
		}

		$groups = ( new GroupRepository() )->all();
		if ( '' !== $atts['group'] ) {
			$groups = array_filter(
				$groups,
				static function ( WP_Term $term ) use ( $atts ): bool {
					return $term->slug === $atts['group'] || (string) $term->term_id === (string) $atts['group'];
				}
			);
		}

		ob_start();
		?>
		<div class="doublescale-kb">
			<form class="doublescale-kb__search" role="search" method="get" action="<?php echo esc_url( get_post_type_archive_link( KnowledgebasePostType::POST_TYPE ) ); ?>">
				<label class="screen-reader-text" for="doublescale-kb-s"><?php esc_html_e( 'Search the knowledge base', 'doublescale' ); ?></label>
				<input type="search" id="doublescale-kb-s" name="s" placeholder="<?php esc_attr_e( 'Search articles…', 'doublescale' ); ?>" />
				<input type="hidden" name="post_type" value="<?php echo esc_attr( KnowledgebasePostType::POST_TYPE ); ?>" />
				<button type="submit"><?php esc_html_e( 'Search', 'doublescale' ); ?></button>
			</form>

			<div class="doublescale-kb__groups">
				<?php
				foreach ( $groups as $group ) {
					$this->render_group( $group );
				}
				if ( empty( $groups ) ) {
					echo '<p>' . esc_html__( 'No articles published yet.', 'doublescale' ) . '</p>';
				}
				?>
			</div>
		</div>
		<?php
		return (string) ob_get_clean();
	}

	/**
	 * Render one group block with its visible articles.
	 *
	 * @param WP_Term $group Group term.
	 * @return void
	 */
	private function render_group( WP_Term $group ): void {
		// Hide a whole group the viewer can't enter.
		if ( ! Visibility::viewer_can_see( Visibility::group_effective_visibility( (int) $group->term_id ) ) ) {
			return;
		}

		$query = ( new ArticleRepository() )->query(
			array(
				'post_status'    => array( 'publish' ),
				'posts_per_page' => (int) KnowledgebaseSettings::get( 'articles_per_page' ),
				'no_found_rows'  => true,
				'tax_query'      => array( // phpcs:ignore WordPress.DB.SlowDBQuery.slow_db_query_tax_query -- per-group article listing.
					array(
						'taxonomy' => KnowledgebasePostType::TAXONOMY_GROUP,
						'terms'    => array( (int) $group->term_id ),
					),
				),
			)
		);

		$visible = array_filter(
			$query->posts,
			static function ( $post ): bool {
				return Visibility::viewer_can_see( Visibility::effective_visibility( $post ) );
			}
		);

		if ( empty( $visible ) ) {
			return;
		}

		$color = (string) get_term_meta( $group->term_id, KnowledgebasePostType::TERM_META_COLOR, true );
		?>
		<section class="doublescale-kb__group"<?php echo $color ? ' style="border-left:4px solid ' . esc_attr( $color ) . ';padding-left:12px"' : ''; ?>>
			<h2 class="doublescale-kb__group-title"<?php echo $color ? ' style="color:' . esc_attr( $color ) . '"' : ''; ?>>
				<?php echo esc_html( $group->name ); ?>
			</h2>
			<ul class="doublescale-kb__articles">
				<?php foreach ( $visible as $post ) : ?>
					<li class="doublescale-kb__article">
						<a href="<?php echo esc_url( (string) get_permalink( $post ) ); ?>">
							<?php echo esc_html( get_the_title( $post ) ); ?>
						</a>
					</li>
				<?php endforeach; ?>
			</ul>
		</section>
		<?php
	}
}
