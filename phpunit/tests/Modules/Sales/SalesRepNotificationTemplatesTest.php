<?php
/**
 * Tests for sales-rep notification template merge tags.
 *
 * @package DoubleScale\Tests\Modules\Sales
 */

namespace DoubleScale\Tests\Modules\Sales;

use DoubleScale\Core\MergeTags\Abstracts\MergeTag;
use DoubleScale\Core\MergeTags\MergeTagsManager;
use DoubleScale\Modules\Notifications\Services\NotificationCategories;
use DoubleScale\Modules\Sales\Services\SalesRepNotificationLegacyTokens;
use DoubleScale\Modules\Sales\Services\SalesRepNotificationTemplates;
use PHPUnit\Framework\TestCase;

defined( 'ABSPATH' ) || exit;

final class SalesRepNotificationTemplatesTest extends TestCase {

	protected function tearDown(): void {
		$this->reset_merge_tags_manager();
		parent::tearDown();
	}

	public function test_legacy_rep_tokens_are_migrated_to_sales_merge_tags(): void {
		$migrated = SalesRepNotificationLegacyTokens::migrate(
			'{event_label}: {contract_number} — {sales_link}'
		);

		$this->assertSame(
			'{{sales:event_label}}: {{sales:contract_number}} — {{sales:admin_link}}',
			$migrated
		);
	}

	public function test_render_resolves_sales_merge_tags_for_contract_context(): void {
		$manager = $this->fresh_merge_tags_manager();
		$this->register_contract_merge_tags( $manager );

		$contract = new class() {
			public int $id = 12;

			public string $contract_number = 'CON-000042';

			public string $subject = 'Annual support';

			public function loadMissing( string $relation ): void {
				unset( $relation );
			}

			public function getKey(): int {
				return $this->id;
			}

			public function __get( string $name ) {
				if ( 'id' === $name ) {
					return $this->id;
				}
				return null;
			}

			public function __isset( string $name ): bool {
				return 'id' === $name;
			}
		};

		$rendered = SalesRepNotificationTemplates::render(
			NotificationCategories::SALES_CONTRACT_SENT,
			array(
				'contract' => $contract,
				'event'    => 'sent',
			)
		);

		$this->assertSame( 'Contract sent to customer: CON-000042', $rendered['title'] );
		$this->assertSame( 'CON-000042 — Annual support', $rendered['message'] );
	}

	private function register_contract_merge_tags( MergeTagsManager $manager ): void {
		$manager->register(
			new class() extends MergeTag {
				public function __construct() {
					$this->group         = 'sales';
					$this->slug          = 'event_label';
					$this->name          = 'event_label';
					$this->is_automation = true;
				}

				public function get_value( $contact, $merge_tag = '' ) {
					unset( $merge_tag );
					return 'Contract sent to customer';
				}
			}
		);
		$manager->register(
			new class() extends MergeTag {
				public function __construct() {
					$this->group         = 'sales';
					$this->slug          = 'contract_number';
					$this->name          = 'contract_number';
					$this->is_automation = true;
				}

				public function get_value( $contact, $merge_tag = '' ) {
					unset( $contact, $merge_tag );
					return 'CON-000042';
				}
			}
		);
		$manager->register(
			new class() extends MergeTag {
				public function __construct() {
					$this->group         = 'sales';
					$this->slug          = 'contract_subject';
					$this->name          = 'contract_subject';
					$this->is_automation = true;
				}

				public function get_value( $contact, $merge_tag = '' ) {
					unset( $contact, $merge_tag );
					return 'Annual support';
				}
			}
		);
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
