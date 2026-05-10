import { IconProps } from '@doublescale/config';

const ColumnsIcon: React.FC<IconProps> = ({ width = 16, height = 16 }) => {
	return (
		<svg
			width={width}
			height={height}
			viewBox="0 0 16 16"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
		>
			<path
				opacity="0.4"
				d="M9 2.73398V13.2673C9 14.2673 9.42667 14.6673 10.4867 14.6673H13.18C14.24 14.6673 14.6667 14.2673 14.6667 13.2673V2.73398C14.6667 1.73398 14.24 1.33398 13.18 1.33398H10.4867C9.42667 1.33398 9 1.73398 9 2.73398Z"
				fill="currentColor"
			/>
			<path
				d="M1.33331 2.73398V13.2673C1.33331 14.2673 1.75998 14.6673 2.81998 14.6673H5.51331C6.57331 14.6673 6.99998 14.2673 6.99998 13.2673V2.73398C6.99998 1.73398 6.57331 1.33398 5.51331 1.33398H2.81998C1.75998 1.33398 1.33331 1.73398 1.33331 2.73398Z"
				fill="currentColor"
			/>
		</svg>
	);
};

export default ColumnsIcon;
