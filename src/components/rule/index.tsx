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
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import Field from '../field';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import TrashIcon from '@doublescale/shared/icons/trash';

interface RuleProps {
	ruleSettings: RuleSettings;
	rule: RuleType;
	onChange: (key: string, value: string) => void;
	onRemove?: () => void;
	hideRemoveButton?: boolean;
}

const Rule: React.FC<RuleProps> = ({
	ruleSettings,
	rule,
	onChange,
	onRemove,
	hideRemoveButton = false,
}) => {
	const hasOperators =
		ruleSettings.operators &&
		Object.keys(ruleSettings.operators).length > 0;

	return (
		<div className="doublescale-rule flex min-w-0 w-full flex-1">
			<div className="doublescale-rule-row flex min-w-0 w-full flex-1 max-sm:flex-col max-sm:items-stretch gap-3 sm:flex-row sm:items-center">
				{hasOperators && (
					<div className="min-w-0 flex-1 max-sm:w-full sm:basis-0">
						<Select
							value={rule.operator}
							onValueChange={(value) =>
								onChange('operator', value)
							}
						>
							<SelectTrigger className="h-12 w-full min-w-0 !border-border !rounded-lg">
								<SelectValue placeholder="Select operator" />
							</SelectTrigger>
							<SelectContent className="z-[180000] max-h-[200px] overflow-y-auto">
								{map(
									ruleSettings.operators,
									(operator, key) => (
										<SelectItem key={key} value={key}>
											{operator}
										</SelectItem>
									)
								)}
							</SelectContent>
						</Select>
					</div>
				)}
				<div
					className={cn(
						'min-w-0 max-sm:w-full [&_.react-select-container]:w-full',
						hasOperators ? 'flex-1 sm:basis-0' : 'flex-1'
					)}
				>
					<Field
						compact
						type={ruleSettings.type}
						value={rule.value}
						onChange={(value) => onChange('value', value)}
						options={map(
							ruleSettings.options || [],
							(option, key) => ({
								label: option,
								value: key,
							})
						)}
						endpoint={ruleSettings.endpoint}
						settings={ruleSettings.settings}
						className="w-full min-w-0 h-12 !border-border !rounded-lg [&_input]:w-full [&_textarea]:w-full"
					/>
				</div>
				{onRemove && !hideRemoveButton && (
					<Button
						type="button"
						onClick={onRemove}
						className="h-12 w-12 shrink-0 self-end bg-transparent px-0 shadow-none hover:bg-transparent hover:text-destructive text-destructive sm:self-auto [&_svg]:size-6"
					>
						<TrashIcon width={24} height={24} />
					</Button>
				)}
			</div>
		</div>
	);
};

export default Rule;
