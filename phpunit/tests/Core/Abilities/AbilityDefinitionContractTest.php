<?php
/**
 * Contract every ability definition must satisfy before it reaches WP core.
 *
 * These are cheap structural assertions, but they guard failures that are
 * otherwise SILENT: WP core drops a bad name or an unregistered category by
 * returning null from register(), so a typo makes an ability simply vanish
 * rather than raise anything.
 *
 * @package DoubleScale\Tests
 */

namespace DoubleScale\Tests\Core\Abilities;

use DoubleScale\Core\Abilities\AbilityCategories;
use DoubleScale\Core\Abilities\AbilityContext;
use DoubleScale\Core\Abilities\AbilityRegistrar;
use DoubleScale\Modules\Activities\Abilities\ActivityAbilities;
use DoubleScale\Modules\Contacts\Abilities\ContactAbilities;
use DoubleScale\Modules\Documents\Abilities\DocumentAbilities;
use DoubleScale\Modules\Support\Abilities\SupportAbilities;
use PHPUnit\Framework\TestCase;

defined( 'ABSPATH' ) || exit;

final class AbilityDefinitionContractTest extends TestCase {

	/**
	 * Every definition shipped in phase 1, keyed by ability name.
	 *
	 * @return array<string, array<string, mixed>>
	 */
	private function all_definitions(): array {
		$definitions = array_merge(
			AbilityContext::definitions(),
			ContactAbilities::definitions(),
			DocumentAbilities::definitions(),
			SupportAbilities::definitions(),
			ActivityAbilities::definitions()
		);

		// Pro ability classes are discovered rather than imported: this suite
		// runs without Pro loaded, and a hardcoded list silently stops covering
		// new modules — which is exactly what happened when eight modules were
		// added and this contract kept passing against four.
		foreach ( self::pro_ability_classes() as $class ) {
			if ( class_exists( $class ) && method_exists( $class, 'definitions' ) ) {
				$definitions = array_merge( $definitions, $class::definitions() );
			}
		}

		return $definitions;
	}

	/**
	 * Fully-qualified Pro ability classes, if the Pro plugin is present.
	 *
	 * @return array<int, string>
	 */
	private static function pro_ability_classes(): array {
		return array(
			'DoubleScale\Pro\Modules\Deals\Abilities\DealAbilities',
			'DoubleScale\Pro\Modules\Tasks\Abilities\TaskAbilities',
			'DoubleScale\Pro\Modules\Projects\Abilities\ProjectAbilities',
			'DoubleScale\Pro\Modules\ProductCatalog\Abilities\ProductAbilities',
			'DoubleScale\Pro\Modules\Contracts\Abilities\ContractAbilities',
			'DoubleScale\Pro\Modules\CreditNotes\Abilities\CreditNoteAbilities',
			'DoubleScale\Pro\Modules\Analytics\Abilities\ReportAbilities',
		);
	}

	/**
	 * @return array<int, array{0: string, 1: array<string, mixed>}>
	 */
	public function definition_provider(): array {
		$out = array();
		foreach ( $this->all_definitions() as $name => $definition ) {
			$out[ $name ] = array( $name, $definition );
		}
		return $out;
	}

	/**
	 * WP core rejects anything else and returns null — the ability disappears
	 * with no exception. See class-wp-abilities-registry.php:81.
	 *
	 * @dataProvider definition_provider
	 *
	 * @param string               $name       Ability name.
	 * @param array<string, mixed> $definition Definition.
	 */
	public function test_name_matches_core_pattern( string $name, array $definition ): void {
		$this->assertMatchesRegularExpression(
			AbilityRegistrar::NAME_PATTERN,
			$name,
			$name . ' must be "namespace/ability-name": one slash, lowercase, dashes only.'
		);
		$this->assertSame( 0, strpos( $name, 'doublescale/' ), $name . ' must use the doublescale/ namespace.' );
		$this->assertIsArray( $definition );
	}

	/**
	 * @dataProvider definition_provider
	 *
	 * @param string               $name       Ability name.
	 * @param array<string, mixed> $definition Definition.
	 */
	public function test_has_required_keys( string $name, array $definition ): void {
		$this->assertArrayHasKey( 'module_slug', $definition, $name . ' needs a module_slug for the module gate.' );
		$this->assertNotSame( '', $definition['module_slug'], $name . ' has an empty module_slug.' );
		$this->assertArrayHasKey( 'label', $definition, $name . ' needs a label.' );
		$this->assertArrayHasKey( 'description', $definition, $name . ' needs a description.' );
		$this->assertIsCallable( $definition['execute_callback'], $name . ' needs a callable execute_callback.' );
	}

