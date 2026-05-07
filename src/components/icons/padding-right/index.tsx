import { IconProps } from '@doublescale/config';

const PaddingRightIcon: React.FC<IconProps> = ({ width = 18, height = 19 }) => {
	return (
		<svg
			width={width}
			height={height}
			viewBox="0 0 19 19"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
		>
			<path
				d="M13.625 2.375C14.4455 2.5239 15.0493 2.78727 15.5267 3.2531C16.625 4.3249 16.625 6.04993 16.625 9.5C16.625 12.9501 16.625 14.6751 15.5267 15.7469C15.0493 16.2127 14.4455 16.4761 13.625 16.625"
				stroke="currentColor"
				stroke-width="1.2"
				stroke-linecap="round"
				stroke-linejoin="round"
			/>
			<path
				opacity="0.5"
				d="M5.23277 2.56357C4.45121 2.70853 3.87601 2.96493 3.42128 3.41843C2.96654 3.87194 2.70944 4.44557 2.56408 5.225M11 2.37872C10.5605 2.375 10.0337 2.375 9.51941 2.375C9.00508 2.375 8.43134 2.375 7.99183 2.37872M2.37873 8.075C2.375 8.51331 2.375 8.98707 2.375 9.5C2.375 10.0129 2.375 10.4867 2.37873 10.9251M2.56408 13.775C2.70944 14.5544 2.96654 15.1281 3.42127 15.5816C3.87601 16.0351 4.45121 16.2915 5.23277 16.4364M11 16.6213C10.5605 16.625 10.0337 16.625 9.51941 16.625C9.00514 16.625 8.4313 16.625 7.99183 16.6213"
				stroke="currentColor"
				stroke-opacity="0.7"
				stroke-width="1.2"
				stroke-linecap="round"
				stroke-linejoin="round"
			/>
		</svg>
	);
};

export default PaddingRightIcon;
