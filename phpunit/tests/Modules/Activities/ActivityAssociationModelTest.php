<?php
/**
 * Activity association entity-type mapping tests.
 *
 * @package DoubleScale\Tests
 */

namespace DoubleScale\Tests\Modules\Activities;

use DoubleScale\Modules\Activities\Models\ActivityAssociationModel;
use PHPUnit\Framework\TestCase;

defined( 'ABSPATH' ) || exit;

/**
 * @group smoke
 */
class ActivityAssociationModelTest extends TestCase {

	public function test_task_entity_type_constant(): void {
		$this->assertSame( 4, ActivityAssociationModel::ENTITY_TYPE_TASK );
	}

	public function test_string_to_entity_type_includes_task(): void {
		$this->assertSame(
			ActivityAssociationModel::ENTITY_TYPE_TASK,
			ActivityAssociationModel::string_to_entity_type( 'task' )
		);
	}

	public function test_entity_type_to_string_includes_task(): void {
		$this->assertSame(
			'task',
			ActivityAssociationModel::entity_type_to_string( ActivityAssociationModel::ENTITY_TYPE_TASK )
		);
	}

	public function test_validation_allows_task_entity_type(): void {
		$model         = new ActivityAssociationModel();
		$model->rules  = array(
			'entity_type' => 'required|integer|in:1,2,3,4',
		);
		$model->entity_type = ActivityAssociationModel::ENTITY_TYPE_TASK;
		$this->assertContains( '4', explode( ',', substr( $model->rules['entity_type'], strpos( $model->rules['entity_type'], 'in:' ) + 3 ) ) );
	}
}
