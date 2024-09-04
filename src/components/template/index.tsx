/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * External dependencies
 */
import { Card } from 'antd';

/**
 * Internal dependencies
 */
import './style.scss';
import type { Template } from '@quillcrm/client';
import Field from '../field';

interface Props {
	template: Template;
	updateTemplate: (data: { [key: string]: any }) => void;
}

const TemplateForm: React.FC<Props> = ({ template, updateTemplate }) => {
	const { from_name, from_email, subject, body } = template;

	return (
		<Card>
			<div className="qcrm-fields">
				<Field
					label={__('From Name', 'quillcrm')}
					value={from_name}
					onChange={(value) =>
						updateTemplate({
							from_name: value,
						})
					}
					type="text"
					status={from_name ? '' : 'error'}
				/>
				<Field
					label={__('From Email', 'quillcrm')}
					value={from_email}
					onChange={(value) =>
						updateTemplate({
							from_email: value,
						})
					}
					type="email"
					status={from_email ? '' : 'error'}
				/>
				<Field
					label={__('Reply To', 'quillcrm')}
					value={template.reply_to}
					onChange={(value) =>
						updateTemplate({
							reply_to: value,
						})
					}
					type="email"
				/>
				<Field
					label={__('Subject', 'quillcrm')}
					value={subject}
					onChange={(value) =>
						updateTemplate({
							subject: value,
						})
					}
					type="text"
					status={subject ? '' : 'error'}
				/>
				<Field
					label={__('Preview Text', 'quillcrm')}
					value={template.preview_text}
					onChange={(value) =>
						updateTemplate({
							preview_text: value,
						})
					}
					type="text"
				/>
				<Field
					label={__('Body', 'quillcrm')}
					value={body}
					onChange={(value) =>
						updateTemplate({
							body: value,
						})
					}
					type="textarea"
					status={body ? '' : 'error'}
				/>
				<Field
					label={__('Enable UTM', 'quillcrm')}
					value={template.enable_utm}
					onChange={(value) =>
						updateTemplate({
							enable_utm: value,
						})
					}
					type="checkbox"
				/>
				{template.enable_utm && (
					<>
						<Field
							label={__('UTM Source', 'quillcrm')}
							value={template.utm_source}
							onChange={(value) =>
								updateTemplate({
									utm_source: value,
								})
							}
							type="text"
						/>
						<Field
							label={__('UTM Medium', 'quillcrm')}
							value={template.utm_medium}
							onChange={(value) =>
								updateTemplate({
									utm_medium: value,
								})
							}
							type="text"
						/>
						<Field
							label={__('UTM Medium', 'quillcrm')}
							value={template.utm_medium}
							onChange={(value) =>
								updateTemplate({
									utm_medium: value,
								})
							}
							type="text"
						/>
						<Field
							label={__('UTM Name', 'quillcrm')}
							value={template.utm_name}
							onChange={(value) =>
								updateTemplate({
									utm_name: value,
								})
							}
							type="text"
						/>
						<Field
							label={__('UTM Term', 'quillcrm')}
							value={template.utm_term}
							onChange={(value) =>
								updateTemplate({
									utm_term: value,
								})
							}
							type="text"
						/>
						<Field
							label={__('UTM Content', 'quillcrm')}
							value={template.utm_content}
							onChange={(value) =>
								updateTemplate({
									utm_content: value,
								})
							}
							type="text"
						/>
					</>
				)}
			</div>
		</Card>
	);
};

export default TemplateForm;
