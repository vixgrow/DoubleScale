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
		return array_merge(
			AbilityContext::definitions(),
			ContactAbilities::definitions(),
			DocumentAbilities::definitions(),
			SupportAbilities::definitions()
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
	 * Phase 1 is read-only. This asserts the contract at the definition layer
	 * so a later mutating ability cannot be added without a deliberate change
	 * here — the annotation is what tells an agent a call is safe to retry.
	 */
	public function test_no_definition_declares_a_destructive_annotation(): void {
		foreach ( $this->all_definitions() as $name => $definition ) {
			$annotations = $definition['meta']['annotations'] ?? array();
			$this->assertNotTrue(
				$annotations['destructive'] ?? false,
				$name . ' is destructive, but phase 1 ships read-only abilities only.'
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
