<?php
/**
 * Legacy FQCN => canonical FQCN (populated during module ports).
 *
 * @return array<string, string>
 */
return array(
	// Legacy DoubleScale manager — modular Contacts module owns the canonical implementation.
	'DoubleScale\\Managers\\Filters_Manager' => 'DoubleScale\\Modules\\Contacts\\Filters\\FiltersManager',
);
