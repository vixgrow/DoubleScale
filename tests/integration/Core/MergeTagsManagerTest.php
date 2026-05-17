<?php
/**
 * Integration test for \DoubleScale\Core\MergeTags\MergeTagsManager.
 *
 * Covers:
 *  - register() de-dupes by slug, exposes the tag via get_merge_tag()
 *  - get_merge_tag() supports dynamic slugs (prefix match for slugs ending in
 *    "_" or ":")
 *  - extract_merge_tag_keys() finds every {{group:slug}} occurrence
 *  - process_merge_tags() replaces tags with the values returned by
 *    MergeTag::get_tag_value(), and renders unknown tags as empty strings
 *
 * @package DoubleScale\Tests\Integration\Core
 */

namespace DoubleScale\Tests\Integration\Core;

use DoubleScale\Core\MergeTags\Abstracts\MergeTag;
use DoubleScale\Core\MergeTags\MergeTagsManager;
use DoubleScale\Tests\Integration\IntegrationTestCase;

defined( 'ABSPATH' ) || exit;

final class MergeTagsManagerTest extends IntegrationTestCase {

	private MergeTagsManager $manager;

	protected function setUp(): void {
		parent::setUp();
		// Fresh instance per test — the manager is a singleton in production,
		// but we want isolated state here.
		$ref = new \ReflectionClass( MergeTagsManager::class );
		$this->manager = $ref->newInstanceWithoutConstructor();
	}

	public function test_register_then_get_returns_the_tag(): void {
		$tag = $this->make_tag( 'contact', 'first_name', 'Alice' );
		$this->manager->register( $tag );

		$retrieved = $this->manager->get_merge_tag( 'contact', 'first_name' );
		$this->assertSame( $tag, $retrieved );
	}

	public function test_register_is_idempotent_per_slug(): void {
		$first  = $this->make_tag( 'contact', 'email', 'first@example.test' );
		$second = $this->make_tag( 'contact', 'email', 'second@example.test' );

		$this->manager->register( $first );
		$this->manager->register( $second );

		$retrieved = $this->manager->get_merge_tag( 'contact', 'email' );
		$this->assertSame( $first, $retrieved, 'Re-registering the same slug must be ignored.' );
	}

	public function test_get_merge_tag_returns_null_for_unknown(): void {
		$this->assertNull( $this->manager->get_merge_tag( 'nope', 'nope' ) );
	}

	public function test_get_merge_tag_resolves_dynamic_slug_prefix_match(): void {
		// Dynamic merge tag: registered slug ends with "_" so any slug starting
		// with "custom_field_" should resolve to the same tag.
		$tag = $this->make_tag( 'contact', 'custom_field_', 'dynamic-value' );
		$this->manager->register( $tag );

		$this->assertSame( $tag, $this->manager->get_merge_tag( 'contact', 'custom_field_42' ) );
		$this->assertSame( $tag, $this->manager->get_merge_tag( 'contact', 'custom_field_anything' ) );
	}

	public function test_extract_merge_tag_keys_finds_all_occurrences(): void {
		$content = 'Hello {{contact:first_name}}, your email is {{contact:email}}. Bye {{contact:first_name}}!';
		$keys    = $this->manager->extract_merge_tag_keys( $content );

		$this->assertIsArray( $keys );
		$this->assertNotEmpty( $keys );
		// At least one entry per distinct tag should appear.
		$flat = wp_json_encode( $keys );
		$this->assertStringContainsString( 'first_name', (string) $flat );
		$this->assertStringContainsString( 'email', (string) $flat );
	}

	public function test_process_merge_tags_replaces_known_tags(): void {
		$this->manager->register( $this->make_tag( 'contact', 'first_name', 'Alice' ) );
		$this->manager->register( $this->make_tag( 'contact', 'email', 'alice@example.test' ) );

		$content = 'Hello {{contact:first_name}}, email: {{contact:email}}.';
		$out     = $this->manager->process_merge_tags( $content, $this->make_contact_object() );

		$this->assertSame( 'Hello Alice, email: alice@example.test.', $out );
	}

	public function test_process_merge_tags_renders_unknown_tags_as_empty_string(): void {
		$content = 'Hello {{contact:first_name}}{{contact:does_not_exist}}!';
		$this->manager->register( $this->make_tag( 'contact', 'first_name', 'Alice' ) );

		$out = $this->manager->process_merge_tags( $content, $this->make_contact_object() );
		$this->assertSame( 'Hello Alice!', $out );
	}

	/**
	 * Anonymous MergeTag subclass returning a fixed value.
	 */
	private function make_tag( string $group, string $slug, string $value ): MergeTag {
		return new class( $group, $slug, $value ) extends MergeTag {
			public function __construct( string $group, string $slug, private string $value ) {
				$this->group         = $group;
				$this->slug          = $slug;
				$this->name          = $slug;
				$this->is_automation = false;
			}

			public function get_value( $contact, $merge_tag = '' ) {
				return $this->value;
			}
		};
	}

	/**
	 * Minimal contact-like object that does NOT implement has_tracking_context().
	 * Forces process_merge_tags() into its "fresh processing" branch.
	 */
	private function make_contact_object(): object {
		return new class() {
			public string $first_name = 'Alice';
			public string $email      = 'alice@example.test';
		};
	}
}
