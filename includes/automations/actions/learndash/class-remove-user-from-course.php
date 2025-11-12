<?php
/**
 * Class Remove User From Course
 *
 * @since 1.0.0
 *
 * @package QuillCRM
 */

namespace QuillCRM\Automations\Actions\LearnDash;

use QuillCRM\Abstracts\Action;
use QuillCRM\Models\Automation_Contact_Model;
use QuillCRM\Models\Automation_Model;
use QuillCRM\Models\Automation_Step_Model;
use QuillCRM\Managers\Actions_Manager;

/**
 * Remove User From Course
 */
class Remove_User_From_Course extends Action {

	/**
	 * Action Name
	 *
	 * @var string
	 */
	public $name = 'Remove User From Course';

	/**
	 * Action Slug
	 *
	 * @var string
	 */
	public $slug = 'learndash_remove_user_from_course';

	/**
	 * Action Description
	 *
	 * @var string
	 */
	public $description = 'This action will remove a user from a course.';

	/**
	 * Action Attributes
	 *
	 * @var array
	 */
	public $attributes = array();

	/**
	 * Source
	 *
	 * @var string
	 */
	public $source = 'lms';

	/**
	 * Group
	 *
	 * @var string
	 */
	public $group = 'learndash';

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
		$contact = $automation_contact->contact;
		$user    = get_user_by( 'email', $contact->email );
		if ( ! $user ) {
			quillcrm_get_logger()->warning(
				__( 'User not found for LearnDash course removal', 'quillcrm' ),
				array(
					'code'          => 'learndash_user_not_found',
					'contact_email' => $contact->email,
					'automation_id' => $automation->id,
					'step_id'       => $step->id,
				)
			);
			return false;
		}

		$course_id = $step->get_setting( 'course_id' );
		if ( ! $course_id ) {
			quillcrm_get_logger()->warning(
				__( 'Course ID not configured for LearnDash removal action', 'quillcrm' ),
				array(
					'code'          => 'learndash_course_id_missing',
					'automation_id' => $automation->id,
					'step_id'       => $step->id,
				)
			);
			return false;
		}

		// Check if LearnDash function exists
		if ( ! function_exists( 'ld_update_course_access' ) ) {
			quillcrm_get_logger()->error(
				__( 'LearnDash plugin is not active. Cannot remove user from course.', 'quillcrm' ),
				array(
					'code'          => 'learndash_plugin_inactive',
					'user_id'       => $user->ID,
					'course_id'     => $course_id,
					'automation_id' => $automation->id,
					'step_id'       => $step->id,
				)
			);
			return false;
		}

		// Execute the action
		ld_update_course_access( $user->ID, $course_id, true );

		quillcrm_get_logger()->info(
			__( 'User successfully removed from LearnDash course', 'quillcrm' ),
			array(
				'code'          => 'learndash_course_removed',
				'user_id'       => $user->ID,
				'course_id'     => $course_id,
				'automation_id' => $automation->id,
				'step_id'       => $step->id,
			)
		);

		return true;
	}

	/**
	 * Get Courses
	 *
	 * @since 1.0.0
	 */
	public function get_courses() {
		if ( ! function_exists( 'learndash_get_courses' ) ) {
			return array();
		}
		$courses = learndash_get_courses();

		$options = array();
		foreach ( $courses as $course ) {
			$options[ $course->ID ] = $course->post_title;
		}

		return $options;
	}

	/**
	 * Get fields.
	 *
	 * @since 1.0.0
	 *
	 * @return array
	 */
	public function get_fields() {
		return array(
			'course_id' => array(
				'type'    => 'select',
				'label'   => __( 'Course', 'quillcrm' ),
				'options' => $this->get_courses(),
			),
		);
	}

	/**
	 * Get Attributes schema.
	 *
	 * @since 1.0.0
	 *
	 * @return array
	 */
	public function get_attributes_schema() {
		return array(
			'type'       => 'object',
			'properties' => array(
				'course_id' => array(
					'type'        => 'string',
					'label'       => 'Course ID',
					'description' => 'Course ID to remove user from.',
					'required'    => true,
				),
			),
		);
	}
}

Remove_User_From_Course::instance();
