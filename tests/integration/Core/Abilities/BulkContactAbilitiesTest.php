<?php
/**
 * Integration tests for bulk contact write abilities.
 *
 * @package DoubleScale\Tests\Integration\Core\Abilities
 */

namespace DoubleScale\Tests\Integration\Core\Abilities;

use DoubleScale\Core\Abilities\AbilityBulk;
use DoubleScale\Core\Abilities\AbilityGuard;
use DoubleScale\Core\UserRoles\UserRoles;
use DoubleScale\Modules\Contacts\Abilities\ContactAbilities;
use DoubleScale\Modules\Contacts\Models\ContactModel;
use DoubleScale\Tests\Integration\IntegrationTestCase;

final class BulkContactAbilitiesTest extends IntegrationTestCase {

	/**
	 * Mails intercepted during a test, newest last.
	 *
	 * @var array<int, array<string, mixed>>
	 */
	private static $sent_mail = array();

	/**
	 * Write-audit fires captured during a test.
	 *
	 * @var array<int, array<string, mixed>>
	 */
	private static $write_fires = array();

	/**
	 * Per-row bulk item fires captured during a test.
	 *
	 * @var array<int, array<string, mixed>>
	 */
	private static $item_fires = array();

	protected function setUp(): void {
		parent::setUp();

		self::$sent_mail   = array();
		self::$write_fires = array();
		self::$item_fires  = array();

		add_filter(
			'pre_wp_mail',
			static function ( $short_circuit, $atts ) {
				self::$sent_mail[] = (array) $atts;
				return true;
			},
			10,
			2
		);

		add_action(
			'doublescale_ability_write',
			static function ( $name, $input, $result ) {
				self::$write_fires[] = array(
					'name'   => $name,
					'input'  => $input,
					'result' => $result,
				);
			},
			10,
			3
		);

		add_action(
			'doublescale_ability_bulk_item',
			static function ( $name, $index, $result, $batch_id ) {
				self::$item_fires[] = array(
					'name'     => $name,
					'index'    => $index,
					'result'   => $result,
					'batch_id' => $batch_id,
				);
			},
			10,
			4
		);

		$this->allow_ai_for( array( UserRoles::SALES_REP, UserRoles::SALES_MANAGER ) );

		$user_id = self::factory()->user->create( array( 'role' => UserRoles::SALES_REP ) );
		wp_set_current_user( $user_id );
	}

	protected function tearDown(): void {
		self::$sent_mail   = array();
		self::$write_fires = array();
		self::$item_fires  = array();
		parent::tearDown();
	}

	/**
	 * Put a set of roles on the AI allow-list the ability gate consults.
	 *
	 * @param array<int, string> $roles Roles to permit.
	 * @return void
	 */
	private function allow_ai_for( array $roles ): void {
		$settings = (array) get_option( 'doublescale_settings', array() );

		$settings['ai'] = array_merge(
			(array) ( $settings['ai'] ?? array() ),
			array(
				'access' => array(
					'enabled'       => true,
					'allowed_roles' => array_merge( array( UserRoles::ADMINISTRATOR ), $roles ),
				),
			)
		);

		update_option( 'doublescale_settings', $settings );
	}

	/**
	 * Run create-contacts-bulk through the write wrapper so the audit hook fires.
	 *
	 * @param array<string, mixed> $input Ability input.
	 * @return array<string, mixed>|\WP_Error
	 */
	private function run_create_bulk( array $input ) {
		$wrapped = AbilityGuard::wrap_execute(
			'doublescale/create-contacts-bulk',
			array( ContactAbilities::class, 'create_contacts_bulk' )
		);

		return $wrapped( $input );
	}

	/**
	 * @param string $suffix Unique email suffix.
	 * @return int
	 */
	private function count_contacts_with_suffix( string $suffix ): int {
		return (int) ContactModel::query()->where( 'email', 'LIKE', '%+' . $suffix . '@example.test' )->count();
	}

	public function test_happy_path_creates_every_row(): void {
		$suffix = wp_generate_password( 8, false, false );

		$result = $this->run_create_bulk(
			array(
				'contacts' => array(
					array(
						'email'      => 'ada+' . $suffix . '@example.test',
						'first_name' => 'Ada',
					),
					array(
						'email'      => 'grace+' . $suffix . '@example.test',
						'first_name' => 'Grace',
					),
				),
			)
		);

		$this->assertIsArray( $result );
		$this->assertSame( 2, $result['created'] );
		$this->assertSame( 0, $result['failed'] );
		$this->assertFalse( $result['partial'] );
		$this->assertSame( 2, $this->count_contacts_with_suffix( $suffix ) );
		$this->assertSame( array(), self::$sent_mail, 'Creating contacts must not send mail.' );
	}

