import { IconProps } from '@doublescale/config';

const FiltersIcon: React.FC<IconProps> = ({ width = 16, height = 16 }) => {
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
				d="M13.7333 2.73372V4.20039C13.7333 4.73372 13.4 5.40039 13.0667 5.73372L10.2 8.26706C9.8 8.60039 9.53334 9.26706 9.53334 9.80039V12.6671C9.53334 13.0671 9.26667 13.6004 8.93334 13.8004L8 14.4004C7.13334 14.9337 5.93334 14.3337 5.93334 13.2671V9.73372C5.93334 9.26706 5.66667 8.66706 5.4 8.33372L4.73334 7.63372L8.61334 1.40039H12.4C13.1333 1.40039 13.7333 2.00039 13.7333 2.73372Z"
				fill="currentColor"
			/>
			<path
				d="M7.53333 1.40039L4.08 6.94039L2.86666 5.66706C2.53333 5.33372 2.26666 4.73372 2.26666 4.33372V2.80039C2.26666 2.00039 2.86666 1.40039 3.6 1.40039H7.53333Z"
				fill="currentColor"
			/>
		</svg>
	);
};

export default FiltersIcon;