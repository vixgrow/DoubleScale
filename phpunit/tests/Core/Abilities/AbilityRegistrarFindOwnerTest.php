<?php
/**
 * Ownership lookup for tools whose module is no longer registered.
 *
 * @package DoubleScale\Tests
 */

namespace DoubleScale\Tests\Core\Abilities;

use DoubleScale\Core\Abilities\AbilityRegistrar;
use DoubleScale\Core\Abilities\ProvidesAbilities;
use DoubleScale\Modules\Support\Abilities\SupportAbilities;
use PHPUnit\Framework\TestCase;

defined( 'ABSPATH' ) || exit;

final class AbilityRegistrarFindOwnerTest extends TestCase {

	public function test_find_owner_among_resolves_support_tools(): void {
		$module = new class() implements ProvidesAbilities {
			public function abilities(): array {
				return SupportAbilities::definitions();
			}

			public function label(): string {
				return 'Helpdesk';
			}
		};

		$owner = AbilityRegistrar::find_owner_among(
			'doublescale/list-tickets',
			array( 'support' => $module )
		);

		$this->assertNotNull( $owner );
		$this->assertSame( 'support', $owner['module_slug'] );
		$this->assertSame( 'Helpdesk', $owner['module_label'] );
	}

	public function test_find_owner_among_returns_null_for_unknown_tools(): void {
		$this->assertNull(
			AbilityRegistrar::find_owner_among( 'doublescale/no-such-tool', array() )
		);
	}

	public function test_find_owner_among_resolves_core_context(): void {
		$owner = AbilityRegistrar::find_owner_among( 'doublescale/get-context', array() );

		$this->assertNotNull( $owner );
		$this->assertSame( 'core', $owner['module_slug'] );
	}
}
