<?php
/**
 * Contact identifier rules: email or phone required; WhatsApp is optional.
 *
 * @package DoubleScale\Tests\Modules\Contacts
 */

namespace DoubleScale\Tests\Modules\Contacts;

use DoubleScale\Modules\Contacts\Models\ContactModel;
use PHPUnit\Framework\TestCase;

defined( 'ABSPATH' ) || exit;

final class ContactIdentifierTest extends TestCase {

	public function test_email_alone_is_enough(): void {
		$this->assertTrue( ContactModel::has_identifier( 'a@example.test', '', '+12025551234' ) );
		$this->assertTrue( ContactModel::has_identifier( 'a@example.test' ) );
	}

	public function test_phone_alone_is_enough(): void {
		$this->assertTrue( ContactModel::has_identifier( '', '+12025551234' ) );
	}

	public function test_whatsapp_alone_is_not_enough(): void {
		$this->assertFalse( ContactModel::has_identifier( '', '', '+12025551234' ) );
	}

	public function test_empty_whatsapp_normalizes_to_null_so_it_can_be_cleared(): void {
		$normalized = ContactModel::normalize_contact_data(
			array(
				'email'          => 'a@example.test',
				'whatsapp_phone' => '',
			)
		);

		$this->assertArrayHasKey( 'whatsapp_phone', $normalized );
		$this->assertNull( $normalized['whatsapp_phone'] );
	}

	public function test_empty_phone_normalizes_to_null_so_it_can_be_cleared(): void {
		$normalized = ContactModel::normalize_contact_data(
			array(
				'email' => 'a@example.test',
				'phone' => '',
			)
		);

		$this->assertArrayHasKey( 'phone', $normalized );
		$this->assertNull( $normalized['phone'] );
	}

	public function test_valid_whatsapp_is_kept(): void {
		$normalized = ContactModel::normalize_contact_data(
			array(
				'email'          => 'a@example.test',
				'whatsapp_phone' => '+12025551234',
			)
		);

		$this->assertSame( '+12025551234', $normalized['whatsapp_phone'] );
	}

	public function test_omitted_whatsapp_is_not_forced_into_the_payload(): void {
		$normalized = ContactModel::normalize_contact_data(
			array(
				'email' => 'a@example.test',
			)
		);

		$this->assertArrayNotHasKey( 'whatsapp_phone', $normalized );
	}
}
