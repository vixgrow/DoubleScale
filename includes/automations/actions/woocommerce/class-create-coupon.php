<?php

/**
 * Create Coupon Action
 *
 * This action will create a coupon.
 *
 * @since 1.0.0
 *
 * @package QuillCRM
 */

namespace QuillCRM\Automations\Actions;

use QuillCRM\Abstracts\Action;
use QuillCRM\Models\Automation_Model;
use QuillCRM\Models\Automation_Step_Model;
use QuillCRM\Models\Automation_Contact_Model;

/**
 * Create Coupon Action
 */
class Create_Coupon extends Action {















	/**
	 * Action Name
	 *
	 * @var string
	 */
	public $name = 'Create Coupon';

	/**
	 * Action Slug
	 *
	 * @var string
	 */
	public $slug = 'create_coupon';

	/**
	 * Action Description
	 *
	 * @var string
	 */
	public $description = 'This action will create a coupon.';

	/**
	 * Source
	 *
	 * @var string
	 */
	public $source = 'woocommerce';

	/**
	 * Tigger Group
	 *
	 * @var string
	 */
	public $group = 'coupon';

	/**
	 * Process Action
	 *
	 * @since 1.0.0
	 *
	 * @param Automation_Model         $automation Automation Model.
	 * @param Automation_Step_Model    $step Automation Step Model.
	 * @param Automation_Contact_Model $contact Contact Model.
	 *
	 * @return bool
	 */
	public function process_action( Automation_Model $automation, Automation_Step_Model $step, Automation_Contact_Model $automation_contact ) {
		try {
			// Check if WooCommerce classes exist
			if ( ! class_exists( 'WC_Coupon' ) ) {
				quillcrm_get_logger()->error(
					__( 'WooCommerce plugin is not active. Cannot create coupon.', 'quillcrm' ),
					array(
						'code'          => 'woocommerce_plugin_inactive',
						'automation_id' => $automation->id,
						'step_id'       => $step->id,
					)
				);
				return false;
			}

			$coupon_expiry_date     = $step->get_setting( 'coupon_expiry_date' );
			$discount_type          = $step->get_setting( 'discount_type' );
			$coupon_prefix          = $step->get_setting( 'coupon_prefix' ) ?? '';
			$is_free_shipping       = $step->get_setting( 'is_free_shipping' ) ?? false;
			$title                  = $step->get_setting( 'title' ) ?? '';
			$usage_limit_per_coupon = $step->get_setting( 'usage_limit_per_coupon' ) ?? 0;
			$limit_usage_to_x_items = $step->get_setting( 'limit_usage_to_x_items' ) ?? 0;
			$usage_limit_per_user   = $step->get_setting( 'usage_limit_per_user' ) ?? 0;

			if ( empty( $discount_type ) ) {
				quillcrm_get_logger()->warning(
					__( 'Discount type not configured for coupon creation', 'quillcrm' ),
					array(
						'code'          => 'woocommerce_discount_type_missing',
						'automation_id' => $automation->id,
						'step_id'       => $step->id,
					)
				);
				return false;
			}

			$coupon_code              = $this->generate_dynamic_coupon_code( $coupon_prefix );
			$discount_type_and_amount = $this->get_discount_type_and_amount( $discount_type['type'], $discount_type['amount'] );
			$expiry_date              = $this->get_expiry_date( $coupon_expiry_date['type'], $coupon_expiry_date['value'] );

			$coupon = new \WC_Coupon();
			$coupon->set_code( $coupon_code );
			$coupon->set_amount( $discount_type_and_amount['amount'] );
			$coupon->set_discount_type( $discount_type_and_amount['type'] );
			$coupon->set_date_expires( $expiry_date );
			$coupon->set_description( $title );
			$coupon->set_free_shipping( $is_free_shipping );
			$coupon->set_usage_limit( $usage_limit_per_coupon );
			$coupon->set_limit_usage_to_x_items( $limit_usage_to_x_items );
			$coupon->set_usage_limit_per_user( $usage_limit_per_user );
			$coupon->save();

			// automation contact data
			$existing_coupons   = $automation_contact->get_data( 'coupon_codes', array() );
			$existing_coupons[] = array(
				'code'    => $coupon_code,
				'step_id' => $step->id,
			);

			$automation_contact->set_data( array( 'coupon_codes' => $existing_coupons ) );

			quillcrm_get_logger()->info(
				__( 'WooCommerce coupon created successfully', 'quillcrm' ),
				array(
					'code'          => 'woocommerce_coupon_created',
					'coupon_code'   => $coupon_code,
					'automation_id' => $automation->id,
					'step_id'       => $step->id,
				)
			);

			return true;
		} catch ( \Exception $e ) {
			quillcrm_get_logger()->error(
				__( 'Failed to create WooCommerce coupon', 'quillcrm' ),
				array(
					'code'          => 'woocommerce_coupon_creation_failed',
					'error'         => $e->getMessage(),
					'automation_id' => $automation->id,
					'step_id'       => $step->id,
				)
			);
			return false;
		}
	}


	/**
	 * Generate dynamic coupon code
	 *
	 * @since 1.0.0
	 *
	 * @param string $prefix Prefix.
	 *
	 * @return string
	 */
	public function generate_dynamic_coupon_code( $prefix = '' ) {

		$random_code = strtoupper( wp_generate_password( 6, false ) );

		$coupon_code = $prefix . $random_code;

		return $coupon_code;
	}

