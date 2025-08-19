import { IconProps } from '@quillcrm/config';

const MailIcon: React.FC<IconProps> = ({ width = 24, height = 24, shape = 'circle', color }) => {
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
			viewBox="0 0 48 48"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
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
				d="M12 14C10.8954 14 10 14.8954 10 16V16.1615L24 25.7865L38 16.1615V16C38 14.8954 37.1046 14 36 14H12Z"
				fill="white"
			/>
			<path
				d="M38 18.5885L29.7053 24.2911L37.9323 32.518C37.9764 32.3528 38 32.1792 38 32V18.5885Z"
				fill="white"
			/>
			<path
				d="M36.518 33.9323L28.0292 25.4434L24 28.2135L19.9708 25.4434L11.482 33.9323C11.6472 33.9764 11.8208 34 12 34H36C36.1792 34 36.3528 33.9764 36.518 33.9323Z"
				fill="white"
			/>
			<path
				d="M10.0677 32.518L18.2947 24.2911L10 18.5885V32C10 32.1792 10.0236 32.3528 10.0677 32.518Z"
				fill="white"
			/>
		</svg>
	);
};

export default MailIcon;
