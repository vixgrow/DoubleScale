<?php
/**
 * Read-only contact abilities.
 *
 * @package DoubleScale\Modules\Contacts
 */

namespace DoubleScale\Modules\Contacts\Abilities;

defined( 'ABSPATH' ) || exit;

use DoubleScale\Core\Abilities\AbilityCategories;
use DoubleScale\Core\Abilities\AbilityInput;
use DoubleScale\Core\Abilities\AbilityResult;
use DoubleScale\Core\UserRoles\Permissions;
use DoubleScale\Modules\Contacts\Models\ContactModel;
use DoubleScale\Modules\Contacts\Models\ListModel;
use DoubleScale\Modules\Contacts\Models\TagModel;

/**
 * Contacts are team-wide in DoubleScale, so there is no owner column here —
 * Gate 2 (can_read_contacts) is the whole access story for this module.
 */
final class ContactAbilities {

	/**
	 * Email subscription statuses actually written by the CRM.
	 *
	 * There is no central constant for these — importers and form handlers
	 * write the literals directly (e.g. Modules/Forms/Abstracts/Form.php:232),
	 * and the stored set was confirmed against the contacts table. Advertising
	 * a status the data never uses makes an agent filter to an empty result and
	 * report "no contacts" as though it were a fact.
	 */
	public const EMAIL_STATUSES = array( 'subscribed', 'unsubscribed', 'unverified' );