	/**
	 * Get expiry date
	 *
	 * @since 1.0.0
	 *
	 * @param string $type Type.
	 * @param string $value Value.
	 *
	 * @return WC_DateTime|string
	 */
	public function get_expiry_date( $type, $value ) {
		switch ( $type ) {
			case 'never':
				return '';
			case 'days':
				return date( 'Y-m-d', strtotime( "+{$value} days" ) );
			case 'date':
				return new \WC_DateTime( $value );
		}

		return '';
	}

	/**
	 * Get discount type and amount
	 *
	 * @since 1.0.0
	 *
	 * @param string $type Type.
	 * @param string $amount Amount.
	 */
	public function get_discount_type_and_amount( $type, $amount ) {

		if ( empty( $type ) || empty( $amount ) ) {
			return array(
				'type'   => 'fixed_cart',
				'amount' => 0,
			);
		}

		if ( ! is_numeric( $amount ) ) {
			return array(
				'type'   => 'fixed_cart',
				'amount' => 0,
			);
		}

		if ( $amount < 0 ) {
			return array(
				'type'   => 'fixed_cart',
				'amount' => 0,
			);
		}

		if ( $type === 'fixed_cart' ) {
			return array(
				'type'   => 'fixed_cart',
				'amount' => $amount,
			);
		}

		if ( $type === 'fixed_product' ) {
			return array(
				'type'   => 'fixed_product',
				'amount' => $amount,
			);
		}

		if ( $type === 'percent' ) {
			return array(
				'type'   => 'percent',
				'amount' => $amount > 100 ? 100 : $amount,
			);
		}
	}

	/**
	 * Get fields
	 *
	 * @since 1.0.0
	 *
	 * @return array
	 */
	public function get_fields() {
		return array(
			'general' => array(
				'type'   => 'group',
				'label'  => __( 'General', 'quillcrm' ),
				'fields' => array(
					'title'              => array(
						'type'        => 'text',
						'label'       => __( 'Coupon Title', 'quillcrm' ),
						'helperText'  => __( 'This dynamic coupon can be used in emails or other actions using merge tag: {{coupon:dynamic_id_STEP_ID}}', 'quillcrm' ),
						'description' => __( 'After creating this action step, you can use the generated merge tag to reference this coupon in emails and other actions.', 'quillcrm' ),
					),
					'coupon_prefix'      => array(
						'type'  => 'text',
						'label' => __( 'Coupon Prefix', 'quillcrm' ),
					),
					'discount_type'      => array(
						'type'    => 'discount_type_with_amount',
						'label'   => __( 'Discount Type', 'quillcrm' ),
						'options' => array(
							'fixed_cart'    => __( 'Fixed cart discount', 'quillcrm' ),
							'fixed_product' => __( 'Fixed product discount', 'quillcrm' ),
							'percent'       => __( 'Percentage discount', 'quillcrm' ),
						),
					),
					'coupon_expiry_date' => array(
						'type'  => 'coupon_expiry_date',
						'label' => __( 'Coupon Expiry Date', 'quillcrm' ),
					),
					'is_free_shipping'   => array(
						'type'  => 'checkbox',
						'label' => __( 'Is Free Shipping', 'quillcrm' ),
					),
				),
			),
			'limit'   => array(
				'type'   => 'group',
				'label'  => __( 'Limit', 'quillcrm' ),
				'fields' => array(
					'usage_limit_per_coupon' => array(
						'type'  => 'number',
						'label' => __( 'Usage Limit Per Coupon', 'quillcrm' ),
					),
					'limit_usage_to_x_items' => array(
						'type'  => 'number',
						'label' => __( 'Limit usage to X items', 'quillcrm' ),
					),
					'usage_limit_per_user'   => array(
						'type'  => 'number',
						'label' => __( 'Usage Limit Per User', 'quillcrm' ),
					),
				),
			),
		);
	}

	/**
	 * Get attributes schema
	 *
	 * @since 1.0.0
	 *
	 * @return array
	 */
	public function get_attributes_schema() {
		return array(
			'type'       => 'object',
			'properties' => array(
				'title'                  => array(
					'type'     => 'string',
					'required' => false,
				),
				'discount_type'          => array(
					'type'       => 'object',
					'properties' => array(
						'type'   => array(
							'type'     => 'string',
							'required' => true,
						),
						'amount' => array(
							'type'     => 'number',
							'required' => true,
						),
					),
				),
				'coupon_prefix'          => array(
					'type'     => 'string',
					'required' => false,
				),
				'coupon_expiry_date'     => array(
					'type'       => 'object',
					'properties' => array(
						'value' => array(
							'type'     => 'string',
							'required' => true,
						),
						'type'  => array(
							'type'     => 'string',
							'required' => true,
						),
					),
					'required'   => true,
				),
				'is_free_shipping'       => array(
					'type' => 'boolean',
				),
				'usage_limit_per_coupon' => array(
					'type' => 'string',
				),
				'limit_usage_to_x_items' => array(
					'type' => 'string',
				),
				'usage_limit_per_user'   => array(
					'type' => 'string',
				),
			),
		);
	}
}

Create_Coupon::instance();
