/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
import { useState } from '@wordpress/element';

/**
 * External dependencies
 */
import { map } from 'lodash';
import { CheckCheck } from 'lucide-react';

/**
 * Internal dependencies
 */
import './style.scss';
import type { Integration as IntegrationType } from '@doublescale/config';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@doublescale/components/ui/button';
import SelectField from '../select-field';
import { CopyIcon } from '@doublescale/components';

const CopyButton: React.FC<{ value: string; label: string }> = ({ value, label }) => {
	const [copied, setCopied] = useState(false);

	const handleCopy = () => {
		navigator.clipboard.writeText(value).then(() => {
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
		});
	};

	return (
		<Button
			type="button"
			variant="outline"
			size="icon"
			className="shrink-0 h-12"
			onClick={handleCopy}
			title={
				copied
					? __('Copied!', 'doublescale')
					: sprintf(__('Copy %s', 'doublescale'), label)
			}
		>
			{copied ? (
				<CheckCheck className="w-4 h-4 text-green-600" />
			) : (
				<CopyIcon width={16} height={16} />
			)}
		</Button>
	);
};

interface CredentialsProps {
	integration: IntegrationType;
	slug: string;
	fieldsValue: Record<string, any>;
	setFieldsValue: (value: Record<string, any>) => void;
}

const Credentials: React.FC<CredentialsProps> = ({
	integration,
	slug,
	fieldsValue,
	setFieldsValue,
}) => {
	const { fields } = integration;

	const checkConditions = (conditions, fieldsValue) => {
		let result = true;

		map(conditions, (condition, field) => {
			if (result) {
				switch (condition.operator) {
					case '==':
						result = fieldsValue[field] === condition.value;
						break;
					case '!=':
						result = fieldsValue[field] !== condition.value;
						break;
					case '>':
						result = fieldsValue[field] > condition.value;
						break;
					case '<':
						result = fieldsValue[field] < condition.value;
						break;
					case '>=':
						result = fieldsValue[field] >= condition.value;
						break;
					case '<=':
						result = fieldsValue[field] <= condition.value;
						break;
					default:
						break;
				}
			}
		});

		return result;
	};

	return (
		<div className="space-y-4">
			{map(fields, (field, key) => {
				if (
					field.conditions &&
					!checkConditions(field.conditions, fieldsValue)
				) {
					return null;
				}

				const isViewOnly =
					Array.isArray(field.context) &&
					field.context.includes('view') &&
					!field.context.includes('edit');
				const displayValue = fieldsValue[key] || '';

				return (
					<div key={key} className="space-y-2">
						<Label htmlFor={key}>{field.label}</Label>
						{!field.has_options && (
							<div className="flex items-center gap-2">
								<Input
									id={key}
									value={typeof displayValue === 'string' ? displayValue : ''}
									readOnly={isViewOnly}
									disabled={isViewOnly}
									onChange={
										isViewOnly
											? undefined
											: (e) => {
													setFieldsValue({
														...fieldsValue,
														[key]: e.target.value,
													});
												}
									}
									className={`h-12 ${isViewOnly ? 'font-mono text-xs bg-gray-50' : 'bg-white'}`}
								/>
								{isViewOnly && typeof displayValue === 'string' && (
									<CopyButton value={displayValue} label={field.label} />
								)}
							</div>
						)}
						{field.has_options && (
							<SelectField
								integration={slug}
								slug={field.endpoint || ''}
								onChange={(value) => {
									setFieldsValue({
										...fieldsValue,
										[key]: value,
									});
								}}
								value={fieldsValue[key] || ''}
							/>
						)}
					</div>
				);
			})}
		</div>
	);
};

export default Credentials;
