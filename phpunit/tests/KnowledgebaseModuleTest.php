<?php
/**
 * Knowledge Base module shape + visibility-resolver coverage.
 *
 * Pure-PHP assertions only (no register_post_type / DB) — this matches the
 * minimal phpunit bootstrap and proves the module discovers, declares the right
 * slug/deps/controllers, and that the single visibility resolver ranks levels
 * most-restrictive-wins.
 *
 * @package DoubleScale\Tests
 */

namespace DoubleScale\Tests;

use DoubleScale\Modules\Knowledgebase\Module;
use DoubleScale\Modules\Knowledgebase\Services\KnowledgebaseSettings;
use DoubleScale\Modules\Knowledgebase\Services\Visibility;
use PHPUnit\Framework\TestCase;

defined( 'ABSPATH' ) || exit;

/**
 * @group smoke
 */
final class KnowledgebaseModuleTest extends TestCase {

	public function test_module_metadata(): void {
		$module = new Module();

		$this->assertSame( 'knowledgebase', $module->slug() );
		$this->assertTrue( $module->is_toggleable(), 'KB must be toggleable so it renders in Settings → Modules.' );
		$this->assertSame(
			array( 'core', 'contacts', 'activities' ),
			$module->dependencies(),
			'Tier-3 tracking needs contacts + activities (both always-on foundations).'
		);
	}

	public function test_module_registers_four_controllers(): void {
		$controllers = ( new Module() )->restControllers();

		$this->assertCount( 4, $controllers );
		foreach ( $controllers as $class ) {
			$this->assertTrue( class_exists( $class ), "REST controller must exist: {$class}" );
		}
	}

	public function test_visibility_ranks_most_restrictive_wins(): void {
		$this->assertSame( 0, Visibility::rank( Visibility::PUBLIC ) );
		$this->assertSame( 1, Visibility::rank( Visibility::MEMBERS ) );
		$this->assertSame( 2, Visibility::rank( Visibility::INTERNAL ) );

		$this->assertSame( Visibility::INTERNAL, Visibility::most_restrictive( Visibility::PUBLIC, Visibility::INTERNAL ) );
		$this->assertSame( Visibility::MEMBERS, Visibility::most_restrictive( Visibility::MEMBERS, Visibility::PUBLIC ) );
		$this->assertSame( Visibility::PUBLIC, Visibility::normalize( 'nonsense' ) );
		$this->assertSame( Visibility::MEMBERS, Visibility::normalize( 'members' ) );
	}

	public function test_settings_defaults_are_complete_and_safe(): void {
		$defaults = KnowledgebaseSettings::defaults();

		$this->assertSame( 'public', $defaults['public_access'] );
		$this->assertSame( 12, $defaults['articles_per_page'] );
		$this->assertTrue( $defaults['track_contact_views'] );
		$this->assertSame( '', $defaults['restricted_redirect_url'] );
		$this->assertCount( 11, $defaults, 'Eleven v1 settings, all defaulted so the module works untouched.' );
	}
}
