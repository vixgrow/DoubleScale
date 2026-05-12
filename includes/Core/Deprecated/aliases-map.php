<?php
/**
 * Legacy FQCN => canonical FQCN (populated during module ports).
 *
 * @return array<string, string>
 */
return array(
	// Legacy DoubleScale manager — modular Contacts module owns the canonical implementation.
	'DoubleScale\\Managers\\Filters_Manager' => 'DoubleScale\\Modules\\Contacts\\Filters\\FiltersManager',

	// Custom fields (canonical classes live in free `includes/Core/CustomFields/`).
	'DoubleScale\\Database\\Migrations\\CustomFieldRelationshipTable' => 'DoubleScale\\Core\\CustomFields\\Migrations\\CustomFieldRelationshipTable',
	'DoubleScale\\Database\\Migrations\\CustomFieldsGroupsTable' => 'DoubleScale\\Core\\CustomFields\\Migrations\\CustomFieldsGroupsTable',
	'DoubleScale\\Database\\Migrations\\CustomFieldsTable' => 'DoubleScale\\Core\\CustomFields\\Migrations\\CustomFieldsTable',
	'DoubleScale\\Models\\CustomFieldModel' => 'DoubleScale\\Core\\CustomFields\\Models\\CustomFieldModel',
	'DoubleScale\\Models\\CustomFieldsGroupModel' => 'DoubleScale\\Core\\CustomFields\\Models\\CustomFieldsGroupModel',
	'DoubleScale\\RestApi\\Controllers\\V1\\RestCustomFieldController' => 'DoubleScale\\Core\\CustomFields\\Rest\\RestCustomFieldController',
	'DoubleScale\\RestApi\\Controllers\\V1\\RestCustomFieldsGroupController' => 'DoubleScale\\Core\\CustomFields\\Rest\\RestCustomFieldsGroupController',
);
