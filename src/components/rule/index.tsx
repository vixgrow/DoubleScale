/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * External dependencies
 */
import { Trash2 } from 'lucide-react';
import { map } from 'lodash';

/**
 * Internal dependencies
 */
import './style.scss';
import type { Rule as RuleSettings } from '@quillcrm/config';
import { Rule as RuleType } from '@quillcrm/client';
import Field from '../field';
import { Button } from '@/components/ui/button';

interface RuleProps {
	ruleSettings: RuleSettings;
	rule: RuleType;
	onChange: (key: string, value: string) => void;
	onRemove: () => void;
}

const Rule: React.FC<RuleProps> = ({
	ruleSettings,
	rule,
	onChange,
	onRemove,
}) => {
	return (
		<div className="qcrm-rule">
			<div className="qcrm-rule-row">
				<div className="qcrm-rule-row-item">{ruleSettings.name}</div>
				{ruleSettings.operators && (
					<Field
						type="select"
						options={map(ruleSettings.operators, (operator, key) => ({
							label: operator,
							value: key,
						}))}
						value={rule.operator}
						onChange={(value) => onChange('operator', value)}
					/>
				)}
				<Field
					type={ruleSettings.type}
					value={rule.value}
					onChange={(value) => onChange('value', value)}
					options={map(ruleSettings.options, (option) => ({
						label: option,
						value: option,
					}))}
				/>
				<div className="qcrm-rule-row-item">
					<Button
						variant="destructive"
						size="icon"
						onClick={() => onRemove()}
					>
						<Trash2 className="h-4 w-4" />
					</Button>
				</div>
			</div>
		</div>
	);
};

export default Rule;