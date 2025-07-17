const FallbackCell = ({ value }: { value: string }) => (
	<div>{value ? value : 'N/A'}</div>
);

export default FallbackCell;
