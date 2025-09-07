<?php
/**
 * Class Pipeline_Manager
 * This class is responsible for handling pipeline management
 *
 * @since 1.0.0
 *
 * @package QuillCRM
 */

namespace QuillCRM\Managers;

use Exception;
use QuillCRM\Models\Pipeline_Model;
use QuillCRM\Models\Pipeline_Stage_Model;

/**
 * Pipeline_Manager class
 */
final class Pipeline_Manager {

	/**
	 * Class Instance.
	 *
	 * @since 1.0.0
	 *
	 * @var Pipeline_Manager
	 */
	private static $instance;

	/**
	 * Manager Instance.
	 *
	 * Instantiates or reuses an instance of Pipeline_Manager.
	 *
	 * @since  1.0.0
	 *
	 * @return Pipeline_Manager
	 */
	public static function instance() {
		if ( is_null( self::$instance ) ) {
			self::$instance = new self();
		}

		return self::$instance;
	}

	/**
	 * Constructor
	 *
	 * @since 1.0.0
	 */
	private function __construct() {
		add_action( 'quillcrm_loaded', array( $this, 'init' ) );
	}

	/**
	 * Initialize
	 *
	 * @since 1.0.0
	 *
	 * @return void
	 */
	public function init() {
		add_action( 'wp_loaded', array( $this, 'create_default_pipeline' ) );
	}

	/**
	 * Create default pipeline if none exists
	 *
	 * @since 1.0.0
	 *
	 * @return void
	 */
	public function create_default_pipeline() {
		if ( Pipeline_Model::count() === 0 ) {
			$this->create_pipeline_with_stages(
				'Sales Pipeline',
				'Default sales pipeline',
				array(
					array( 'name' => 'Lead', 'color' => '#e74c3c', 'win_probability' => 10.0 ),
					array( 'name' => 'Qualified', 'color' => '#f39c12', 'win_probability' => 25.0 ),
					array( 'name' => 'Proposal', 'color' => '#f1c40f', 'win_probability' => 50.0 ),
					array( 'name' => 'Negotiation', 'color' => '#2ecc71', 'win_probability' => 75.0 ),
					array( 'name' => 'Closed Won', 'color' => '#27ae60', 'win_probability' => 100.0 ),
				)
			);
		}
	}

	/**
	 * Create pipeline with stages
	 *
	 * @since 1.0.0
	 *
	 * @param string $name Pipeline name
	 * @param string $description Pipeline description
	 * @param array $stages Array of stage data
	 *
	 * @return Pipeline|null
	 */
	public function create_pipeline_with_stages( $name, $description = '', $stages = array() ) {
		try {
			$pipeline = Pipeline_Model::create( array(
				'name' => $name,
				'description' => $description,
				'sort_order' => Pipeline_Model::max( 'sort_order' ) + 1,
			) );

			if ( empty( $stages ) ) {
				$stages = array(
					array( 'name' => 'New', 'color' => '#6d78d8', 'win_probability' => 10.0 ),
					array( 'name' => 'In Progress', 'color' => '#f39c12', 'win_probability' => 50.0 ),
					array( 'name' => 'Closed', 'color' => '#2ecc71', 'win_probability' => 100.0 ),
				);
			}

			$sort_order = 0;
			foreach ( $stages as $stage_data ) {
				Pipeline_Stage_Model::create( array(
					'pipeline_id' => $pipeline->id,
					'name' => $stage_data['name'],
					'color' => $stage_data['color'] ?? '#6d78d8',
					'sort_order' => $sort_order++,
					'win_probability' => $stage_data['win_probability'] ?? 0.0,
				) );
			}

			do_action( 'quillcrm_pipeline_created', $pipeline );

			return $pipeline;

		} catch ( Exception $e ) {
			error_log( 'QuillCRM Pipeline Manager Error: ' . $e->getMessage() );
			return null;
		}
	}

	/**
	 * Get all pipelines with stages
	 *
	 * @since 1.0.0
	 *
	 * @return \Illuminate\Database\Eloquent\Collection
	 */
	public function get_pipelines_with_stages() {
		return Pipeline_Model::with( 'stages' )->orderBy( 'sort_order' )->get();
	}

