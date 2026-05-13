import { IconProps } from '@doublescale/config';

const PiplelinesIcon: React.FC<IconProps> = ({ width = 27, height = 27 }) => {
	return (
		<svg
			width={width}
			height={height}
			viewBox="0 0 24 24"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
		>
			<path
				opacity="0.4"
				d="M19.2197 12H26.1162C26.4252 12 26.668 12.2868 26.668 12.6519V20.1481C26.668 23.7333 24.1852 26.6667 21.1507 26.6667H19.2197C18.9107 26.6667 18.668 26.3799 18.668 26.0148V12.6519C18.668 12.2868 18.9107 12 19.2197 12Z"
				fill="currentColor"
			/>
			<path
				d="M26.6667 9V6.66667C26.6667 3 23.6667 0 20 0H6.66667C3 0 0 3 0 6.66667V9C0 9.37333 0.293333 9.66667 0.666667 9.66667H26C26.3733 9.66667 26.6667 9.37333 26.6667 9Z"
				fill="currentColor"
			/>
			<path
				opacity="0.4"
				d="M7.44828 12H0.551724C0.242759 12 0 12.2868 0 12.6519V20.1481C0 23.7333 2.48276 26.6667 5.51724 26.6667H7.44828C7.75724 26.6667 8 26.3799 8 26.0148V12.6519C8 12.2868 7.75724 12 7.44828 12Z"
				fill="currentColor"
			/>
			<rect
				opacity="0.4"
				x="9.33398"
				y="12"
				width="8"
				height="14.6667"
				rx="0.533333"
				fill="currentColor"
			/>
		</svg>
	);
};

export default PiplelinesIcon;
