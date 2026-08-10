<?php
/**
 * {{order:cross_sell}} guard behaviour.
 *
 * The tag used to call methods straight on wc_get_order() and on each line
 * item's product, so a missing order or a deleted product fataled and took the
 * whole email down with it.
 *
 * WooCommerce is not loaded in the integration bootstrap, so these cover the
 * guards that run before any WC object is touched. The cross-sell collection
 * itself needs a WooCommerce-enabled environment to exercise end to end.
 *
 * @package DoubleScale\Tests\Integration
 */

namespace DoubleScale\Tests\Integration\Modules\Emails;

use DoubleScale\Modules\Automations\MergeTags\Woocommerce\Order\OrderCrossSell;
use DoubleScale\Tests\Integration\IntegrationTestCase;

/**
 * @group emails
 */
final class OrderCrossSellTagTest extends IntegrationTestCase {

	/**
	 * A contact carrying no order_id must yield an empty string, not a fatal.
	 */
	public function test_returns_empty_when_contact_has_no_order_id(): void {
		$tag = new OrderCrossSell();

		$contact = new class() {
			/**
			 * @param string $key     Key.
			 * @param mixed  $default Default.
			 * @return mixed
			 */
			public function get_data( $key, $default = null ) {
				return null;
			}
		};

		$this->assertSame( '', $tag->get_value( $contact ) );
	}

	/**
	 * Campaign sends pass a plain contact with no order context at all.
	 */
	public function test_returns_empty_for_a_contact_without_get_data(): void {
		$tag = new OrderCrossSell();

		$this->assertSame( '', $tag->get_value( new \stdClass() ) );
	}

	public function test_returns_empty_for_null_contact(): void {
		$tag = new OrderCrossSell();

		$this->assertSame( '', $tag->get_value( null ) );
	}

	/**
	 * An order id that no longer resolves (deleted/trashed) must be tolerated.
	 */
	public function test_returns_empty_for_an_unresolvable_order(): void {
		$tag = new OrderCrossSell();

		$contact = new class() {
			/**
			 * @param string $key     Key.
			 * @param mixed  $default Default.
			 * @return mixed
			 */
			public function get_data( $key, $default = null ) {
				return 999999; // No such order.
			}
		};

		$this->assertSame( '', $tag->get_value( $contact ) );
	}
}