	/**
	 * Ability definitions.
	 *
	 * @since 1.0.0
	 *
	 * @return array<string, array<string, mixed>>
	 */
	public static function definitions(): array {
		$permission = array( Permissions::class, 'can_read_contacts' );

		return array(
			'doublescale/list-contacts'         => array(
				'module_slug'      => 'contacts',
				'label'            => __( 'List contacts', 'doublescale' ),
				'description'      => __( 'Search and page through CRM contacts. Returns id, name, email, phone, company, and status for each match. Use get-contact for the full record.', 'doublescale' ),
				'category'         => AbilityCategories::CONTACTS,
				'permission'       => $permission,
				'input_schema'     => array(
					'type'       => 'object',
					'properties' => array(
						'search' => array(
							'type'        => 'string',
							'description' => 'Free-text match on first name, last name, email, company, or phone.',
						),
						'status' => array(
							'type'        => 'string',
							'description' => 'Email subscription status.',
							'enum'        => self::EMAIL_STATUSES,
						),
						'limit'  => array(
							'type'    => 'integer',
							'minimum' => 1,
							'maximum' => 100,
							'default' => 20,
						),
						'offset' => array(
							'type'    => 'integer',
							'minimum' => 0,
							'default' => 0,
						),
					),
				),
				'execute_callback' => array( self::class, 'list_contacts' ),
			),

			'doublescale/get-contact'           => array(
				'module_slug'      => 'contacts',
				'label'            => __( 'Get contact', 'doublescale' ),
				'description'      => __( 'Full record for one contact, including address, company, tags, and lists. Look up by id or by email address.', 'doublescale' ),
				'category'         => AbilityCategories::CONTACTS,
				'permission'       => $permission,
				'input_schema'     => array(
					'type'       => 'object',
					'properties' => array(
						'id'    => array(
							'type'        => 'integer',
							'description' => 'Contact id. Provide this or email.',
						),
						'email' => array(
							'type'        => 'string',
							'description' => 'Email address. Provide this or id.',
						),
					),
				),
				'execute_callback' => array( self::class, 'get_contact' ),
			),

			'doublescale/list-contact-segments' => array(
				'module_slug'      => 'contacts',
				'label'            => __( 'List tags and lists', 'doublescale' ),
				'description'      => __( 'All contact tags and lists with their ids. Call this to resolve a tag or list name to an id before filtering contacts by it.', 'doublescale' ),
				'category'         => AbilityCategories::CONTACTS,
				'permission'       => $permission,
				'input_schema'     => array(
					'type'       => 'object',
					'properties' => array(
						'type' => array(
							'type'        => 'string',
							'description' => 'Restrict to one kind. Defaults to both.',
							'enum'        => array( 'tag', 'list' ),
						),
					),
				),
				'execute_callback' => array( self::class, 'list_segments' ),
			),

			'doublescale/create-contact'        => array(
				'module_slug'      => 'contacts',
				'label'            => __( 'Create a contact', 'doublescale' ),
				'description'      => __( 'Add a new contact. Email must be unique — if someone already has that address, use update-contact instead. Creating a contact does not email them.', 'doublescale' ),
				'category'         => AbilityCategories::CONTACTS,
				'permission'       => array( self::class, 'can_write_contacts' ),
				'input_schema'     => array(
					'type'       => 'object',
					'properties' => array(
						'email'        => array(
							'type'        => 'string',
							'description' => 'Email address. Must not already belong to another contact.',
						),
						'first_name'   => array(
							'type'        => 'string',
							'description' => 'First name.',
						),
						'last_name'    => array(
							'type'        => 'string',
							'description' => 'Last name.',
						),
						'phone'        => array(
							'type'        => 'string',
							'description' => 'Phone number, digits with an optional leading +.',
						),
						'company_name' => array(
							'type'        => 'string',
							'description' => 'Company the contact works for.',
						),
					),
					'required'   => array( 'email' ),
				),
				'meta'             => array(
					'annotations' => array(
						'readonly'      => false,
						'destructive'   => false,
						'idempotent'    => false,
						// No welcome email or automation fires on a bare create.
						'openWorldHint' => false,
					),
				),
				'execute_callback' => array( self::class, 'create_contact' ),
			),

			'doublescale/update-contact'        => array(
				'module_slug'      => 'contacts',
				'label'            => __( 'Update a contact', 'doublescale' ),
				'description'      => __( 'Change a contact\'s name, phone, or company. Email and subscription status are deliberately not editable here — changing those affects deliverability and consent.', 'doublescale' ),
				'category'         => AbilityCategories::CONTACTS,
				'permission'       => array( self::class, 'can_write_contacts' ),
				'input_schema'     => array(
					'type'       => 'object',
					'properties' => array(
						'id'           => array(
							'type'        => 'integer',
							'description' => 'Contact id.',
						),
						'first_name'   => array(
							'type'        => 'string',
							'description' => 'New first name.',
						),
						'last_name'    => array(
							'type'        => 'string',
							'description' => 'New last name.',
						),
						'phone'        => array(
							'type'        => 'string',
							'description' => 'New phone number.',
						),
						'company_name' => array(
							'type'        => 'string',
							'description' => 'New company name.',
						),
					),
					'required'   => array( 'id' ),
				),
				'meta'             => array(
					'annotations' => array(
						'readonly'      => false,
						'destructive'   => false,
						'idempotent'    => true,
						'openWorldHint' => false,
					),
				),
				'execute_callback' => array( self::class, 'update_contact' ),
			),
		);
	}

	/**
	 * Gate 2 for contact writes.
	 *
	 * Reading a contact is broad (project users need it to pick one); changing
	 * one is a sales-team action, so the write gate is deliberately narrower
	 * than the read gate on the same module.
	 *
	 * @since 1.0.0
	 *
	 * @return bool
	 */
	public static function can_write_contacts(): bool {
		return Permissions::has_sales_rep_access();
	}

