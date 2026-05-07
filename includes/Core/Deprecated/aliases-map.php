<?php
/**
 * Legacy FQCN => canonical FQCN (populated during module ports).
 *
 * @return array<string, string>
 */
return array(
	// Legacy QuillCRM manager — modular Contacts module owns the canonical implementation.
	'QuillCRM\\Managers\\Filters_Manager' => 'DoubleScale\\Modules\\Contacts\\Filters\\FiltersManager',
);
