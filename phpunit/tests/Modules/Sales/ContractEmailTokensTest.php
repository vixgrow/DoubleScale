<?php
/**
 * Contract email token helpers.
 *
 * @package DoubleScale\Tests\Modules\Sales
 */

namespace DoubleScale\Tests\Modules\Sales;

use DoubleScale\Modules\Sales\Models\ContractModel;
use DoubleScale\Modules\Sales\Services\SalesEmailTokens;
use PHPUnit\Framework\TestCase;

/**
 * @group smoke
 */
final class ContractEmailTokensTest extends TestCase {

	public function test_for_contract_includes_number_subject_and_link(): void {
		$contract = new ContractModel();
		$contract->forceFill(
			array(
				'contract_number' => 'CON-000042',
				'subject'         => 'Support agreement',
				'contract_value'  => 1500.0,
				'currency'        => 'USD',
				'end_date'        => '2026-12-31',
			)
		);
		$contract->setRelation( 'contact', null );

		$url    = 'http://example.test/contract/?hash=abc';
		$tokens = SalesEmailTokens::for_contract( $contract, $url );

		$this->assertSame( 'CON-000042', $tokens['contract_number'] );
		$this->assertSame( 'Support agreement', $tokens['subject'] );
		$this->assertSame( $url, $tokens['contract_link'] );
		$this->assertStringContainsString( '1,500.00', $tokens['contract_value'] );
		$this->assertSame( '2026-12-31', $tokens['end_date'] );
	}

	public function test_replace_substitutes_token_placeholders(): void {
		$text = 'Hello {contact_name}, view {contract_link}';
		$out  = SalesEmailTokens::replace(
			$text,
			array(
				'contact_name'  => 'Jane',
				'contract_link' => 'http://example.test/c',
			)
		);

		$this->assertSame( 'Hello Jane, view http://example.test/c', $out );
	}
}
