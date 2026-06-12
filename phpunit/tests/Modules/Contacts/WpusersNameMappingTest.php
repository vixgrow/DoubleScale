<?php
/**
 * Regression test for WordPress-users import name mapping.
 *
 * Bug: the WP users importer only mapped `email`, dropping first/last name.
 * Names live in wp_usermeta (not the wp_users row), so they must be hydrated
 * from user meta, with a display_name fallback when the meta is empty.
 *
 * @package DoubleScale\Tests\Modules\Contacts
 */

namespace DoubleScale\Modules\Contacts\ImportExport\Importers;

// Override get_user_meta inside the importer namespace so the unit test can
// drive the mapping without WordPress. Unqualified calls in Wpusers resolve to
// this before the global function.
if ( ! function_exists( __NAMESPACE__ . '\\get_user_meta' ) ) {
	/**
	 * @param int    $user_id User ID.
	 * @param string $key     Meta key.
	 * @param bool   $single  Single value.
	 * @return string
	 */
	function get_user_meta( $user_id, $key, $single = false ) {
		$store = isset( $GLOBALS['__doublescale_test_user_meta'] ) ? $GLOBALS['__doublescale_test_user_meta'] : array();
		return isset( $store[ $user_id ][ $key ] ) ? $store[ $user_id ][ $key ] : '';
	}
}

namespace DoubleScale\Tests\Modules\Contacts;

use DoubleScale\Modules\Contacts\ImportExport\Importers\Wpusers;
use PHPUnit\Framework\TestCase;

final class WpusersNameMappingTest extends TestCase {

	/**
	 * Invoke the (protected static) name hydration against a fake user row.
	 *
	 * @param array  $meta         Simulated user meta (first_name/last_name).
	 * @param string $display_name display_name column value.
	 * @return object The mutated user object.
	 */
	private function hydrate( array $meta, string $display_name ) {
		$user_id                                  = 7;
		$GLOBALS['__doublescale_test_user_meta'] = array( $user_id => $meta );
		$user                                     = (object) array(
			'ID'           => $user_id,
			'display_name' => $display_name,
		);

		$method = new \ReflectionMethod( Wpusers::class, 'hydrate_user_name' );
		$method->setAccessible( true );
		$method->invoke( null, $user );

		return $user;
	}

	public function test_maps_first_and_last_name_from_user_meta(): void {
		$user = $this->hydrate(
			array(
				'first_name' => 'Jane',
				'last_name'  => 'Doe',
			),
			'jane_d'
		);

		$this->assertSame( 'Jane', $user->first_name );
		$this->assertSame( 'Doe', $user->last_name );
	}

	public function test_falls_back_to_display_name_when_meta_is_empty(): void {
		$user = $this->hydrate( array(), 'Jane Doe' );

		$this->assertSame( 'Jane', $user->first_name );
		$this->assertSame( 'Doe', $user->last_name );
	}

	public function test_display_name_fallback_keeps_multiword_surname_together(): void {
		$user = $this->hydrate( array(), 'Jane Van Der Berg' );

		$this->assertSame( 'Jane', $user->first_name );
		$this->assertSame( 'Van Der Berg', $user->last_name );
	}

	public function test_single_word_display_name_sets_first_only(): void {
		$user = $this->hydrate( array(), 'Madonna' );

		$this->assertSame( 'Madonna', $user->first_name );
		$this->assertSame( '', $user->last_name );
	}

	public function test_present_first_name_meta_suppresses_display_name_fallback(): void {
		// Fallback only triggers when BOTH meta fields are empty.
		$user = $this->hydrate(
			array(
				'first_name' => 'Jane',
				'last_name'  => '',
			),
			'Should Not Be Used'
		);

		$this->assertSame( 'Jane', $user->first_name );
		$this->assertSame( '', $user->last_name );
	}
}