	/**
	 * Distinguishes real partial success from a rollback: two of three rows
	 * persist. Kills `continue` → `break` and a wrapping transaction.
	 */
	public function test_partial_success_keeps_the_valid_rows(): void {
		$suffix = wp_generate_password( 8, false, false );

		$result = $this->run_create_bulk(
			array(
				'contacts' => array(
					array( 'email' => 'ok-a+' . $suffix . '@example.test' ),
					array( 'email' => 'not-an-email' ),
					array( 'email' => 'ok-b+' . $suffix . '@example.test' ),
				),
			)
		);

		$this->assertIsArray( $result );
		$this->assertSame( 2, $result['created'] );
		$this->assertSame( 1, $result['failed'] );
		$this->assertTrue( $result['partial'] );
		$this->assertSame( 'doublescale_invalid_email', $result['errors'][0]['code'] );
		$this->assertSame( 2, $this->count_contacts_with_suffix( $suffix ) );
		$this->assertSame( array(), self::$sent_mail );
	}

	/**
	 * Mixed-case duplicate must not produce two DB rows. Kills a seen-set keyed
	 * on normalize_email() (trim only) and dropping the seen-set entirely.
	 */
	public function test_intra_batch_duplicate_mixed_case_writes_one_row(): void {
		$suffix = wp_generate_password( 8, false, false );
		$local  = 'Ada+' . $suffix;

		$result = $this->run_create_bulk(
			array(
				'contacts' => array(
					array( 'email' => $local . '@example.test' ),
					array( 'email' => strtolower( $local ) . '@example.test' ),
				),
			)
		);

		$this->assertIsArray( $result );
		$this->assertSame( 1, $result['created'] );
		$this->assertSame( 1, $result['failed'] );
		$this->assertSame( 'doublescale_duplicate_in_batch', $result['errors'][0]['code'] );
		$this->assertSame( 0, $result['errors'][0]['duplicate_of_index'] );
		$this->assertSame( 1, $this->count_contacts_with_suffix( $suffix ) );
	}

	public function test_pre_existing_email_returns_contact_exists(): void {
		$suffix = wp_generate_password( 8, false, false );
		$existing = 'exists+' . $suffix . '@example.test';

		ContactAbilities::create_contact( array( 'email' => $existing ) );

		$result = $this->run_create_bulk(
			array(
				'contacts' => array(
					array( 'email' => $existing ),
					array( 'email' => 'fresh+' . $suffix . '@example.test' ),
				),
			)
		);

		$this->assertIsArray( $result );
		$this->assertSame( 1, $result['created'] );
		$this->assertSame( 'doublescale_contact_exists', $result['errors'][0]['code'] );
		$this->assertSame( 2, $this->count_contacts_with_suffix( $suffix ) );
	}

	/**
	 * Over-cap rejects the whole batch. Kills returning a partial instead of
	 * refusing, and truncating instead of rejecting.
	 */
	public function test_over_cap_writes_zero_rows(): void {
		$suffix = wp_generate_password( 8, false, false );
		$max    = AbilityBulk::max_items( 'doublescale/create-contacts-bulk' );

		$rows = array();
		for ( $i = 0; $i < $max + 1; $i++ ) {
			$rows[] = array( 'email' => 'n' . $i . '+' . $suffix . '@example.test' );
		}

		$result = $this->run_create_bulk( array( 'contacts' => $rows ) );

		$this->assertTrue( is_wp_error( $result ) );
		$this->assertSame( 'doublescale_batch_too_large', $result->get_error_code() );
		$this->assertSame( 0, $this->count_contacts_with_suffix( $suffix ) );
	}

	public function test_bare_string_row_is_reported_and_siblings_still_save(): void {
		$suffix = wp_generate_password( 8, false, false );

		$result = $this->run_create_bulk(
			array(
				'contacts' => array(
					'not-an-object',
					array( 'email' => 'ok+' . $suffix . '@example.test' ),
				),
			)
		);

		$this->assertIsArray( $result );
		$this->assertSame( 1, $result['created'] );
		$this->assertSame( 'doublescale_invalid_item', $result['errors'][0]['code'] );
		$this->assertSame( 1, $this->count_contacts_with_suffix( $suffix ) );
	}

