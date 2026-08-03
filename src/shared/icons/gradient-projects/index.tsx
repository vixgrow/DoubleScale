import { IconProps } from '@doublescale/config';

const GradientProjectsIcon: React.FC<IconProps> = ({
	width = 24,
	height = 24,
}) => {
	return (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			width={width}
			height={height}
			viewBox="0 0 24 24"
			fill="none"
		>
			<path
				d="M21 11.1633V16.1853C21 18.8403 18.84 21.0003 16.185 21.0003H7.815C5.16 21.0003 3 18.8403 3 16.1853V9.69629H20.766C20.901 10.1013 20.973 10.5153 20.991 10.9563C21 11.0193 21 11.1003 21 11.1633Z"
				fill="url(#gradient-projects-paint0)"
			/>
			<path
				opacity="0.4"
				d="M20.766 9.696H3V6.978C3 4.782 4.782 3 6.978 3H9.075C10.542 3 11.001 3.477 11.586 4.26L12.846 5.934C13.125 6.303 13.161 6.357 13.683 6.357H16.194C18.327 6.348 20.145 7.752 20.766 9.696Z"
				fill="url(#gradient-projects-paint1)"
			/>
			<defs>
				<linearGradient
					id="gradient-projects-paint0"
					x1="3"
					y1="15.3483"
					x2="21"
					y2="15.3483"
					gradientUnits="userSpaceOnUse"
				>
					<stop stopColor="#3A3A99" />
					<stop offset="1" stopColor="#1B1145" />
				</linearGradient>
				<linearGradient
					id="gradient-projects-paint1"
					x1="3"
					y1="6.348"
					x2="20.766"
					y2="6.348"
					gradientUnits="userSpaceOnUse"
				>
					<stop stopColor="#3A3A99" />
					<stop offset="1" stopColor="#1B1145" />
				</linearGradient>
			</defs>
		</svg>
	);
};

export default GradientProjectsIcon;
