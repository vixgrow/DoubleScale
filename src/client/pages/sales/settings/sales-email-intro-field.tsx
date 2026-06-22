/**
 * Rich-text field for sales email intro templates.
 */

import React from 'react';
import { __ } from '@wordpress/i18n';

import { RichTextEditor } from '@/components/rich-text-editor';

interface SalesEmailIntroFieldProps {
	value: string;
	onChange: (value: string) => void;
}

export const SalesEmailIntroField: React.FC<SalesEmailIntroFieldProps> = ({
	value,
	onChange,
}) => (
	<RichTextEditor
		content={value}
		onChange={onChange}
		placeholder={__('Write the email introduction…', 'doublescale')}
	/>
);
