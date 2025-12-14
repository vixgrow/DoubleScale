/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * External dependencies
 */
import React from 'react';

/**
 * Internal dependencies
 */
import ContactMappedFieldsCsv from './csv';
import ContactMappedFieldsForm from './form';

interface ContactMappedFieldsProps {
	onChange: (value: { [key: string]: string }) => void;
	values: { [key: string]: string };
	fields: {
		[key: string]:
		| {
			label: {
				label: string;
				type: string;
			};
		}
		| {
			label: string;
		};
	};
	source?: string; // Optional source prop to distinguish CSV vs form imports
}

/**
 * Main ContactMappedFields component that routes to CSV or Form component
 * based on the source prop
 */
const ContactMappedFields: React.FC<ContactMappedFieldsProps> = ({
	onChange,
	values,
	fields,
	source,
}) => {
	// For CSV imports, use the simple CSV component
	if (source === 'csv') {
		return (
			<ContactMappedFieldsCsv
				onChange={onChange}
				values={values}
				fields={fields as { [key: string]: { label: string } }}
			/>
		);
	}

	// For all other sources (forms, etc.), use the Form component with merge tags
	return (
		<ContactMappedFieldsForm
			onChange={onChange}
			values={values}
			fields={fields}
		/>
	);
};

export default ContactMappedFields;
