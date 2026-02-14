<?php
/**
 * Campaign Status Manager
 * 
 * @since 1.0.0
 * @package QuillCRM
 */

namespace QuillCRM\Managers;

final class Campaign_Status_Manager
{

  /**
   *  Status constants
   */
  const DRAFT = 'draft';
  const INACTIVE = 'inactive';
  const ACTIVE = 'active';
  const SCHEDULED = 'schedule';
  const PROCESSING = 'processing';
  const COMPLETED = 'completed';
  const RESENDING = 'resending';
  const PAUSED = 'paused';
  const CANCELLED = 'cancelled';
  const FAILED = 'failed';


  /**
   * Class instance 
   * 
   * @var Campaign_Status_Manager
   */
  private static $instance;

  /**
   * Get Instance
   * 
   * @return Campaign_Status_Manager
   */
  public static function instance()
  {
    if (is_null(self::$instance)) {
      self::$instance = new self();
    }
    return self::$instance;
  }

  /**
   * Private constructor
   */
  private function __construct()
  {
  }


  /**
   * Get all statuses
   *
   * @return array
   */
  public function get_all_statuses()
  {
    return [
      self::DRAFT,
      self::INACTIVE,
      self::ACTIVE,
      self::SCHEDULED,
      self::PROCESSING,
      self::COMPLETED,
      self::RESENDING,
      self::PAUSED,
      self::CANCELLED,
      self::FAILED,
    ];
  }

  /**
   * Get status labels
   *
   * @return array
   */
  public function get_status_labels()
  {
    return [
      self::DRAFT => __('Draft', 'quill-crm'),
      self::INACTIVE => __('Inactive', 'quill-crm'),
      self::ACTIVE => __('Active', 'quill-crm'),
      self::SCHEDULED => __('Scheduled', 'quill-crm'),
      self::PROCESSING => __('Processing', 'quill-crm'),
      self::COMPLETED => __('Completed', 'quill-crm'),
      self::RESENDING => __('Resending', 'quill-crm'),
      self::PAUSED => __('Paused', 'quill-crm'),
      self::CANCELLED => __('Cancelled', 'quill-crm'),
      self::FAILED => __('Failed', 'quill-crm'),
    ];
  }


  /**
   * Validate status
   *
   * @param string $status
   * @return bool
   */
  public function is_valid_status($status)
  {
    return in_array($status, $this->get_all_statuses(), true);
  }


  /**
   * Get valid transitions
   *
   * @return array
   */
  public function get_valid_transitions()
  {
    return [
      self::DRAFT => [self::INACTIVE, self::SCHEDULED, self::PROCESSING],
      self::INACTIVE => [self::DRAFT, self::SCHEDULED, self::PROCESSING],
      self::SCHEDULED => [self::DRAFT, self::INACTIVE, self::PROCESSING, self::CANCELLED, self::FAILED],
      self::PROCESSING => [self::COMPLETED, self::PAUSED, self::CANCELLED, self::FAILED],
      self::PAUSED => [self::PROCESSING, self::CANCELLED],
      self::COMPLETED => [self::RESENDING],
      self::RESENDING => [self::COMPLETED, self::CANCELLED],
      self::CANCELLED => [],
      self::FAILED => [], // Terminal state, no transitions allowed
    ];
  }

  /**
   * Validate transition
   *
   * @param string $from_status
   * @param string $to_status
   * @return bool
   */
  public function is_valid_transition($from_status, $to_status)
  {
    $transitions = $this->get_valid_transitions();
    return isset($transitions[$from_status]) &&
      in_array($to_status, $transitions[$from_status], true);
  }
}