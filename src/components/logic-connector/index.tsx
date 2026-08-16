import type { LogicBracketStyle } from '@/shared/hooks/use-logic-bracket-style';

interface LogicConnectorProps {
	label: string;
	style: LogicBracketStyle;
	variant: 'or' | 'and';
}

const LogicConnector = ({ label, style, variant }: LogicConnectorProps) => {
	if (style.height <= 0) {
		return null;
	}

	const isOr = variant === 'or';

	return (
		<div
			className="absolute"
			style={{
				insetInlineStart: isOr ? 10 : 8,
				top: style.top,
				height: style.height,
			}}
		>
			<div
				className="h-full w-6 border border-dashed border-primary"
				style={{
					borderInlineEndWidth: 0,
					borderStartStartRadius: '1rem',
					borderEndStartRadius: '1rem',
				}}
			/>
			<span
				className="absolute top-1/2 -translate-y-1/2 text-base font-semibold text-primary bg-secondary px-2 py-1 rounded-full"
				style={{
					insetInlineStart: isOr ? '-1.25rem' : '-1.5rem',
				}}
			>
				{label}
			</span>
		</div>
	);
};

export default LogicConnector;
