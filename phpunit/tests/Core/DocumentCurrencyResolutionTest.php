<?php
/**
 * document_currency() NULL-means-inherit, regardless of sent_at.
 *
 * @package DoubleScale\Tests
 */

namespace DoubleScale\Tests\Core;

use DoubleScale\Core\Settings\Settings;
use DoubleScale\Core\Services\CurrencyResolver;
use PHPUnit\Framework\TestCase;

defined( 'ABSPATH' ) || exit;

final class DocumentCurrencyResolutionTest extends TestCase {

	protected function setUp(): void {
		parent::setUp();
		Settings::update( 'currency', array( 'currency' => 'EUR' ) );
	}

	public function test_null_and_empty_inherit_global_regardless_of_sent_at(): void {
		$this->assertSame( 'EUR', Settings::document_currency( null, null ) );
		$this->assertSame( 'EUR', Settings::document_currency( '', '2026-01-01 00:00:00' ) );
		$this->assertSame( 'EUR', Settings::document_currency( null, '2026-01-01 00:00:00' ) );
	}

	public function test_explicit_code_wins_regardless_of_sent_at(): void {
		$this->assertSame( 'USD', Settings::document_currency( 'USD', null ) );
		$this->assertSame( 'GBP', Settings::document_currency( 'GBP', '2026-01-01 00:00:00' ) );
	}

	public function test_resolver_groups_mixed_currencies_and_never_adds_them(): void {
		$records = array(
			(object) array( 'currency' => 'EUR', 'sent_at' => null, 'total' => 100 ),
			(object) array( 'currency' => 'USD', 'sent_at' => '2026-01-01', 'total' => 100 ),
			(object) array( 'currency' => null, 'sent_at' => null, 'total' => 50 ),
		);

		$totals = CurrencyResolver::sum_by_currency( $records, 'total' );

		$this->assertSame( array( 'EUR', 'USD' ), array_keys( $totals ) );
		$this->assertSame( 150.0, $totals['EUR'] );
		$this->assertSame( 100.0, $totals['USD'] );
		$this->assertArrayNotHasKey( 200, $totals );
	}
}
