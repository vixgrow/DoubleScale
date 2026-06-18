<?php
/**
 * The Free invoice model must carry the `subscription_id` link so Pro's
 * Subscriptions module can attach a child invoice per recurring charge. The
 * column is inert when Pro is absent.
 *
 * @package DoubleScale\Tests
 */

namespace DoubleScale\Tests\Modules\Documents;

use DoubleScale\Modules\Documents\Models\InvoiceModel;
use PHPUnit\Framework\TestCase;

defined( 'ABSPATH' ) || exit;

final class InvoiceSubscriptionLinkTest extends TestCase {

	public function test_subscription_id_is_fillable(): void {
		$invoice = new InvoiceModel();

		$this->assertContains(
			'subscription_id',
			$invoice->getFillable(),
			'subscription_id must be mass-assignable so renewals can link a child invoice'
		);
	}

	public function test_subscription_relation_method_exists(): void {
		$this->assertTrue(
			method_exists( InvoiceModel::class, 'subscription' ),
			'InvoiceModel must expose a subscription() relation'
		);
	}
}
