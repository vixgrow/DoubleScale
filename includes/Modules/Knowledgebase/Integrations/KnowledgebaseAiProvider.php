<?php
/**
 * DoubleScale-AIAssistant integration: expose the KB as an AI knowledge source.
 *
 * KB never calls an LLM. It only answers the AI plugin's knowledge-augmentation
 * filter with relevant published articles and registers itself as a governed
 * data source so admins can toggle KB out of the AI scope. These are plain
 * `add_filter` calls, so they are harmless no-ops when the AI plugin (or its
 * filter seams) is absent.
 *
 * The retrieval ABILITY / tool-class registration (`search_knowledgebase`) and
 * AI authoring (draft-from-ticket, summarise) are deferred to AIAssistant/Pro —
 * they depend on that plugin's Abilities contract, which is not implemented here.
 *
 * @since 1.0.0
 * @package DoubleScale\Modules\Knowledgebase
 */

namespace DoubleScale\Modules\Knowledgebase\Integrations;

defined( 'ABSPATH' ) || exit;

use DoubleScale\Modules\Knowledgebase\Repositories\ArticleRepository;

/**
 * KnowledgebaseAiProvider class.
 */
final class KnowledgebaseAiProvider {

	/**
	 * AI data-source key (single token, matching the module slug).
	 */
	private const SOURCE_KEY = 'knowledgebase';

	/**
	 * Wire the AI filters.
	 *
	 * @return void
	 */
	public function register(): void {
		add_filter( 'doublescale_ai_extra_knowledge', array( $this, 'augment_knowledge' ), 10, 4 );
		add_filter( 'doublescale_ai_data_sources', array( $this, 'register_data_source' ) );
	}

	/**
	 * Append relevant KB article snippets to the AI context.
	 *
	 * @param string $knowledge     Accumulated extra-knowledge string.
	 * @param string $context_type  Context type (unused).
	 * @param mixed  $context_id    Context id (unused).
	 * @param string $user_message  The end-user message to match against.
	 * @return string
	 */
	public function augment_knowledge( $knowledge, $context_type, $context_id, $user_message ): string { // phpcs:ignore Generic.CodeAnalysis.UnusedFunctionParameter
		$knowledge = (string) $knowledge;
		$query     = trim( (string) $user_message );
		if ( '' === $query ) {
			return $knowledge;
		}

		$articles = ( new ArticleRepository() )->query(
			array(
				's'              => $query,
				'post_status'    => array( 'publish' ),
				'posts_per_page' => 3,
				'no_found_rows'  => true,
			)
		);

		if ( empty( $articles->posts ) ) {
			return $knowledge;
		}

		$parts = array( "\n\n# Knowledge Base articles" );
		foreach ( $articles->posts as $post ) {
			$body    = wp_trim_words( wp_strip_all_tags( $post->post_content ), 200 );
			$parts[] = '## ' . $post->post_title . "\n" . $body . "\nURL: " . get_permalink( $post );
		}

		return $knowledge . implode( "\n\n", $parts );
	}

	/**
	 * Register `knowledgebase` as a governed AI data source.
	 *
	 * @param array<string, mixed> $sources Existing data sources.
	 * @return array<string, mixed>
	 */
	public function register_data_source( $sources ): array {
		$sources = is_array( $sources ) ? $sources : array();

		$sources[ self::SOURCE_KEY ] = array(
			'label'       => __( 'Knowledge Base', 'doublescale' ),
			'description' => __( 'Let the assistant cite published knowledge base articles.', 'doublescale' ),
		);

		return $sources;
	}
}