	/**
	 * Create a contact.
	 *
	 * @since 1.0.0
	 *
	 * @param array<string, mixed> $input Ability input.
	 * @return array<string, mixed>|\WP_Error
	 */
	public static function create_contact( array $input ) {
		$invalid = AbilityInput::required( $input, array( 'email' ) );
		if ( $invalid ) {
			return $invalid;
		}

		$email = trim( (string) $input['email'] );

		if ( ! is_email( $email ) ) {
			return new \WP_Error(
				'doublescale_invalid_email',
				sprintf(
					/* translators: %s: the supplied address */
					__( '"%s" is not a valid email address.', 'doublescale' ),
					$email
				),
				array( 'status' => 400 )
			);
		}

		// The model allows duplicates; the admin UI blocks them. Without this an
		// agent asked twice to "add Layla" silently creates two records that
		// then split her history between them.
		$existing = ContactModel::query()->where( 'email', $email )->first();
		if ( $existing ) {
			return new \WP_Error(
				'doublescale_contact_exists',
				sprintf(
					/* translators: 1: email address, 2: existing contact id */
					__( 'A contact with the address %1$s already exists (id %2$d). Use update-contact to change it.', 'doublescale' ),
					$email,
					(int) $existing->id
				),
				array(
					'status'     => 409,
					'contact_id' => (int) $existing->id,
				)
			);
		}

		$contact = ContactModel::create(
			array(
				'email'        => $email,
				'first_name'   => isset( $input['first_name'] ) ? (string) $input['first_name'] : '',
				'last_name'    => isset( $input['last_name'] ) ? (string) $input['last_name'] : '',
				'phone'        => isset( $input['phone'] ) ? (string) $input['phone'] : '',
				'company_name' => isset( $input['company_name'] ) ? (string) $input['company_name'] : '',
				'email_status' => 'unverified',
			)
		);

		if ( ! $contact ) {
			return new \WP_Error(
				'doublescale_contact_not_created',
				__( 'The contact could not be created.', 'doublescale' ),
				array( 'status' => 400 )
			);
		}

		return array(
			'created'    => true,
			'contact_id' => (int) $contact->id,
			'email'      => $contact->email,
		);
	}

	/**
	 * Update a contact.
	 *
	 * @since 1.0.0
	 *
	 * @param array<string, mixed> $input Ability input.
	 * @return array<string, mixed>|\WP_Error
	 */
	public static function update_contact( array $input ) {
		$invalid = AbilityInput::first_error(
			array(
				AbilityInput::required( $input, array( 'id' ) ),
				AbilityInput::id( $input['id'] ?? null, 'id' ),
			)
		);
		if ( $invalid ) {
			return $invalid;
		}

		$contact = ContactModel::query()->where( 'id', (int) $input['id'] )->first();
		if ( ! $contact ) {
			return AbilityResult::not_found( __( 'No contact found with that id.', 'doublescale' ) );
		}

		$changed = array();
		foreach ( array( 'first_name', 'last_name', 'phone', 'company_name' ) as $field ) {
			if ( ! isset( $input[ $field ] ) ) {
				continue;
			}
			$value = (string) $input[ $field ];
			if ( $value !== (string) $contact->{$field} ) {
				$contact->{$field} = $value;
				$changed[]         = $field;
			}
		}

		if ( array() === $changed ) {
			return array(
				'updated'    => false,
				'contact_id' => (int) $contact->id,
				'message'    => __( 'Nothing to change — the contact already has those values.', 'doublescale' ),
			);
		}

		$contact->save();

		return array(
			'updated'    => true,
			'contact_id' => (int) $contact->id,
			'changed'    => $changed,
		);
	}

	/**
	 * List contacts.
	 *
	 * @since 1.0.0
	 *
	 * @param array<string, mixed> $input Ability input.
	 * @return array<string, mixed>
	 */
	public static function list_contacts( array $input ): array {
		$limit  = AbilityResult::limit( $input );
		$offset = AbilityResult::offset( $input );

		$query = ContactModel::query();

		$search = isset( $input['search'] ) ? trim( (string) $input['search'] ) : '';
		if ( '' !== $search ) {
			$like = '%' . $search . '%';
			$query->where(
				static function ( $sub ) use ( $like ) {
					$sub->where( 'first_name', 'LIKE', $like )
						->orWhere( 'last_name', 'LIKE', $like )
						->orWhere( 'email', 'LIKE', $like )
						->orWhere( 'company_name', 'LIKE', $like )
						->orWhere( 'phone', 'LIKE', $like );
				}
			);
		}

		if ( ! empty( $input['status'] ) ) {
			$query->where( 'email_status', (string) $input['status'] );
		}

		$total = (int) $query->count();

		$rows = $query->orderBy( 'created_at', 'desc' )
			->limit( $limit )
			->offset( $offset )
			->get();

		$items = array();
		foreach ( $rows as $row ) {
			$items[] = self::shape_summary( $row );
		}

		return AbilityResult::collection( $items, $total, $limit, $offset );
	}

