<?php
/**
 * Contract body merge-tag resolution.
 *
 * @package DoubleScale\Tests\Modules\Sales
 */

namespace DoubleScale\Tests\Modules\Sales;

use DoubleScale\Core\MergeTags\MergeTagsManager;
use DoubleScale\Modules\Contacts\Models\ContactModel;
use DoubleScale\Modules\Sales\Constants\ContractStatus;
use DoubleScale\Modules\Sales\Models\ContractModel;
use DoubleScale\Modules\Sales\Rest\ContractShaper;
use DoubleScale\Modules\Sales\Services\ContractContentMergeTags;
use PHPUnit\Framework\TestCase;

/**
 * @group smoke
 */
final class ContractContentMergeTagsTest extends TestCase {

	protected function setUp(): void {
		parent::setUp();

		require_once DOUBLESCALE_PLUGIN_DIR . 'includes/Modules/Sales/MergeTags/AbstractSalesMergeTag.php';
		require_once DOUBLESCALE_PLUGIN_DIR . 'includes/Modules/Contacts/MergeTags/Contact/ContactFirstName.php';

		$manager = MergeTagsManager::instance();
		if ( ! $manager->get_merge_tag( 'sales', 'contract_number' ) ) {
			require_once DOUBLESCALE_PLUGIN_DIR . 'includes/Modules/Sales/MergeTags/ContractNumber.php';
		}
	}

	public function test_resolve_replaces_sales_and_contact_merge_tags(): void {
		$contact = new ContactModel();
		$contact->forceFill(
			array(
				'id'         => 7,
				'first_name' => 'Jane',
				'last_name'  => 'Doe',
				'email'      => 'jane@example.test',
			)
		);

		$contract = new ContractModel();
		$contract->forceFill(
			array(
				'id'              => 42,
				'contact_id'      => 7,
				'contract_number' => 'CON-000042',
				'subject'         => 'Support agreement',
				'status'          => ContractStatus::SENT,
				'contract_value'  => 1500.0,
				'currency'        => 'USD',
				'description'     => '<p>Hi {{contact:first_name}}, ref {{sales:contract_number}}</p>',
			)
		);
		$contract->setRelation( 'contact', $contact );

		$resolved = ContractContentMergeTags::resolve(
			$contract,
			(string) $contract->description
		);

		$this->assertStringContainsString( 'Jane', $resolved );
		$this->assertStringContainsString( 'CON-000042', $resolved );
		$this->assertStringNotContainsString( '{{contact:first_name}}', $resolved );
		$this->assertStringNotContainsString( '{{sales:contract_number}}', $resolved );
	}

	public function test_shape_public_resolves_description_merge_tags(): void {
		$contact = new ContactModel();
		$contact->forceFill(
			array(
				'id'         => 3,
				'first_name' => 'Sam',
				'last_name'  => 'Lee',
				'email'      => 'sam@example.test',
			)
		);

		$contract = new ContractModel();
		$contract->forceFill(
			array(
				'id'              => 9,
				'contact_id'      => 3,
				'contract_number' => 'CON-000009',
				'subject'         => 'Annual plan',
				'status'          => ContractStatus::SENT,
				'contract_value'  => 900.0,
				'currency'        => 'USD',
				'description'     => '<p>Prepared for {{contact:first_name}}</p>',
			)
		);
		$contract->setRelation( 'contact', $contact );

		$shaped = ContractShaper::shape_public( $contract );

		$this->assertStringContainsString( 'Prepared for Sam', $shaped['description'] );
		$this->assertStringNotContainsString( '{{contact:first_name}}', $shaped['description'] );
	}
}
