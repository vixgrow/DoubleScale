const WrappedTextCell = ({
	value,
	empty = '-',
}: {
	value?: string | null;
	empty?: string;
}) => {
	const trimmed = value?.trim() ?? '';
	const text = trimmed || empty;

	return (
		<span
			className="block max-w-[16rem] whitespace-normal break-all line-clamp-2"
			title={trimmed || undefined}
		>
			{text}
		</span>
	);
};

export default WrappedTextCell;
