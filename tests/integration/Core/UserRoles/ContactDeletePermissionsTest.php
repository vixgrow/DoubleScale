<?php
/**
 * Contact delete permission checks by CRM role.
 *
 * @package DoubleScale\Tests\Integration\Core\UserRoles
 */

namespace DoubleScale\Tests\Integration\Core\UserRoles;

use DoubleScale\Core\UserRoles\Permissions;
use DoubleScale\Core\UserRoles\UserRoles;
use DoubleScale\Tests\Integration\IntegrationTestCase;

final class ContactDeletePermissionsTest extends IntegrationTestCase {

	public function test_sales_rep_cannot_delete_contacts(): void {
		$user_id = self::factory()->user->create( array( 'role' => UserRoles::SALES_REP ) );

		$this->assertFalse( Permissions::can_delete_contacts( $user_id ) );
	}

	public function test_sales_rep_with_wp_administrator_cannot_delete_contacts(): void {
		$user_id = self::factory()->user->create( array( 'role' => 'administrator' ) );
		$user    = get_userdata( $user_id );
		$user->add_role( UserRoles::SALES_REP );

		$this->assertFalse( Permissions::can_delete_contacts( $user_id ) );
	}

	public function test_sales_manager_can_delete_contacts(): void {
		$user_id = self::factory()->user->create( array( 'role' => UserRoles::SALES_MANAGER ) );

		$this->assertTrue( Permissions::can_delete_contacts( $user_id ) );
	}

	public function test_crm_manager_can_delete_contacts(): void {
		$user_id = self::factory()->user->create( array( 'role' => UserRoles::CRM_MANAGER ) );

		$this->assertTrue( Permissions::can_delete_contacts( $user_id ) );
	}
}
