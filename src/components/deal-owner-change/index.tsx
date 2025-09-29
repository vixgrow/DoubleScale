import { __ } from '@wordpress/i18n';
import { useState, useEffect } from '@wordpress/element';
import './style.scss';
import Select from 'react-select';
import { isObject } from 'lodash';
import { Input } from '@/components/ui/input';
import { UserService } from '../../services/user-service';

interface DealOwnerChangeProps {
	value: { condition: string; owner_id: string };
	onChange: (value: { condition: string; owner_id: string }) => void;
}

const DealOwnerChange = ({ value, onChange }: DealOwnerChangeProps) => {
	const [users, setUsers] = useState<any[]>([]);
	const [loadingUsers, setLoadingUsers] = useState(false);
	const anyValue = 'any-value';
	const specificValue = 'specific-value';
	const labelForAnyOwner = __('Any Owner', 'quillcrm');
	const labelForSpecificOwner = __('Specific Owner', 'quillcrm');
	const placeholderForSelect = __('Select option', 'quillcrm');

	const conditionOptions = [
		{
			label: __('Equal To', 'quillcrm'),
			value: 'equal_to',
		},
		{
			label: __('Not Equal To', 'quillcrm'),
			value: 'not_equal_to',
		},
	];

	// Fetch users for the dropdown
	useEffect(() => {
		const fetchUsers = async () => {
			setLoadingUsers(true);
			try {
				// Use centralized service
				const users = await UserService.getUsersForSelect();
				setUsers(users);

				// If a specific condition is already chosen but owner_id is missing, set first user
				const hasSpecificCondition =
					typeof value?.condition === 'string' &&
					conditionOptions.some(
						(opt) => opt.value === value?.condition
					);
				if (
					users.length > 0 &&
					hasSpecificCondition &&
					!value?.owner_id
				) {
					onChange({
						condition: value?.condition as string,
						owner_id: users[0].value,
					});
				}
			} catch (error) {
				console.error('Failed to fetch users:', error);
			} finally {
				setLoadingUsers(false);
			}
		};

		fetchUsers();
	}, []);

	// random id
	const id = Math.random().toString(36).substring(2, 15);

	// Determine if current condition is "any-value" or a specific condition
	const isAnyValue =
		value?.condition === anyValue ||
		typeof value?.condition === 'undefined';

	// Debug logs removed

	const isSpecificValue = conditionOptions.some(
		(option) => option.value === value?.condition
	);
	const radioValue = isAnyValue
		? anyValue
		: isSpecificValue
			? specificValue
			: '';

	const handleRadioChange = (selectedValue: string) => {
		if (selectedValue === anyValue) {
			onChange({
				condition: anyValue,
				owner_id: anyValue,
			});
		} else if (selectedValue === specificValue) {
			// Default to first condition option if switching to specific value
			onChange({
				condition:
					value?.condition &&
					conditionOptions.some(
						(opt) => opt.value === value?.condition
					)
						? value?.condition
						: conditionOptions[0].value,
				owner_id:
					value?.owner_id || (users.length > 0 ? users[0].value : ''),
			});
		}
	};

	return (
		<>
			{/* Radio buttons to choose between any-value and specific-value */}
			<div className="mb-3">
				<div className="flex gap-4">
					<label className="flex items-center gap-2">
						<Input
							type="radio"
							name={`owner-type-${id}`}
							value={anyValue}
							checked={radioValue === anyValue}
							onChange={(e) => handleRadioChange(e.target.value)}
							className="form-radio"
						/>
						<span>{labelForAnyOwner}</span>
					</label>
					<label className="flex items-center gap-2">
						<Input
							type="radio"
							name={`owner-type-${id}`}
							value={specificValue}
							checked={radioValue === specificValue}
							onChange={(e) => handleRadioChange(e.target.value)}
							className="form-radio"
						/>
						<span>{labelForSpecificOwner}</span>
					</label>
				</div>
			</div>

			{/* Show condition selector and value input only for specific-value */}
			{radioValue === specificValue && (
				<div className="flex gap-2">
					<Select
						className="react-select-container w-1/2"
						classNamePrefix="react-select"
						value={
							conditionOptions.find(
								(option) => option.value === value?.condition
							) || null
						}
						onChange={(selectedOption) => {
							if (!isObject(selectedOption)) {
								return;
							}
							onChange({
								condition: selectedOption.value,
								owner_id: value?.owner_id || '',
							});
						}}
						options={conditionOptions}
						placeholder={placeholderForSelect}
						styles={{
							menu: (base: any) => ({
								...base,
								color: 'black',
							}),
						}}
					/>
					<Select
						className="react-select-container w-1/2"
						classNamePrefix="react-select"
						value={
							users.find(
								(user: any) => user?.value === value?.owner_id
							) || null
						}
						onChange={(selectedUser) => {
							if (!selectedUser || !isObject(selectedUser)) {
								return;
							}
							const userOption = selectedUser as {
								value: string;
								label: string;
								id: string;
							};
							onChange({
								condition: value.condition,
								owner_id: userOption.value,
							});
						}}
						options={users}
						placeholder={
							loadingUsers
								? __('Loading users...', 'quillcrm')
								: placeholderForSelect
						}
						isLoading={loadingUsers}
						styles={{
							menu: (base: any) => ({
								...base,
								color: 'black',
							}),
						}}
					/>
				</div>
			)}
		</>
	);
};

export default DealOwnerChange;
