import { IconProps } from '@quillcrm/config';

const PaddingBottomIcon: React.FC<IconProps> = ({
	width = 18,
	height = 19,
}) => {
	return (
		<svg
			width={width}
			height={height}
			viewBox="0 0 19 19"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
		>
			<path
				d="M2.375 13.625C2.5239 14.4455 2.78727 15.0493 3.2531 15.5267C4.3249 16.625 6.04993 16.625 9.5 16.625C12.9501 16.625 14.6751 16.625 15.7469 15.5266C16.2127 15.0493 16.4761 14.4455 16.625 13.625"
				stroke="currentColor"
				stroke-width="1.2"
				stroke-linecap="round"
				stroke-linejoin="round"
			/>
			<path
				opacity="0.5"
				d="M2.56357 5.23277C2.70853 4.45121 2.96493 3.87601 3.41843 3.42128C3.87194 2.96654 4.44557 2.70944 5.225 2.56408M2.37872 11C2.375 10.5605 2.375 10.0337 2.375 9.51941C2.375 9.00508 2.375 8.43134 2.37872 7.99183M8.075 2.37873C8.51331 2.375 8.98707 2.375 9.5 2.375C10.0129 2.375 10.4867 2.375 10.9251 2.37873M13.775 2.56408C14.5544 2.70944 15.1281 2.96654 15.5816 3.42127C16.0351 3.87601 16.2915 4.45121 16.4364 5.23276M16.6213 11C16.625 10.5605 16.625 10.0337 16.625 9.51941C16.625 9.00514 16.625 8.4313 16.6213 7.99182"
				stroke="currentColor"
				stroke-opacity="0.7"
				stroke-width="1.2"
				stroke-linecap="round"
				stroke-linejoin="round"
			/>
		</svg>
	);
};

export default PaddingBottomIcon;
