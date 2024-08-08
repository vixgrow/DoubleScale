<?php
/**
 * Class Last_Email_Clicked
 *
 * This class is responsible for handling the last email clicked rule
 *
 * @since 1.0.0
 *
 * @package QuillCRM
 */

namespace QuillCRM\Contact_Filters\Activity;

use QuillCRM\Abstracts\Filter;
use QuillCRM\Managers\Filters_Manager;
use Illuminate\Database\Eloquent\Builder;

/**
 * Last_Email_Clicked class
 */
class Last_Email_Clicked extends Filter {

	/**
	 * Name
	 *
	 * @var string
	 *
	 * @since 1.0.0
	 */
	public $name = 'Last Email Clicked';

	/**
	 * Slug
	 *
	 * @var string
	 *
	 * @since 1.0.0
	 */
	public $slug = 'activity_last_email_clicked';

	/**
	 * Group
	 *
	 * @var string
	 *
	 * @since 1.0.0
	 */
	public $group = 'activity';

	/**
	 * Type
	 *
	 * @var string
	 *
	 * @since 1.0.0
	 */
	public $type = 'date';

	/**
	 * Get operators
	 *
	 * @since 1.0.0
	 *
	 * @return array
	 */
	public function get_operators() {
		return array(
			'before'  => __( 'Before', 'quillcrm' ),
			'after'   => __( 'After', 'quillcrm' ),
			'on'      => __( 'On', 'quillcrm' ),
			'between' => __( 'Between', 'quillcrm' ),
			'within'  => __( 'Within', 'quillcrm' ),
		);
	}

	/**
	 * Apply filter
	 *
	 * @since 1.0.0
	 *
	 * @param Builder $query Query.
	 * @param array   $filter Rule.
	 *
	 * @return Builder
	 */
	public function apply( Builder $query, $filter = array() ) {
		$operator = isset( $filter['operator'] ) ? $filter['operator'] : 'before';
		$value    = isset( $filter['value'] ) ? $filter['value'] : '';

		error_log( 'Value: ' . $value . ' Operator: ' . $operator );
		// Convert string to date
		$date = new \DateTime( $value );
		if ( $date ) {
			$value = $date->format( 'Y-m-d' );
		} else {
			return $query;
		}

		switch ( $operator ) {
			case 'before':
				$query->whereHas(
					'campaign_emails',
					function ( $query ) use ( $value ) {
						$query->whereDate( 'clicked_at', '<', $value );
					}
				);
				break;
			case 'after':
				$query->whereHas(
					'campaign_emails',
					function ( $query ) use ( $value ) {
						$query->whereDate( 'clicked_at', '>', $value );
					}
				);
				break;
			case 'on':
				$query->whereHas(
					'campaign_emails',
					function ( $query ) use ( $value ) {
						$query->whereDate( 'clicked_at', $value );
					}
				);
				break;
			case 'between':
				$query->whereHas(
					'campaign_emails',
					function ( $query ) use ( $value ) {
						$query->whereBetween( 'clicked_at', $value );
					}
				);
				break;
			case 'within':
				$query->whereHas(
					'campaign_emails',
					function ( $query ) use ( $value ) {
						$query->whereDate( 'clicked_at', '>=', $value[0] )
						->whereDate( 'clicked_at', '<=', $value[1] );
					}
				);
				break;
		}

		return $query;
	}
}

Filters_Manager::instance()->register( new Last_Email_Clicked() );
