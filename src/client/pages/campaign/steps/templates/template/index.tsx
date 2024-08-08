/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * External dependencies
 */
import { Input, Card, Typography, Checkbox } from 'antd';

/**
 * Internal dependencies
 */
import './style.scss';
import type { Template } from '../../../../types';

interface Props {
	template: Template;
	updateTemplate: (data: { [key: string]: any }) => void;
}

const TemplateForm: React.FC<Props> = ({ template, updateTemplate }) => {
	const { from_name, from_email, subject, body } = template;

	return (
		<Card>
			<div className="qcrm-fields">
				<div className="qcrm-field">
					<div className="qcrm-field-label">
						<Typography.Text>
							{__('From Name', 'quillcrm')}
						</Typography.Text>
					</div>
					<div className="qcrm-field-input">
						<Input
							value={from_name}
							onChange={(e) =>
								updateTemplate({
									from_name: e.target.value,
								})
							}
							status={from_name ? '' : 'error'}
						/>
					</div>
				</div>
				<div className="qcrm-field">
					<div className="qcrm-field-label">
						<Typography.Text>
							{__('From Email', 'quillcrm')}
						</Typography.Text>
					</div>
					<div className="qcrm-field-input">
						<Input
							value={from_email}
							onChange={(e) =>
								updateTemplate({
									from_email: e.target.value,
								})
							}
							status={from_email ? '' : 'error'}
						/>
					</div>
				</div>
				<div className="qcrm-field">
					<div className="qcrm-field-label">
						<Typography.Text>
							{__('Reply To', 'quillcrm')}
						</Typography.Text>
					</div>
					<div className="qcrm-field-input">
						<Input
							type="email"
							value={template.reply_to}
							onChange={(e) =>
								updateTemplate({
									reply_to: e.target.value,
								})
							}
						/>
					</div>
				</div>
				<div className="qcrm-field">
					<div className="qcrm-field-label">
						<Typography.Text>
							{__('Subject', 'quillcrm')}
						</Typography.Text>
					</div>
					<div className="qcrm-field-input">
						<Input
							value={subject}
							onChange={(e) =>
								updateTemplate({
									subject: e.target.value,
								})
							}
							status={subject ? '' : 'error'}
						/>
					</div>
				</div>
				<div className="qcrm-field">
					<div className="qcrm-field-label">
						<Typography.Text>
							{__('Preview Text', 'quillcrm')}
						</Typography.Text>
					</div>
					<div className="qcrm-field-input">
						<Input
							value={template.preview_text}
							onChange={(e) =>
								updateTemplate({
									preview_text: e.target.value,
								})
							}
						/>
					</div>
				</div>
				<div className="qcrm-field">
					<div className="qcrm-field-label">
						<Typography.Text>
							{__('Body', 'quillcrm')}
						</Typography.Text>
					</div>
					<div className="qcrm-field-input">
						<Input.TextArea
							value={body}
							onChange={(e) =>
								updateTemplate({
									body: e.target.value,
								})
							}
							status={body ? '' : 'error'}
						/>
					</div>
				</div>
				<div className="qcrm-field">
					<div className="qcrm-field-label">
						<Typography.Text>
							{__('Enable UTM', 'quillcrm')}
						</Typography.Text>
					</div>
					<div className="qcrm-field-input">
						<Checkbox
							checked={template.enable_utm}
							onChange={(e) =>
								updateTemplate({
									enable_utm: e.target.checked,
								})
							}
						>
							{__('Enable UTM', 'quillcrm')}
						</Checkbox>
					</div>
				</div>
				{template.enable_utm && (
					<>
						<div className="qcrm-field">
							<div className="qcrm-field-label">
								<Typography.Text>
									{__('UTM Source', 'quillcrm')}
								</Typography.Text>
							</div>
							<div className="qcrm-field-input">
								<Input
									value={template.utm_source}
									onChange={(e) =>
										updateTemplate({
											utm_source: e.target.value,
										})
									}
								/>
							</div>
						</div>
						<div className="qcrm-field">
							<div className="qcrm-field-label">
								<Typography.Text>
									{__('UTM Medium', 'quillcrm')}
								</Typography.Text>
							</div>
							<div className="qcrm-field-input">
								<Input
									value={template.utm_medium}
									onChange={(e) =>
										updateTemplate({
											utm_medium: e.target.value,
										})
									}
								/>
							</div>
						</div>
						<div className="qcrm-field">
							<div className="qcrm-field-label">
								<Typography.Text>
									{__('UTM Name', 'quillcrm')}
								</Typography.Text>
							</div>
							<div className="qcrm-field-input">
								<Input
									value={template.utm_name}
									onChange={(e) =>
										updateTemplate({
											utm_name: e.target.value,
										})
									}
								/>
							</div>
						</div>
						<div className="qcrm-field">
							<div className="qcrm-field-label">
								<Typography.Text>
									{__('UTM Term', 'quillcrm')}
								</Typography.Text>
							</div>
							<div className="qcrm-field-input">
								<Input
									value={template.utm_term}
									onChange={(e) =>
										updateTemplate({
											utm_term: e.target.value,
										})
									}
								/>
							</div>
						</div>
						<div className="qcrm-field">
							<div className="qcrm-field-label">
								<Typography.Text>
									{__('UTM Content', 'quillcrm')}
								</Typography.Text>
							</div>
							<div className="qcrm-field-input">
								<Input
									value={template.utm_content}
									onChange={(e) =>
										updateTemplate({
											utm_content: e.target.value,
										})
									}
								/>
							</div>
						</div>
					</>
				)}
			</div>
		</Card>
	);
};

export default TemplateForm;