	/**
	 * Get one contact by id or email.
	 *
	 * @since 1.0.0
	 *
	 * @param array<string, mixed> $input Ability input.
	 * @return array<string, mixed>|\WP_Error
	 */
	public static function get_contact( array $input ) {
		$id    = isset( $input['id'] ) ? (int) $input['id'] : 0;
		$email = isset( $input['email'] ) ? trim( (string) $input['email'] ) : '';

		if ( $id <= 0 && '' === $email ) {
			return new \WP_Error(
				'doublescale_missing_identifier',
				__( 'Provide either a contact id or an email address.', 'doublescale' ),
				array( 'status' => 400 )
			);
		}

		// Eager-load so the shaper does not fire a query per relation.
		$query = ContactModel::query()->with( array( 'tags', 'lists' ) );

		$contact = $id > 0
			? $query->where( 'id', $id )->first()
			: $query->where( 'email', $email )->first();

		if ( ! $contact ) {
			return AbilityResult::not_found( __( 'No contact found for that identifier.', 'doublescale' ) );
		}

		$data = self::shape_summary( $contact );

		$data['company_name'] = $contact->company_name;
		$data['address']      = array_filter(
			array(
				'address_1' => $contact->address_1,
				'address_2' => $contact->address_2,
				'city'      => $contact->city,
				'state'     => $contact->state,
				'country'   => $contact->country,
				'zip'       => $contact->zip,
			),
			static function ( $value ) {
				return null !== $value && '' !== $value;
			}
		);

		$data['tags']  = self::shape_terms( $contact->tags );
		$data['lists'] = self::shape_terms( $contact->lists );

		return $data;
	}

	/**
	 * List tags and lists.
	 *
	 * @since 1.0.0
	 *
	 * @param array<string, mixed> $input Ability input.
	 * @return array<string, mixed>
	 */
	public static function list_segments( array $input ): array {
		$type = isset( $input['type'] ) ? (string) $input['type'] : '';
		$out  = array();

		if ( 'list' !== $type ) {
			$out['tags'] = self::shape_terms( TagModel::query()->orderBy( 'name' )->get() );
		}

		if ( 'tag' !== $type ) {
			$out['lists'] = self::shape_terms( ListModel::query()->orderBy( 'name' )->get() );
		}

		return $out;
	}

	/**
	 * Shape a contact row for list output.
	 *
	 * @since 1.0.0
	 *
	 * @param ContactModel $contact Contact.
	 * @return array<string, mixed>
	 */
	private static function shape_summary( $contact ): array {
		$name = trim( (string) $contact->first_name . ' ' . (string) $contact->last_name );

		return array(
			'id'           => (int) $contact->id,
			'name'         => '' !== $name ? $name : (string) $contact->email,
			'email'        => $contact->email,
			'phone'        => $contact->phone,
			'company_name' => $contact->company_name,
			'email_status' => $contact->email_status,
			'created_at'   => $contact->created_at,
		);
	}

	/**
	 * Shape a tag/list collection.
	 *
	 * @since 1.0.0
	 *
	 * @param iterable<object> $terms Terms.
	 * @return array<int, array<string, mixed>>
	 */
	private static function shape_terms( $terms ): array {
		$out = array();

		// NOT (array) — casting an Eloquent Collection yields its internal
		// `items` property as one element, so every term is silently dropped
		// and the agent is told the site has no tags at all.
		foreach ( ( $terms ?? array() ) as $term ) {
			if ( ! is_object( $term ) ) {
				continue;
			}
			$out[] = array(
				'id'   => (int) $term->id,
				'name' => $term->name,
				'slug' => $term->slug ?? null,
			);
		}
		return $out;
	}
}
