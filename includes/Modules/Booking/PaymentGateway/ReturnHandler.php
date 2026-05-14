<?php
/**
 * Payment Gateway Return Handler
 *
 * @since 1.0.0
 * @package DoubleScale
 */

use DoubleScale\Modules\Booking\Models\BookingModel;

/**
 * Initialize the payment return handler
 */
function doublescale_booking_payment_return_handler() {
    // Check if this is a payment return
    if (isset($_GET['doublescale_booking_payment'])) {
        $mode = sanitize_text_field($_GET['doublescale_booking_payment']);
        $method = isset($_GET['method']) ? sanitize_text_field($_GET['method']) : '';
        $action = isset($_GET['action']) ? sanitize_text_field($_GET['action']) : '';
        $booking_id = isset($_GET['booking_id']) ? sanitize_text_field($_GET['booking_id']) : '';
        
        if (!$booking_id) {
            wp_die(__('Invalid booking ID.', 'doublescale'));
        }
        
        try {
            $booking = BookingModel::getByHashId($booking_id);
            
            if (!$booking) {
                wp_die(__('Booking not found.', 'doublescale'));
            }
            
            // Log the payment return
            $booking->logs()->create([
                'type'    => 'info',
                /* translators: 1: payment action (e.g. return, cancel), 2: gateway name */
                'message' => sprintf(__('Payment %1$s return from %2$s', 'doublescale'), $action, $method),
                /* translators: %s: payment gateway name */
                'details' => sprintf(__('User returned from payment gateway: %s', 'doublescale'), $method),
            ]);
            
            // Determine redirect URL based on action
            if ($action === 'return') {
                // Redirect to confirmation page - use home_url() which includes the full site path
                $redirect_url = home_url("/?doublescale_booking=booking&id={$booking_id}&type=confirm");
            } elseif ($action === 'cancel') {
                $redirect_url = home_url("/?doublescale_booking=booking&id={$booking_id}&type=cancel");
            } else {
                $redirect_url = home_url("/?doublescale_booking=booking&id={$booking_id}&type=confirm");
            }
            
            doublescale_get_logger()->info(
                'Redirecting payment return',
                array(
                    'source'       => 'booking-payment-return',
                    'booking_id'   => (int) $booking_id,
                    'redirect_url' => $redirect_url,
                )
            );

            wp_redirect($redirect_url);
            exit;
            
        } catch (Exception $e) {
            wp_die($e->getMessage());
        }
    }
}
add_action('init', 'doublescale_booking_payment_return_handler', 5); 