	/**
	 * A definition supplying its own permission_callback would bypass the AI
	 * access check and the module gate, so the Registrar refuses to honour it.
	 *
	 * @dataProvider definition_provider
	 *
	 * @param string               $name       Ability name.
	 * @param array<string, mixed> $definition Definition.
	 */
	public function test_does_not_define_its_own_permission_callback( string $name, array $definition ): void {
		$this->assertArrayNotHasKey(
			'permission_callback',
			$definition,
			$name . ' must use the "permission" key; permission_callback is composed by the Registrar.'
		);
	}

	/**
	 * Categories must exist before abilities register or WP drops them.
	 *
	 * @dataProvider definition_provider
	 *
	 * @param string               $name       Ability name.
	 * @param array<string, mixed> $definition Definition.
	 */
	public function test_category_is_registered( string $name, array $definition ): void {
		$category = $definition['category'] ?? AbilityCategories::slug_for_module( (string) $definition['module_slug'] );

		$this->assertArrayHasKey(
			$category,
			AbilityCategories::catalog(),
			$name . ' references category "' . $category . '" which is not in the catalog.'
		);
	}

	/**
	 * Sales documents live in the `documents` module. Gating on the `sales`
	 * parent would wrongly keep abilities alive for a child the user turned
	 * off — the parent state is already folded into the child's flag.
	 */
	public function test_sales_abilities_gate_on_the_leaf_slug(): void {
		foreach ( DocumentAbilities::definitions() as $name => $definition ) {
			$this->assertSame(
				'documents',
				$definition['module_slug'],
				$name . ' must gate on the leaf slug "documents", never the "sales" parent.'
			);
		}
	}

	/**
	 * Writes must declare themselves.
	 *
	 * The registrar defaults every ability to `readonly: true`, which is the
	 * safe value for an author who forgets. That same default is dangerous on a
	 * mutating ability: annotations are how an agent decides whether a call is
	 * safe to make and safe to retry, so a write inheriting `readonly: true`
	 * invites duplicate writes after a timeout.
	 *
	 * A definition therefore may not be silently read-only if it mutates: it
	 * must set `readonly` explicitly, either way.
	 */
	public function test_mutating_abilities_declare_their_annotations(): void {
		foreach ( $this->all_definitions() as $name => $definition ) {
			$annotations = $definition['meta']['annotations'] ?? array();

			// A definition that says nothing is treated as read-only, which is
			// only correct if its callback does not mutate. Names are the
			// cheapest reliable signal we have at the definition layer.
			$looks_mutating = (bool) preg_match(
				'#/(create|update|add|log|delete|remove|move|send|set)-#',
				$name
			);

			if ( ! $looks_mutating ) {
				continue;
			}

			$this->assertArrayHasKey(
				'readonly',
				$annotations,
				$name . ' looks like a write but declares no readonly annotation; it would silently inherit readonly:true.'
			);
			$this->assertFalse(
				$annotations['readonly'],
				$name . ' looks like a write but is annotated readonly:true.'
			);
		}
	}

	/**
	 * Anything that is NOT a write must still be genuinely read-only, so the
	 * default can never be quietly widened for a read ability.
	 */
	public function test_read_abilities_are_never_destructive(): void {
		foreach ( $this->all_definitions() as $name => $definition ) {
			$annotations = $definition['meta']['annotations'] ?? array();

			if ( false === ( $annotations['readonly'] ?? true ) ) {
				continue; // Declared write — covered by the test above.
			}

			$this->assertNotTrue(
				$annotations['destructive'] ?? false,
				$name . ' is annotated read-only but also destructive.'
			);
		}
	}

	public function test_names_are_unique_across_modules(): void {
		$names = array_merge(
			array_keys( AbilityContext::definitions() ),
			array_keys( ContactAbilities::definitions() ),
			array_keys( DocumentAbilities::definitions() ),
			array_keys( SupportAbilities::definitions() )
		);

		$this->assertSame(
			count( $names ),
			count( array_unique( $names ) ),
			'Duplicate ability names: WP core silently drops the second registration.'
		);
	}

	/**
	 * Advertising an enum value the data never stores makes an agent filter to
	 * an empty result and report "none found" as though it were a fact.
	 */
	public function test_contact_status_enum_matches_stored_vocabulary(): void {
		$definitions = ContactAbilities::definitions();
		$enum        = $definitions['doublescale/list-contacts']['input_schema']['properties']['status']['enum'];

		$this->assertSame( ContactAbilities::EMAIL_STATUSES, $enum );
		$this->assertContains( 'unverified', $enum, 'The contacts table stores "unverified".' );
	}
}
