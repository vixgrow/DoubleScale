<?php
/**
 * Legacy FQCN => canonical FQCN (populated during module ports).
 *
 * @return array<string, string>
 */
return array(
	// Legacy DoubleScale manager — modular Contacts module owns the canonical implementation.
	'DoubleScale\\Managers\\Filters_Manager' => 'DoubleScale\\Modules\\Contacts\\Filters\\FiltersManager',

	// Legacy DoubleScale — canonical custom fields classes live in Pro.
	'DoubleScale\\Database\\Migrations\\CustomFieldRelationshipTable' => 'DoubleScale\\Pro\\Modules\\CustomFields\\Migrations\\CustomFieldRelationshipTable',
	'DoubleScale\\Database\\Migrations\\CustomFieldsGroupsTable' => 'DoubleScale\\Pro\\Modules\\CustomFields\\Migrations\\CustomFieldsGroupsTable',
	'DoubleScale\\Database\\Migrations\\CustomFieldsTable' => 'DoubleScale\\Pro\\Modules\\CustomFields\\Migrations\\CustomFieldsTable',
	'DoubleScale\\Models\\CustomFieldModel' => 'DoubleScale\\Pro\\Modules\\CustomFields\\Models\\CustomFieldModel',
	'DoubleScale\\Models\\CustomFieldsGroupModel' => 'DoubleScale\\Pro\\Modules\\CustomFields\\Models\\CustomFieldsGroupModel',
	'DoubleScale\\RestApi\\Controllers\\V1\\RestCustomFieldController' => 'DoubleScale\\Pro\\Modules\\CustomFields\\Rest\\RestCustomFieldController',
	'DoubleScale\\RestApi\\Controllers\\V1\\RestCustomFieldsGroupController' => 'DoubleScale\\Pro\\Modules\\CustomFields\\Rest\\RestCustomFieldsGroupController',
);
