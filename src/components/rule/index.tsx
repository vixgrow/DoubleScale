/**
 * External dependencies
 */
import { map } from 'lodash';

/**
 * Internal dependencies
 */
import './style.scss';
import type { Rule as RuleSettings } from '@quillcrm/config';
import { Rule as RuleType } from '@quillcrm/client';
import { Button } from '@/components/ui/button';
import Field from '../field';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import { DeleteIcon } from '../icons';

interface RuleProps {
	ruleSettings: RuleSettings;
	rule: RuleType;
	onChange: (key: string, value: string) => void;
	onRemove?: () => void;
}

const Rule: React.FC<RuleProps> = ({
	ruleSettings,
	rule,
	onChange,
	onRemove,
}) => {
	return (
		<div className="qcrm-rule">
			<div className="qcrm-rule-row w-full">
				<Select
					value={rule.operator}
					onValueChange={(value) => onChange('operator', value)}
				>
					<SelectTrigger className="w-[150px] h-12 border-[#D3D4D6] rounded-lg">
						<SelectValue placeholder="Select operator" />
					</SelectTrigger>
					<SelectContent className="max-h-[200px] overflow-y-auto">
						{map(ruleSettings.operators, (operator, key) => (
							<SelectItem key={key} value={key}>
								{operator}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
				<Field
					type={ruleSettings.type}
					value={rule.value}
					onChange={(value) => onChange('value', value)}
					options={map(ruleSettings.options || [], (option) => ({
						label: option,
						value: option,
					}))}
				/>
				{onRemove && (
					<Button
						size="icon"
						onClick={onRemove}
						className="bg-transparent hover:bg-transparent text-destructive shadow-none border-l px-0 h-12"
					>
						<DeleteIcon width={20} height={20} />
					</Button>
				)}
			</div>
		</div>
	);
};

export default Rule;