	/**
	 * Get pipeline by ID with stages and deals count
	 *
	 * @since 1.0.0
	 *
	 * @param int $pipeline_id Pipeline ID
	 *
	 * @return Pipeline|null
	 */
	public function get_pipeline_with_stats( $pipeline_id ) {
		return Pipeline_Model::with( array( 
			'stages' => function( $query ) {
				$query->withCount( 'active_deals' );
			},
			'stages.active_deals'
		) )->find( $pipeline_id );
	}

	/**
	 * Duplicate pipeline
	 *
	 * @since 1.0.0
	 *
	 * @param int $pipeline_id Pipeline ID to duplicate
	 * @param string $new_name New pipeline name
	 *
	 * @return Pipeline|null
	 */
	public function duplicate_pipeline( $pipeline_id, $new_name = '' ) {
		$original = Pipeline_Model::with( 'stages' )->find( $pipeline_id );
		
		if ( ! $original ) {
			return null;
		}

		if ( empty( $new_name ) ) {
			$new_name = $original->name . ' (Copy)';
		}

		$new_pipeline = Pipeline_Model::create( array(
			'name' => $new_name,
			'description' => $original->description,
			'sort_order' => Pipeline_Model::max( 'sort_order' ) + 1,
		) );

		foreach ( $original->stages as $stage ) {
			Pipeline_Stage_Model::create( array(
				'pipeline_id' => $new_pipeline->id,
				'name' => $stage->name,
				'color' => $stage->color,
				'sort_order' => $stage->sort_order,
				'win_probability' => $stage->win_probability,
			) );
		}

		do_action( 'quillcrm_pipeline_duplicated', $new_pipeline, $original );

		return $new_pipeline;
	}

	/**
	 * Update pipeline sort order
	 *
	 * @since 1.0.0
	 *
	 * @param array $pipeline_ids Array of pipeline IDs in new order
	 *
	 * @return bool
	 */
	public function update_pipeline_sort_order( $pipeline_ids ) {
		try {
			foreach ( $pipeline_ids as $index => $pipeline_id ) {
				Pipeline_Model::where( 'id', $pipeline_id )
					->update( array( 'sort_order' => $index ) );
			}
			
			do_action( 'quillcrm_pipeline_sort_order_updated', $pipeline_ids );
			
			return true;

		} catch ( Exception $e ) {
			error_log( 'QuillCRM Pipeline Sort Error: ' . $e->getMessage() );
			return false;
		}
	}

	/**
	 * Add stage to pipeline
	 *
	 * @since 1.0.0
	 *
	 * @param int $pipeline_id Pipeline ID
	 * @param string $name Stage name
	 * @param string $color Stage color
	 * @param float $win_probability Win probability
	 * @param int|null $position Position in pipeline (null = end)
	 *
	 * @return Pipeline_Stage|null
	 */
	public function add_stage( $pipeline_id, $name, $color = '#6d78d8', $win_probability = 0.0, $position = null ) {
		$pipeline = Pipeline_Model::find( $pipeline_id );
		
		if ( ! $pipeline ) {
			return null;
		}

		if ( $position === null ) {
			$sort_order = $pipeline->stages()->max( 'sort_order' ) + 1;
		} else {
			$sort_order = $position;
			// Update existing stages to make room
			$pipeline->stages()
				->where( 'sort_order', '>=', $position )
				->increment( 'sort_order' );
		}

		$stage = Pipeline_Stage_Model::create( array(
			'pipeline_id' => $pipeline_id,
			'name' => $name,
			'color' => $color,
			'sort_order' => $sort_order,
			'win_probability' => $win_probability,
		) );

		do_action( 'quillcrm_pipeline_stage_added', $stage, $pipeline );

		return $stage;
	}

