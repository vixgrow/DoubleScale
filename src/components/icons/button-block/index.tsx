import { IconProps } from '@quillcrm/config';

const ButtonBlockIcon: React.FC<IconProps> = ({ width = 40, height = 24 }) => {
	return (
		<svg
			width={width}
			height={height}
			viewBox="0 0 40 24"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
		>
			<rect
				x="0.5"
				y="0.5"
				width="39"
				height="23"
				rx="3.5"
				fill="transparent"
			/>
			<rect
				x="0.5"
				y="0.5"
				width="39"
				height="23"
				rx="3.5"
				stroke="currentColor"
			/>
			<rect x="8" y="9" width="24" height="6" rx="3" fill="currentColor" />
		</svg>
	);
};

export default ButtonBlockIcon;