	/**
	 * Kills `'created' => $n` → `'created' => true` (assertSame 2) and nesting
	 * under summary (would fire even when every row fails).
	 */
	public function test_ability_write_fires_once_for_a_mixed_batch(): void {
		$ability = wp_get_ability( 'doublescale/create-contacts-bulk' );
		$this->assertNotNull( $ability, 'create-contacts-bulk must be registered so the write audit can see readonly:false.' );
		$this->assertFalse(
			( $ability->get_meta()['annotations']['readonly'] ?? true ),
			'create-contacts-bulk must be annotated readonly:false or AbilityGuard will skip the audit.'
		);

		$suffix = wp_generate_password( 8, false, false );

		$result = $this->run_create_bulk(
			array(
				'contacts' => array(
					array( 'email' => 'ok-a+' . $suffix . '@example.test' ),
					array( 'email' => 'not-an-email' ),
					array( 'email' => 'ok-b+' . $suffix . '@example.test' ),
				),
			)
		);

		$this->assertIsArray( $result );
		$this->assertCount( 1, self::$write_fires );
		$this->assertSame( 2, self::$write_fires[0]['result']['created'] );
		$this->assertSame( 'doublescale/create-contacts-bulk', self::$write_fires[0]['name'] );

		$this->assertCount( 2, self::$item_fires );
		$this->assertSame( $result['batch_id'], self::$item_fires[0]['batch_id'] );
		$this->assertSame( $result['batch_id'], self::$item_fires[1]['batch_id'] );
		$this->assertSame( array(), self::$sent_mail );
	}

	public function test_ability_write_does_not_fire_when_every_row_fails(): void {
		$ability = wp_get_ability( 'doublescale/create-contacts-bulk' );
		$this->assertNotNull( $ability, 'create-contacts-bulk must be registered so a skipped audit is meaningful.' );
		$this->assertFalse( $ability->get_meta()['annotations']['readonly'] ?? true );

		$result = $this->run_create_bulk(
			array(
				'contacts' => array(
					array( 'email' => 'not-an-email' ),
					array( 'email' => 'also-bad' ),
				),
			)
		);

		$this->assertIsArray( $result );
		$this->assertSame( 0, $result['created'] );
		$this->assertSame( array(), self::$write_fires );
		$this->assertSame( array(), self::$item_fires );
	}

	public function test_update_contacts_bulk_partial_success(): void {
		$suffix = wp_generate_password( 8, false, false );

		$a = ContactAbilities::create_contact(
			array(
				'email'      => 'upd-a+' . $suffix . '@example.test',
				'first_name' => 'Old',
			)
		);
		$b = ContactAbilities::create_contact(
			array(
				'email'      => 'upd-b+' . $suffix . '@example.test',
				'first_name' => 'Old',
			)
		);

		$result = ContactAbilities::update_contacts_bulk(
			array(
				'contacts' => array(
					array(
						'id'         => $a['contact_id'],
						'first_name' => 'NewA',
					),
					array(
						'id'         => 99999999,
						'first_name' => 'Ghost',
					),
					array(
						'id'         => $b['contact_id'],
						'first_name' => 'NewB',
					),
				),
			)
		);

		$this->assertIsArray( $result );
		$this->assertSame( 2, $result['updated'] );
		$this->assertSame( 1, $result['failed'] );
		$this->assertSame( 'doublescale_not_found', $result['errors'][0]['code'] );

		$fresh_a = ContactModel::query()->where( 'id', $a['contact_id'] )->first();
		$fresh_b = ContactModel::query()->where( 'id', $b['contact_id'] )->first();
		$this->assertSame( 'NewA', (string) $fresh_a->first_name );
		$this->assertSame( 'NewB', (string) $fresh_b->first_name );
	}

	public function test_dry_run_create_writes_nothing_and_skips_audit(): void {
		$suffix = wp_generate_password( 8, false, false );

		$result = $this->run_create_bulk(
			array(
				'dry_run'  => true,
				'contacts' => array(
					array( 'email' => 'preview+' . $suffix . '@example.test' ),
				),
			)
		);

		$this->assertIsArray( $result );
		$this->assertTrue( $result['dry_run'] );
		$this->assertSame( 0, $result['created'] );
		$this->assertSame( 1, $result['would_create'] );
		$this->assertSame( array(), $result['applied_contact_ids'] );
		$this->assertSame( 0, $this->count_contacts_with_suffix( $suffix ) );
		$this->assertSame( array(), self::$write_fires );
		$this->assertSame( array(), self::$item_fires );
	}