	/**
	 * Update stage sort order within pipeline
	 *
	 * @since 1.0.0
	 *
	 * @param int $pipeline_id Pipeline ID
	 * @param array $stage_ids Array of stage IDs in new order
	 *
	 * @return bool
	 */
	public function update_stage_sort_order( $pipeline_id, $stage_ids ) {
		try {
			foreach ( $stage_ids as $index => $stage_id ) {
				Pipeline_Stage_Model::where( 'id', $stage_id )
					->where( 'pipeline_id', $pipeline_id )
					->update( array( 'sort_order' => $index ) );
			}
			
			do_action( 'quillcrm_stage_sort_order_updated', $pipeline_id, $stage_ids );
			
			return true;

		} catch ( Exception $e ) {
			error_log( 'QuillCRM Stage Sort Error: ' . $e->getMessage() );
			return false;
		}
	}

	/**
	 * Delete pipeline and handle deals
	 *
	 * @since 1.0.0
	 *
	 * @param int $pipeline_id Pipeline ID
	 * @param int|null $move_deals_to_pipeline_id Move deals to this pipeline
	 *
	 * @return bool
	 */
	public function delete_pipeline( $pipeline_id, $move_deals_to_pipeline_id = null ) {
		$pipeline = Pipeline_Model::with( array( 'deals', 'stages' ) )->find( $pipeline_id );
		
		if ( ! $pipeline ) {
			return false;
		}

		// If there are deals, we need to move them or prevent deletion
		if ( $pipeline->deals->count() > 0 ) {
			if ( $move_deals_to_pipeline_id ) {
				$target_pipeline = Pipeline_Model::with( 'stages' )->find( $move_deals_to_pipeline_id );
				
				if ( $target_pipeline && $target_pipeline->stages->count() > 0 ) {
					$first_stage = $target_pipeline->stages->first();
					
					foreach ( $pipeline->deals as $deal ) {
						$deal->update( array(
							'pipeline_id' => $move_deals_to_pipeline_id,
							'stage_id' => $first_stage->id,
						) );
					}
				}
			} else {
				// Prevent deletion if deals exist and no target pipeline specified
				return false;
			}
		}

		do_action( 'quillcrm_pipeline_before_delete', $pipeline );

		$deleted = $pipeline->delete();

		if ( $deleted ) {
			do_action( 'quillcrm_pipeline_deleted', $pipeline_id );
		}

		return $deleted;
	}

	/**
	 * Get pipeline analytics
	 *
	 * @since 1.0.0
	 *
	 * @param int $pipeline_id Pipeline ID
	 * @param array $filters Date filters and other criteria
	 *
	 * @return array
	 */
	public function get_pipeline_analytics( $pipeline_id, $filters = array() ) {
		$pipeline = Pipeline_Model::with( array( 
			'stages',
			'deals' => function( $query ) use ( $filters ) {
				if ( isset( $filters['date_from'] ) ) {
					$query->whereDate( 'created_at', '>=', $filters['date_from'] );
				}
				if ( isset( $filters['date_to'] ) ) {
					$query->whereDate( 'created_at', '<=', $filters['date_to'] );
				}
			}
		) )->find( $pipeline_id );

		if ( ! $pipeline ) {
			return array();
		}

		$total_deals = $pipeline->deals->count();
		$won_deals = $pipeline->deals->where( 'status', 'won' )->count();
		$lost_deals = $pipeline->deals->where( 'status', 'lost' )->count();
		$open_deals = $pipeline->deals->where( 'status', 'open' )->count();

		$total_value = $pipeline->deals->where( 'status', 'open' )->sum( 'value' );
		$won_value = $pipeline->deals->where( 'status', 'won' )->sum( 'value' );
		$weighted_value = 0;

		// Calculate weighted value
		foreach ( $pipeline->deals->where( 'status', 'open' ) as $deal ) {
			$stage = $pipeline->stages->where( 'id', $deal->stage_id )->first();
			if ( $stage ) {
				$weighted_value += $deal->value * ( $stage->win_probability / 100 );
			}
		}

		return array(
			'total_deals' => $total_deals,
			'won_deals' => $won_deals,
			'lost_deals' => $lost_deals,
			'open_deals' => $open_deals,
			'win_rate' => $total_deals > 0 ? round( ( $won_deals / $total_deals ) * 100, 2 ) : 0,
			'total_value' => $total_value,
			'won_value' => $won_value,
			'weighted_value' => $weighted_value,
			'average_deal_value' => $total_deals > 0 ? round( $total_value / $total_deals, 2 ) : 0,
		);
	}
}