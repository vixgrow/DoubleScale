/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useCallback } from '@wordpress/element';

/**
 * Internal dependencies
 */
import './style.scss';
import { PlusIcon, ChevronDown } from 'lucide-react';
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
	Card,
	CardHeader,
	CardTitle,
	CardContent,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { DeleteIcon } from '@quillcrm/components';

export interface KeyValuePair {
	key: string;
	value: string;
	id: string;
}

export interface DynamicKeyValueInputProps {
	value: KeyValuePair[];
	onChange: (pairs: KeyValuePair[]) => void;
	keyPlaceholder?: string;
	valuePlaceholder?: string;
	className?: string;
	/** When true, keys are displayed as readonly (for pre-defined templates) */
	readonlyKeys?: boolean;
	/** When false, the "Add New" button is hidden (default: true) */
	allowAdd?: boolean;
	/** When false, the remove button is hidden (default: true) */
	allowRemove?: boolean;
}

const DynamicKeyValueInput: React.FC<DynamicKeyValueInputProps> = ({
	value = [],
	onChange,
	keyPlaceholder = __('Enter key', 'quillcrm'),
	valuePlaceholder = __('Enter value', 'quillcrm'),
	className = '',
	readonlyKeys = false,
	allowAdd = true,
	allowRemove = true,
}) => {
	const generateId = () =>
		`kv-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

	const addPair = useCallback(() => {
		const newPair: KeyValuePair = {
			id: generateId(),
			key: '',
			value: '',
		};

		onChange([...value, newPair]);
	}, [value, onChange]);

	const removePair = useCallback(
		(id: string) => {
			const filteredPairs = value.filter((pair) => pair.id !== id);
			onChange(filteredPairs);
		},
		[value, onChange]
	);

	const updatePair = useCallback(
		(id: string, field: 'key' | 'value', newValue: string) => {
			const updatedPairs = value.map((pair) =>
				pair.id === id ? { ...pair, [field]: newValue } : pair
			);
			onChange(updatedPairs);
		},
		[value, onChange]
	);

	return (
		<div
			className={`dynamic-keyvalue-input ${className}`}
			data-field-type="dynamic_keyvalue"
			data-field-value={JSON.stringify(value)}
		>
			<div className="dynamic-keyvalue-input__pairs space-y-3">
				{value.map((pair, index) => (
					<Collapsible key={pair.id} defaultOpen className="group/collapsible">
						<Card>
							<CardHeader className="p-4">
								<div className="flex items-center justify-between">
									<CardTitle className="text-sm font-medium">
										{__('Key-Value Pair', 'quillcrm')} {index + 1}
									</CardTitle>
									<div className="flex items-center gap-1">
										<CollapsibleTrigger asChild>
											<Button
												type="button"
												variant="ghost"
												size="icon"
												className="h-8 w-8"
											>
												<ChevronDown className="h-4 w-4 transition-transform group-data-[state=open]/collapsible:rotate-180" />
											</Button>
										</CollapsibleTrigger>
										{allowRemove && (
											<Button
												type="button"
												variant="ghost"
												size="icon"
												onClick={() => removePair(pair.id)}
												className="h-8 w-8 text-destructive hover:text-destructive"
												title={__('Remove pair', 'quillcrm')}
											>
												<DeleteIcon />
											</Button>
										)}
									</div>
								</div>
							</CardHeader>
							<CollapsibleContent>
								<CardContent className="p-4 pt-0">
									<div className="flex flex-col gap-3">
										<div className="flex flex-col gap-2">
											<label className="text-sm font-medium">
												{__('Key', 'quillcrm')}
											</label>
											<Input
												type="text"
												value={pair.key}
												onChange={(e) =>
													updatePair(pair.id, 'key', e.target.value)
												}
												placeholder={keyPlaceholder}
												readOnly={readonlyKeys}
												className={readonlyKeys ? 'bg-muted cursor-not-allowed' : ''}
											/>
										</div>
										<div className="flex flex-col gap-2">
											<label className="text-sm font-medium">
												{__('Value', 'quillcrm')}
											</label>
											<Input
												type="text"
												value={pair.value}
												onChange={(e) =>
													updatePair(pair.id, 'value', e.target.value)
												}
												placeholder={valuePlaceholder}
											/>
										</div>
									</div>
								</CardContent>
							</CollapsibleContent>
						</Card>
					</Collapsible>
				))}

				{value.length === 0 && (
					<div className="dynamic-keyvalue-input__empty text-center py-6 text-muted-foreground">
						<p className="text-sm">
							{__('No key-value pairs added yet.', 'quillcrm')}
						</p>
					</div>
				)}
			</div>

			{allowAdd && (
				<div className="dynamic-keyvalue-input__actions mt-4">
					<Button
						type="button"
						variant="secondaryDeepBlue"
						onClick={addPair}
						className="w-full"
					>
						<PlusIcon className="h-5 w-5" />
						{__('Add New', 'quillcrm')}
					</Button>
				</div>
			)}
		</div>
	);
};

export default DynamicKeyValueInput;
