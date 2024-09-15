/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * External dependencies
 */
import { Button } from 'antd';
import { DeleteOutlined } from '@ant-design/icons';

/**
 * Internal dependencies
 */
import './style.scss';
import type { Rule as RuleSettings } from '@quillcrm/config';
import { Rule as RuleType } from '@quillcrm/client';
import Field from '../field';

interface RuleProps {
	ruleSettings: RuleSettings;
	rule: RuleType;
	onChange: (key: string, value: any) => void;
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
						options={ruleSettings.operators}
						value={rule.operator}
						onChange={(value) => onChange('operator', value)}
					/>
				)}
				<Field
					type={ruleSettings.type}
					value={rule.value}
					onChange={(value) => onChange('value', value)}
					options={ruleSettings.options}
				/>
				<div className="qcrm-rule-row-item">
					<Button
						danger
						onClick={() => onRemove()}
						icon={<DeleteOutlined />}
					/>
				</div>
			</div>
		</div>
	);
};

export default Rule;
