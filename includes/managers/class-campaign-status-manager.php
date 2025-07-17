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
      self::DRAFT => __('Draft', 'quillcrm'),
      self::INACTIVE => __('Inactive', 'quillcrm'),
      self::ACTIVE => __('Active', 'quillcrm'),
      self::SCHEDULED => __('Scheduled', 'quillcrm'),
      self::PROCESSING => __('Processing', 'quillcrm'),
      self::COMPLETED => __('Completed', 'quillcrm'),
      self::RESENDING => __('Resending', 'quillcrm'),
      self::PAUSED => __('Paused', 'quillcrm'),
      self::CANCELLED => __('Cancelled', 'quillcrm'),
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
      self::SCHEDULED => [self::DRAFT, self::INACTIVE, self::PROCESSING, self::CANCELLED],
      self::PROCESSING => [self::COMPLETED, self::PAUSED, self::CANCELLED],
      self::PAUSED => [self::PROCESSING, self::CANCELLED],
      self::COMPLETED => [self::RESENDING],
      self::RESENDING => [self::COMPLETED, self::CANCELLED],
      self::CANCELLED => [],
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