import { IconProps } from '@doublescale/config';

const XIcon: React.FC<IconProps> = ({ width = 24, height = 24, shape = 'circle', color }) => {
	const getBorderRadius = () => {
		switch (shape) {
			case 'circle':
				return 24;
			case 'rounded':
				return 8;
			case 'square':
				return 0;
			default:
				return 24;
		}
	};

	return (
		<svg
			width={width}
			height={height}
			xmlns="http://www.w3.org/2000/svg"
			viewBox="0 0 48 48"
			fill="none"
		>
			<rect
				x="0.5"
				y="0.5"
				width="47"
				height="47"
				rx={getBorderRadius()}
				ry={getBorderRadius()}
				fill={color || "black"}
			/>
			<path
				d="M26.4736 21.7152L36.1526 10.5H33.859L25.4547 20.238L18.7421 10.5H11L21.1507 25.2255L11 36.9864H13.2937L22.1689 26.7027L29.2579 36.9864H37L26.4729 21.7152H26.4736ZM23.3319 25.3553L22.3034 23.889L14.1202 12.2212H17.6433L24.2472 21.6374L25.2757 23.1038L33.8601 35.3435H30.337L23.3319 25.3559V25.3553Z"
				fill="white"
			/>
		</svg>
	);
};

export default XIcon;
