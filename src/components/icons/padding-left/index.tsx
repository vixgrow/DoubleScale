import { IconProps } from '@doublescale/config';

const PaddingLeftIcon: React.FC<IconProps> = ({ width = 18, height = 19 }) => {
	return (
		<svg
			width={width}
			height={height}
			viewBox="0 0 18 19"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
		>
			<path
				d="M4.875 2.375C4.05455 2.5239 3.45072 2.78727 2.97335 3.2531C1.875 4.3249 1.875 6.04993 1.875 9.5C1.875 12.9501 1.875 14.6751 2.97335 15.7469C3.45072 16.2127 4.05455 16.4761 4.875 16.625"
				stroke="currentColor"
				stroke-width="1.2"
				stroke-linecap="round"
				stroke-linejoin="round"
			/>
			<path
				opacity="0.5"
				d="M13.2672 2.56357C14.0488 2.70853 14.624 2.96493 15.0787 3.41843C15.5335 3.87194 15.7906 4.44557 15.9359 5.225M7.5 2.37872C7.93951 2.375 8.46626 2.375 8.98059 2.375C9.49492 2.375 10.0687 2.375 10.5082 2.37872M16.1213 8.075C16.125 8.51331 16.125 8.98707 16.125 9.5C16.125 10.0129 16.125 10.4867 16.1213 10.9251M15.9359 13.775C15.7906 14.5544 15.5335 15.1281 15.0787 15.5816C14.624 16.0351 14.0488 16.2915 13.2672 16.4364M7.5 16.6213C7.93951 16.625 8.46626 16.625 8.98059 16.625C9.49486 16.625 10.0687 16.625 10.5082 16.6213"
				stroke="currentColor"
				stroke-opacity="0.7"
				stroke-width="1.2"
				stroke-linecap="round"
				stroke-linejoin="round"
			/>
		</svg>
	);
};

export default PaddingLeftIcon;
