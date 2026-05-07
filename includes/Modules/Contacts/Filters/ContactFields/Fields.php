<?php

/**
 * Class Fields
 *
 * This class is responsible for handling the contact fields filter
 *
 * @since 1.0.0
 *
 * @package DoubleScale\Pro
 */

namespace DoubleScale\Modules\Contacts\Filters\ContactFields;

use DoubleScale\Modules\Contacts\Abstracts\Filter;
use DoubleScale\Core\CustomFields\Models\CustomFieldModel;
use DoubleScale\Modules\Contacts\Filters\FiltersManager;
use Illuminate\Database\Eloquent\Builder;

/**
 * Fields class
 */
class Fields extends Filter
{

	/**
	 * Name
	 *
	 * @var string
	 *
	 * @since 1.0.0
	 */
	public $name;

	/**
	 * Slug
	 *
	 * @var string
	 *
	 * @since 1.0.0
	 */
	public $slug;

	/**
	 * Group
	 *
	 * @var string
	 *
	 * @since 1.0.0
	 */
	public $group = 'contact_fields';

	/**
	 * Custom Field
	 *
	 * @var CustomFieldModel
	 *
	 * @since 1.0.0
	 */
	public $custom_field;

	/**
	 * Type
	 *
	 * @var string
	 *
	 * @since 1.0.0
	 */
	public $type = 'text';

	/**
	 * Constructor
	 */
	public function __construct($custom_field)
	{
		$this->custom_field = $custom_field;
		$this->name         = $custom_field->name;
		$this->slug         = 'contact_field_' . $custom_field->id;
	}

	/**
	 * Is met
	 *
	 * @since 1.0.0
	 *
	 * @param Builder $query Query.
	 * @param array   $filter Rule.
	 *
	 * @return Builder
	 */
	public function apply(Builder $query, $filter = array())
	{
		$operator = isset($filter['operator']) ? $filter['operator'] : 'is';
		$value    = isset($filter['value']) ? $filter['value'] : array();

		if (empty($value)) {
			return $query;
		}

		$field_id = $this->custom_field->id;

		switch ($operator) {
			case 'is':
				$query->whereHas(
					'custom_fields',
					function ($query) use ($field_id, $value) {
						$query->where('custom_field_id', $field_id)->where('value', $value);
					}
				);
				break;
			case 'is_not':
				$query->whereHas(
					'custom_fields',
					function ($query) use ($field_id, $value) {
						$query->where('custom_field_id', $field_id)->where('value', '!=', $value);
					}
				);
				break;
			case 'contains':
				$query->whereHas(
					'custom_fields',
					function ($query) use ($field_id, $value) {
						$query->where('custom_field_id', $field_id)->where('value', 'like', '%' . $value . '%');
					}
				);
				break;
			case 'does_not_contain':
				$query->whereHas(
					'custom_fields',
					function ($query) use ($field_id, $value) {
						$query->where('custom_field_id', $field_id)->where('value', 'not like', '%' . $value . '%');
					}
				);
				break;
			case 'is_empty':
				$query->whereDoesntHave(
					'custom_fields',
					function ($query) use ($field_id) {
						$query->where('custom_field_id', $field_id);
					}
				);
				break;
			case 'is_not_empty':
				$query->whereHas(
					'custom_fields',
					function ($query) use ($field_id) {
						$query->where('custom_field_id', $field_id);
					}
				);
				break;
		}

		return $query;
	}
}

try {
	$custom_fields = CustomFieldModel::all();
	if ( ! empty( $custom_fields ) ) {
		foreach ( $custom_fields as $custom_field ) {
			$filter = new Fields( $custom_field );
			FiltersManager::instance()->register( $filter );
		}
	}
} catch ( \Throwable $e ) {
	// Tables may not exist yet before migrations.
}
