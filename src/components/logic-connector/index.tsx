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
			className={isOr ? 'absolute left-[10px]' : 'absolute'}
			style={
				isOr
					? { top: style.top, height: style.height }
					: { left: 8, top: style.top, height: style.height }
			}
		>
			<div className="h-full w-6 border border-dashed border-primary border-r-0 rounded-l-2xl" />
			<span
				className={`absolute top-1/2 -translate-y-1/2 text-base font-semibold text-primary bg-secondary px-2 py-1 rounded-full ${isOr ? '-left-5' : '-left-6'}`}
			>
				{label}
			</span>
		</div>
	);
};

export default LogicConnector;
