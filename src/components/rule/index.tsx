/**
 * External dependencies
 */
import { map } from 'lodash';

/**
 * Internal dependencies
 */
import './style.scss';
import type { Rule as RuleSettings } from '@doublescale/config';
import { Rule as RuleType } from '@doublescale/client';
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
	const hasOperators =
		ruleSettings.operators &&
		Object.keys(ruleSettings.operators).length > 0;

	return (
		<div className="doublescale-rule">
			<div className="doublescale-rule-row w-full">
				{hasOperators && (
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
				)}
				<Field
					type={ruleSettings.type}
					value={rule.value}
					onChange={(value) => onChange('value', value)}
					options={map(ruleSettings.options || [], (option, key) => ({
						label: option,
						value: key,
					}))}
				/>
				{onRemove && (
					<Button
						size="icon"
						onClick={onRemove}
						className="bg-transparent hover:bg-transparent text-destructive shadow-none border-l rounded-none px-0 h-12"
					>
						<DeleteIcon width={20} height={20} />
					</Button>
				)}
			</div>
		</div>
	);
};

export default Rule;
