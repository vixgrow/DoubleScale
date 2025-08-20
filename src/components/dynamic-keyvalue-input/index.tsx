/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useCallback } from '@wordpress/element';

/**
 * Internal dependencies
 */
import './style.scss';
import { PlusIcon, Trash2Icon } from 'lucide-react';

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
}

const DynamicKeyValueInput: React.FC<DynamicKeyValueInputProps> = ({
	value = [],
	onChange,
	keyPlaceholder = __('Enter key', 'quillcrm'),
	valuePlaceholder = __('Enter value', 'quillcrm'),
	className = '',
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
			<div className="dynamic-keyvalue-input__pairs">
				{value.map((pair) => (
					<div key={pair.id} className="dynamic-keyvalue-input__pair">
						<div className="dynamic-keyvalue-input__inputs">
							<input
								type="text"
								value={pair.key}
								onChange={(e) =>
									updatePair(pair.id, 'key', e.target.value)
								}
								placeholder={keyPlaceholder}
								className="dynamic-keyvalue-input__input dynamic-keyvalue-input__input--key"
							/>
							<input
								type="text"
								value={pair.value}
								onChange={(e) =>
									updatePair(pair.id, 'value', e.target.value)
								}
								placeholder={valuePlaceholder}
								className="dynamic-keyvalue-input__input dynamic-keyvalue-input__input--value"
							/>
						</div>
						<button
							type="button"
							onClick={() => removePair(pair.id)}
							className="dynamic-keyvalue-input__remove-btn"
							title={__('Remove pair', 'quillcrm')}
						>
							<Trash2Icon width={16} height={16} />
						</button>
					</div>
				))}

				{value.length === 0 && (
					<div className="dynamic-keyvalue-input__empty">
						<p className="dynamic-keyvalue-input__empty-text">
							{__('No key-value pairs added yet.', 'quillcrm')}
						</p>
					</div>
				)}
			</div>

			<div className="dynamic-keyvalue-input__actions">
				<button
					type="button"
					onClick={addPair}
					className="dynamic-keyvalue-input__add-btn"
				>
					<PlusIcon width={16} height={16} />
					{__('Add New', 'quillcrm')}
				</button>
			</div>
		</div>
	);
};

export default DynamicKeyValueInput;