	public function test_update_by_contact_ids_applies_the_shared_patch(): void {
		$suffix = wp_generate_password( 8, false, false );
		$created_a = ContactAbilities::create_contact(
			array(
				'email'      => 'ids-a+' . $suffix . '@example.test',
				'first_name' => 'Old',
			)
		);
		$created_b = ContactAbilities::create_contact(
			array(
				'email'      => 'ids-b+' . $suffix . '@example.test',
				'first_name' => 'Old',
			)
		);

		$result = ContactAbilities::update_contacts_bulk(
			array(
				'contact_ids' => array( $created_a['contact_id'], $created_b['contact_id'] ),
				'first_name'  => 'Patched',
			)
		);

		$this->assertIsArray( $result );
		$this->assertSame( 2, $result['updated'] );
		$this->assertSame(
			array( (int) $created_a['contact_id'], (int) $created_b['contact_id'] ),
			$result['applied_contact_ids']
		);
		$this->assertSame(
			'Patched',
			(string) ContactModel::query()->where( 'id', $created_a['contact_id'] )->first()->first_name
		);
	}

	public function test_update_by_filter_targets_without_listing_ids(): void {
		$suffix  = wp_generate_password( 8, false, false );
		$company = 'FilterCo-' . $suffix;

		$matched = ContactAbilities::create_contact(
			array(
				'email'        => 'flt-a+' . $suffix . '@example.test',
				'first_name'   => 'Old',
				'company_name' => $company,
			)
		);
		ContactAbilities::create_contact(
			array(
				'email'        => 'flt-b+' . $suffix . '@example.test',
				'first_name'   => 'Old',
				'company_name' => 'Other-' . $suffix,
			)
		);

		$result = ContactAbilities::update_contacts_bulk(
			array(
				'filter'     => array( 'search' => $company ),
				'first_name' => 'FromFilter',
			)
		);

		$this->assertIsArray( $result );
		$this->assertSame( 1, $result['updated'] );
		$this->assertSame( array( (int) $matched['contact_id'] ), $result['applied_contact_ids'] );
		$this->assertSame(
			'FromFilter',
			(string) ContactModel::query()->where( 'id', $matched['contact_id'] )->first()->first_name
		);
	}

	public function test_over_cap_id_list_write_is_rejected(): void {
		$max = AbilityBulk::max_items( 'doublescale/update-contacts-bulk' );

		$result = ContactAbilities::update_contacts_bulk(
			array(
				'contact_ids' => range( 1, $max + 1 ),
				'first_name'  => 'Nope',
			)
		);

		$this->assertTrue( is_wp_error( $result ) );
		$this->assertSame( 'doublescale_batch_too_large', $result->get_error_code() );
	}

	public function test_over_cap_id_list_dry_run_reports_the_real_count(): void {
		$max = AbilityBulk::max_items( 'doublescale/update-contacts-bulk' );

		$result = ContactAbilities::update_contacts_bulk(
			array(
				'dry_run'     => true,
				'contact_ids' => range( 1, $max + 1 ),
				'first_name'  => 'Nope',
			)
		);

		$this->assertIsArray( $result );
		$this->assertTrue( $result['dry_run'] );
		$this->assertTrue( $result['over_cap'] );
		$this->assertSame( 0, $result['updated'] );
		$this->assertSame( $max + 1, $result['would_update'] );
		$this->assertSame( $max + 1, $result['matched'] );
		$this->assertSame( array(), $result['applied_contact_ids'] );
	}

	public function test_combining_rows_and_filter_is_refused(): void {
		$result = ContactAbilities::update_contacts_bulk(
			array(
				'contacts' => array(
					array(
						'id'         => 1,
						'first_name' => 'X',
					),
				),
				'filter'   => array( 'status' => 'subscribed' ),
			)
		);

		$this->assertTrue( is_wp_error( $result ) );
		$this->assertSame( 'doublescale_invalid_target', $result->get_error_code() );
	}

	public function test_empty_filter_is_refused(): void {
		$result = ContactAbilities::update_contacts_bulk(
			array(
				'filter'     => array(),
				'first_name' => 'X',
			)
		);

		$this->assertTrue( is_wp_error( $result ) );
		$this->assertSame( 'doublescale_empty_filter', $result->get_error_code() );
	}
}
