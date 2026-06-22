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
use DoubleScale\Modules\Sales\Services\SalesEmailMergeTags;
use PHPUnit\Framework\TestCase;

defined( 'ABSPATH' ) || exit;

final class SalesEmailHtmlTest extends TestCase {

	protected function tearDown(): void {
		$this->reset_merge_tags_manager();
		parent::tearDown();
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
			array(),
			'Fallback intro',
			$context
		);

		$this->assertStringContainsString( 'Cairo', $intro );
		$this->assertStringNotContainsString( '{{contact:city}}', $intro );
	}

	public function test_resolve_intro_html_applies_legacy_tokens_before_merge_tags(): void {
		$manager = $this->fresh_merge_tags_manager();
		$manager->register(
			new class() extends MergeTag {
				public function __construct() {
					$this->group         = 'contact';
					$this->slug          = 'email';
					$this->name          = 'email';
					$this->is_automation = false;
				}

				public function get_value( $contact, $merge_tag = '' ) {
					return $contact instanceof ContactModel ? (string) $contact->email : '';
				}
			}
		);

		$contact        = new ContactModel();
		$contact->id    = 7;
		$contact->email = 'jane@example.test';
		$context        = SalesEmailMergeTags::context_from_contact( $contact );
		$intro          = SalesEmailHtml::resolve_intro_html(
			'',
			'<p>Ref {proposal_number} for {{contact:email}}</p>',
			array( 'proposal_number' => 'PR-100' ),
			'Fallback intro',
			$context
		);

		$this->assertStringContainsString( 'PR-100', $intro );
		$this->assertStringContainsString( 'jane@example.test', $intro );
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
