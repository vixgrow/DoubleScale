import { IconProps } from '@doublescale/config';

const ProjectsIcon: React.FC<IconProps> = ({
	width = 24,
	height = 24,
	color = 'currentColor',
}) => {
	return (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			width={width}
			height={height}
			viewBox="0 0 40 40"
			fill="none"
		>
			<path
				d="M35 18.6057V26.9757C35 31.4007 31.4 35.0007 26.975 35.0007H13.025C8.6 35.0007 5 31.4007 5 26.9757V16.1607H34.61C34.835 16.8357 34.955 17.5257 34.985 18.2607C35 18.3657 35 18.5007 35 18.6057Z"
				fill={color}
			/>
			<path
				opacity="0.4"
				d="M34.61 16.16H5V11.63C5 7.97003 7.97 5.00003 11.63 5.00003H15.125C17.57 5.00003 18.335 5.79503 19.31 7.10003L21.41 9.89003C21.875 10.505 21.935 10.595 22.805 10.595H26.99C30.545 10.58 33.575 12.92 34.61 16.16Z"
				fill={color}
			/>
		</svg>
	);
};

export default ProjectsIcon;
