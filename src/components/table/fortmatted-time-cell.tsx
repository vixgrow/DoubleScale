export const FormattedDateCell = ({ value }: { value: string }) => {
	const date = new Date(value);
	return (
		<div>
			{date.toLocaleDateString('en-US', {
				year: 'numeric',
				month: 'short',
				day: 'numeric',
			})}
			{' - '}
			{date.toLocaleTimeString('en-US', {
				hour: 'numeric',
				minute: '2-digit',
				hour12: true,
			})}
		</div>
	);
};

export default FormattedDateCell;
