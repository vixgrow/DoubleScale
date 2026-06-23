<?php
/**
 * Tests for sales email intro HTML + merge tag resolution.
 *
 * @package DoubleScale\Tests\Modules\Sales
 */

namespace DoubleScale\Tests\Modules\Sales;

use DoubleScale\Core\MergeTags\Abstracts\MergeTag;
use DoubleScale\Core\MergeTags\MergeTagsManager;
use DoubleScale\Modules\Contacts\Models\ContactModel;
use DoubleScale\Modules\Sales\Services\SalesEmailHtml;
use DoubleScale\Modules\Sales\Services\SalesEmailLegacyTokens;
use DoubleScale\Modules\Sales\Services\SalesEmailMergeTags;
use PHPUnit\Framework\TestCase;

defined( 'ABSPATH' ) || exit;

final class SalesEmailHtmlTest extends TestCase {

	protected function tearDown(): void {
		$this->reset_merge_tags_manager();
		parent::tearDown();
	}

	public function test_legacy_tokens_are_migrated_to_sales_merge_tags(): void {
		$migrated = SalesEmailLegacyTokens::migrate(
			'Proposal {subject} for {contact_name}',
			'proposal'
		);

		$this->assertSame(
			'Proposal {{sales:proposal_subject}} for {{sales:customer_name}}',
			$migrated
		);
	}

	public function test_resolve_template_replaces_sales_and_contact_merge_tags(): void {
		$manager = $this->fresh_merge_tags_manager();
		$manager->register(
			new class() extends MergeTag {
				public function __construct() {
					$this->group         = 'sales';
					$this->slug          = 'proposal_number';
					$this->name          = 'proposal_number';
					$this->is_automation = true;
				}

				public function get_value( $contact, $merge_tag = '' ) {
					unset( $contact, $merge_tag );
					return 'PR-100';
				}
			}
		);

		$contact       = new ContactModel();
		$contact->id   = 42;
		$contact->city = 'Cairo';
		$context       = SalesEmailMergeTags::context_from_contact( $contact, array( 'proposal_id' => 9 ) );
		$out           = SalesEmailHtml::resolve_template(
			'Ref {{sales:proposal_number}}',
			$context,
			'proposal'
		);

		$this->assertSame( 'Ref PR-100', $out );
	}

	public function test_for_document_builds_context_from_eloquent_like_models(): void {
		$contact       = new ContactModel();
		$contact->id   = 42;
		$contact->city = 'Cairo';

		$document = new class() {
			public $contact;

			private int $key = 7;

			public function loadMissing( string $relation ): void {
				unset( $relation );
			}

			public function getKey(): int {
				return $this->key;
			}

			public function __get( string $name ) {
				if ( 'id' === $name ) {
					return $this->key;
				}
				return null;
			}

			public function __isset( string $name ): bool {
				return 'id' === $name || 'contact' === $name;
			}
		};
		$document->contact = $contact;

		$context = SalesEmailMergeTags::for_document( $document, 'credit_note_id' );

		$this->assertSame( 7, (int) ( $context->data['credit_note_id'] ?? 0 ) );
		$this->assertSame( 42, (int) $context->contact_id );
		$this->assertTrue( $context->relationLoaded( 'contact' ) );
		$this->assertSame( 'Cairo', (string) $context->contact->city );
	}

	public function test_resolve_intro_html_replaces_contact_merge_tags(): void {
		$manager = $this->fresh_merge_tags_manager();
		$manager->register(
			new class() extends MergeTag {
				public function __construct() {
					$this->group         = 'contact';
					$this->slug          = 'city';
					$this->name          = 'city';
					$this->is_automation = false;
				}

				public function get_value( $contact, $merge_tag = '' ) {
					return $contact instanceof ContactModel ? (string) $contact->city : '';
				}
			}
		);

		$contact       = new ContactModel();
		$contact->id   = 42;
		$contact->city = 'Cairo';
		$context       = SalesEmailMergeTags::context_from_contact( $contact );
		$intro         = SalesEmailHtml::resolve_intro_html(
			'',
			'<p>Hello from {{contact:city}}</p>',
			'Fallback intro',
			$context,
			'proposal'
		);

		$this->assertStringContainsString( 'Cairo', $intro );
		$this->assertStringNotContainsString( '{{contact:city}}', $intro );
	}

	private function fresh_merge_tags_manager(): MergeTagsManager {
		$ref     = new \ReflectionClass( MergeTagsManager::class );
		$manager = $ref->newInstanceWithoutConstructor();

		$instance = $ref->getProperty( 'instance' );
		$instance->setAccessible( true );
		$instance->setValue( null, $manager );

		return $manager;
	}

	private function reset_merge_tags_manager(): void {
		$ref      = new \ReflectionClass( MergeTagsManager::class );
		$instance = $ref->getProperty( 'instance' );
		$instance->setAccessible( true );
		$instance->setValue( null, null );
	}
}
