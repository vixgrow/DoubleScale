<?php
/**
 * Payload shape for the nested parent/child module toggles: `setting_enabled`
 * (stored intent without the parent gate) on every row, the phantom `deals`
 * row nesting under `sales` via its dependencies, and the child default-on
 * semantics of {@see doublescale_phantom_module_is_enabled()}.
 *
 * @package DoubleScale\Tests
 */

namespace DoubleScale\Tests\Core;

use DoubleScale\Core\AbstractModule;
use DoubleScale\Core\ModuleRequestCache;
use PHPUnit\Framework\TestCase;

defined( 'ABSPATH' ) || exit;

final class ModulesPayloadChildToggleTest extends TestCase {

	public static function setUpBeforeClass(): void {
		parent::setUpBeforeClass();
		require_once DOUBLESCALE_PLUGIN_DIR . 'includes/Core/ModuleRequestCache.php';
		require_once DOUBLESCALE_PLUGIN_DIR . 'includes/Core/ModuleFeatureGate.php';
	}

	protected function setUp(): void {
		parent::setUp();
		$GLOBALS['__doublescale_phpunit_options'] = array();
		ModuleRequestCache::flush();
	}

	protected function tearDown(): void {
		$GLOBALS['__doublescale_phpunit_options'] = array();
		ModuleRequestCache::flush();
		parent::tearDown();
	}

	private function set_stored_modules( array $stored ): void {
		$GLOBALS['__doublescale_phpunit_options']['doublescale_enabled_modules'] = $stored;
		ModuleRequestCache::flush();
	}

	private function make_module( string $slug, bool $toggleable = true ): AbstractModule {
		return new class( $slug, $toggleable ) extends AbstractModule {
			/** @var string */
			private $test_slug;
			/** @var bool */
			private $test_toggleable;

			public function __construct( string $slug, bool $toggleable ) {
				$this->test_slug       = $slug;
				$this->test_toggleable = $toggleable;
			}

			public function slug(): string {
				return $this->test_slug;
			}

			public function is_toggleable(): bool {
				return $this->test_toggleable;
			}
		};
	}

	/**
	 * @param array<int, array<string, mixed>> $payload
	 * @return array<string, mixed>|null
	 */
	private function row( array $payload, string $slug ): ?array {
		foreach ( $payload as $row ) {
			if ( $slug === $row['slug'] ) {
				return $row;
			}
		}

		return null;
	}

	public function test_every_row_exposes_setting_enabled(): void {
		$this->set_stored_modules( array( 'sales' => true ) );

		$payload = doublescale_build_modules_list_payload(
			array( 'sales' => $this->make_module( 'sales' ) )
		);

		foreach ( $payload as $row ) {
			$this->assertArrayHasKey( 'setting_enabled', $row, 'Row missing setting_enabled: ' . $row['slug'] );
			$this->assertIsBool( $row['setting_enabled'] );
		}
	}

	public function test_phantom_deals_row_nests_under_sales(): void {
		$this->set_stored_modules( array( 'sales' => true ) );

		$payload = doublescale_build_modules_list_payload(
			array( 'sales' => $this->make_module( 'sales' ) )
		);

		$deals = $this->row( $payload, 'deals' );
		$this->assertNotNull( $deals, 'Phantom deals row must be present without Pro' );
		$this->assertContains( 'sales', $deals['dependencies'], 'Phantom deals row must declare the sales parent' );
		$this->assertTrue( $deals['is_toggleable'] );
	}

	public function test_child_defaults_on_when_parent_on_and_key_absent(): void {
		$this->set_stored_modules( array( 'sales' => true ) );

		$payload = doublescale_build_modules_list_payload(
			array( 'sales' => $this->make_module( 'sales' ) )
		);

		$deals = $this->row( $payload, 'deals' );
		$this->assertTrue( $deals['setting_enabled'], 'Child intent defaults to on' );
		$this->assertTrue( $deals['enabled'], 'Child follows the parent by default' );
	}

	public function test_child_off_when_parent_off_but_intent_preserved(): void {
		$this->set_stored_modules( array( 'deals' => true ) );

		$payload = doublescale_build_modules_list_payload(
			array( 'sales' => $this->make_module( 'sales' ) )
		);

		$sales = $this->row( $payload, 'sales' );
		$deals = $this->row( $payload, 'deals' );

		$this->assertFalse( $sales['enabled'] );
		$this->assertFalse( $deals['enabled'], 'Parent off forces the child effective state off' );
		$this->assertTrue( $deals['setting_enabled'], 'Stored child intent survives the parent being off' );
	}

	public function test_explicit_child_opt_out_wins_over_default(): void {
		$this->set_stored_modules(
			array(
				'sales' => true,
				'deals' => false,
			)
		);

		$payload = doublescale_build_modules_list_payload(
			array( 'sales' => $this->make_module( 'sales' ) )
		);

		$deals = $this->row( $payload, 'deals' );
		$this->assertFalse( $deals['enabled'] );
		$this->assertFalse( $deals['setting_enabled'] );
	}

	public function test_non_child_toggleable_still_defaults_off(): void {
		$this->set_stored_modules( array() );

		$payload = doublescale_build_modules_list_payload(
			array( 'campaigns' => $this->make_module( 'campaigns' ) )
		);

		$campaigns = $this->row( $payload, 'campaigns' );
		$this->assertFalse( $campaigns['enabled'] );
		$this->assertFalse( $campaigns['setting_enabled'], 'Default-on is exclusive to child modules' );

		$inbox = $this->row( $payload, 'inbox' );
		$this->assertNotNull( $inbox );
		$this->assertFalse( $inbox['setting_enabled'], 'Phantom non-child slugs keep the default-off contract' );
	}

	public function test_child_module_parent_map_lists_deals_under_sales(): void {
		$this->assertSame( array( 'deals' => 'sales' ), doublescale_child_module_parent_map() );
	}
}
