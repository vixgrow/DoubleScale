/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useCallback } from '@wordpress/element';

/**
 * Internal dependencies
 */
import './style.scss';

export interface KeyValuePair {
	key: string;
	value: string;
	id: string;
}

export interface DynamicKeyValueInputProps {
	value: KeyValuePair[];
	onChange: (pairs: KeyValuePair[]) => void;
	maxPairs?: number;
	keyPlaceholder?: string;
	valuePlaceholder?: string;
	allowEmpty?: boolean;
	keyLabel?: string;
	valueLabel?: string;
	className?: string;
	disabled?: boolean;
}

const DynamicKeyValueInput: React.FC<DynamicKeyValueInputProps> = ({
	value = [],
	onChange,
	maxPairs = 10,
	keyPlaceholder = __('Enter key', 'quillcrm'),
	valuePlaceholder = __('Enter value', 'quillcrm'),
	allowEmpty = false,
	keyLabel = __('Key', 'quillcrm'),
	valueLabel = __('Value', 'quillcrm'),
	className = '',
	disabled = false,
}) => {
	const generateId = () =>
		`kv-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

	const addPair = useCallback(() => {
		if (value.length >= maxPairs) return;

		const newPair: KeyValuePair = {
			id: generateId(),
			key: '',
			value: '',
		};

		onChange([...value, newPair]);
	}, [value, onChange, maxPairs]);

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

	const validatePairs = useCallback(() => {
		if (allowEmpty) return true;

		return value.every(
			(pair) => pair.key.trim() !== '' && pair.value.trim() !== ''
		);
	}, [value, allowEmpty]);

	const hasValidPairs = validatePairs();
	const canAddMore = value.length < maxPairs;

	return (
		<div
			className={`dynamic-keyvalue-input ${className}`}
			data-field-type="dynamic_keyvalue"
			data-field-value={JSON.stringify(value)}
		>
			<div className="dynamic-keyvalue-input__header">
				<div className="dynamic-keyvalue-input__labels">
					<span className="dynamic-keyvalue-input__label dynamic-keyvalue-input__label--key">
						{keyLabel}
					</span>
					<span className="dynamic-keyvalue-input__label dynamic-keyvalue-input__label--value">
						{valueLabel}
					</span>
				</div>
			</div>

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
								disabled={disabled}
							/>
							<input
								type="text"
								value={pair.value}
								onChange={(e) =>
									updatePair(pair.id, 'value', e.target.value)
								}
								placeholder={valuePlaceholder}
								className="dynamic-keyvalue-input__input dynamic-keyvalue-input__input--value"
								disabled={disabled}
							/>
						</div>
						<button
							type="button"
							onClick={() => removePair(pair.id)}
							className="dynamic-keyvalue-input__remove-btn"
							disabled={disabled}
							title={__('Remove pair', 'quillcrm')}
						>
							<svg
								className="dynamic-keyvalue-input__remove-icon"
								fill="none"
								viewBox="0 0 24 24"
								strokeWidth={1.5}
								stroke="currentColor"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									d="M6 18L18 6M6 6l12 12"
								/>
							</svg>
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
					disabled={!canAddMore || disabled}
					className="dynamic-keyvalue-input__add-btn"
				>
					<svg
						className="dynamic-keyvalue-input__add-icon"
						fill="none"
						viewBox="0 0 24 24"
						strokeWidth={1.5}
						stroke="currentColor"
					>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							d="M12 4.5v15m7.5-7.5h-15"
						/>
					</svg>
					{__('Add Pair', 'quillcrm')}
				</button>

				{!canAddMore && (
					<span className="dynamic-keyvalue-input__limit-text">
						{__(`Maximum ${maxPairs} pairs allowed`, 'quillcrm')}
					</span>
				)}
			</div>

			{!hasValidPairs && !allowEmpty && (
				<div className="dynamic-keyvalue-input__validation">
					<p className="dynamic-keyvalue-input__error">
						{__(
							'All key-value pairs must have both key and value filled.',
							'quillcrm'
						)}
					</p>
				</div>
			)}
		</div>
	);
};

export default DynamicKeyValueInput;
