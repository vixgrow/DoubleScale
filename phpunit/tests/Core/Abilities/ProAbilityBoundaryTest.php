<?php
/**
 * Pro must not hard-depend on free symbols at parse time.
 *
 * Pro and free ship and update separately, so a site can run new Pro against an
 * older free at any moment. `implements SomeFreeInterface` in a Pro class is
 * resolved when PHP *loads* the class — before any version check, capability
 * gate, or `class_exists()` guard can run — so an interface that only exists in
 * newer free takes the whole site down with a fatal on wp-admin.
 *
 * That is exactly what happened: seven Pro modules declared
 * `implements ProvidesAbilities`, and a site updating Pro first got
 * "Interface DoubleScale\Core\Abilities\ProvidesAbilities not found" on every
 * page load.
 *
 * The registrar detects ability modules by METHOD instead, so Pro contributes
 * abilities without naming the interface at all.
 *
 * @package DoubleScale\Tests
 */

namespace DoubleScale\Tests\Core\Abilities;

use PHPUnit\Framework\TestCase;

defined( 'ABSPATH' ) || exit;

final class ProAbilityBoundaryTest extends TestCase {

	/**
	 * Free symbols introduced by the abilities layer. A Pro class naming any of
	 * these in its declaration is a fatal on an older free plugin.
	 *
	 * @var array<int, string>
	 */
	private const FREE_ONLY_SYMBOLS = array(
		'ProvidesAbilities',
	);

	/**
	 * @return string
	 */
	private static function pro_modules_dir(): string {
		return dirname( DOUBLESCALE_PLUGIN_DIR ) . '/doublescale-pro/includes/Modules';
	}

	/**
	 * @return array<string, array{0: string}>
	 */
	public function pro_class_provider(): array {
		$dir = self::pro_modules_dir();

		if ( ! is_dir( $dir ) ) {
			return array( 'pro-not-installed' => array( '' ) );
		}

		$cases = array();

		foreach ( glob( $dir . '/*/*.php' ) ?: array() as $file ) {
			$cases[ basename( dirname( $file ) ) . '/' . basename( $file ) ] = array( $file );
		}

		foreach ( glob( $dir . '/*/Abilities/*.php' ) ?: array() as $file ) {
			$cases[ basename( dirname( dirname( $file ) ) ) . '/Abilities/' . basename( $file ) ] = array( $file );
		}

		return $cases ?: array( 'no-files' => array( '' ) );
	}

	/**
	 * @dataProvider pro_class_provider
	 *
	 * @param string $file Absolute path, or '' when Pro is absent.
	 */
	public function test_pro_class_does_not_extend_or_implement_a_new_free_symbol( string $file ): void {
		if ( '' === $file ) {
			$this->markTestSkipped( 'Pro plugin is not installed in this environment.' );
		}

		$source = (string) file_get_contents( $file );

		foreach ( self::FREE_ONLY_SYMBOLS as $symbol ) {
			// Only the class declaration matters. A `use` alias or a docblock
			// mention is resolved lazily and never fatals on load.
			$this->assertDoesNotMatchRegularExpression(
				'/(?:implements|extends)[^{]*\b' . preg_quote( $symbol, '/' ) . '\b/',
				$source,
				basename( $file ) . ' names "' . $symbol . '" in its class declaration. That symbol'
					. ' only exists in newer free, so this fatals on a site that updates Pro first.'
					. ' Drop the clause — AbilityRegistrar::provides_abilities() detects the'
					. ' abilities() method instead.'
			);
		}
	}

	/**
	 * Duck typing is the mechanism that makes the above safe, so it has to
	 * actually work — otherwise the boundary is clean and the feature is dead.
	 */
	public function test_registrar_detects_an_ability_module_without_the_interface(): void {
		require_once DOUBLESCALE_PLUGIN_DIR . 'includes/Core/Abilities/AbilityRegistrar.php';

		$module = new class() {
			/**
			 * @return array<string, array<string, mixed>>
			 */
			public function abilities(): array {
				return array( 'doublescale/example' => array() );
			}
		};

		$this->assertTrue(
			\DoubleScale\Core\Abilities\AbilityRegistrar::provides_abilities( $module ),
			'A module declaring abilities() must be detected without implementing the interface.'
		);

		$this->assertFalse(
			\DoubleScale\Core\Abilities\AbilityRegistrar::provides_abilities( new \stdClass() ),
			'A module without abilities() must not be treated as contributing abilities.'
		);
	}

	/**
	 * Pro still has to contribute — a clean boundary that lost the abilities
	 * would pass every assertion above.
	 */
	public function test_pro_modules_still_declare_abilities(): void {
		$dir = self::pro_modules_dir();

		if ( ! is_dir( $dir ) ) {
			$this->markTestSkipped( 'Pro plugin is not installed in this environment.' );
		}

		$with = 0;
		foreach ( glob( $dir . '/*/Module.php' ) ?: array() as $file ) {
			if ( preg_match( '/function abilities\(\)/', (string) file_get_contents( $file ) ) ) {
				++$with;
			}
		}

		$this->assertGreaterThanOrEqual(
			7,
			$with,
			'Expected the Pro ability modules to still declare abilities().'
		);
	}
}
