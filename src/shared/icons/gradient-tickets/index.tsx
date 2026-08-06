import { IconProps } from '@doublescale/config';

const GradientTicketsIcon: React.FC<IconProps> = ({
	width = 24,
	height = 24,
}) => {
	return (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			width={width}
			height={height}
			viewBox="0 0 60 60"
			fill="none"
		>
			<path
				d="M25.814 24.7023L25.814 18.7791C24.9558 18.7791 24.2442 18.0674 24.2442 17.2093V12.5L19.5349 12.5C10.3047 12.5 7.5 15.3047 7.5 24.5349V25.5814C7.5 26.4395 8.21163 27.1512 9.06977 27.1512C11.0791 27.1512 12.7326 28.8047 12.7326 30.814C12.7326 32.8233 11.0791 34.4767 9.06977 34.4767C8.21163 34.4767 7.5 35.1884 7.5 36.0465V37.093C7.5 46.3233 10.3047 49.1279 19.5349 49.1279H24.2442L24.2442 44.4186C24.2442 43.5605 24.9558 42.8488 25.814 42.8488V36.9256C24.9558 36.9256 24.2442 36.214 24.2442 35.3558V26.2721C24.2442 25.414 24.9558 24.7023 25.814 24.7023Z"
				fill="url(#gradient-tickets-paint0)"
			/>
			<path
				opacity="0.4"
				d="M47.2679 31.8605C47.2679 33.8698 48.9214 35.5233 50.9307 35.5233C51.7889 35.5233 52.5005 36.2349 52.5005 37.093C52.5005 46.3233 49.6958 49.1279 40.4656 49.1279H27.3842L27.3842 44.4186C27.3842 43.5605 26.6726 42.8488 25.8145 42.8488V36.9256C26.6726 36.9256 27.3842 36.214 27.3842 35.3558V26.2721C27.3842 25.414 26.6726 24.7023 25.8145 24.7023L25.8145 18.7791C26.6726 18.7791 27.3842 18.0674 27.3842 17.2093V12.5L40.4656 12.5C49.6958 12.5 52.5005 15.3047 52.5005 24.5349V26.6279C52.5005 27.486 51.7889 28.1977 50.9307 28.1977C48.9214 28.1977 47.2679 29.8512 47.2679 31.8605Z"
				fill="url(#gradient-tickets-paint1)"
			/>
			<defs>
				<linearGradient
					id="gradient-tickets-paint0"
					x1="7.5"
					y1="30.814"
					x2="25.814"
					y2="30.814"
					gradientUnits="userSpaceOnUse"
				>
					<stop stopColor="#3A3A99" />
					<stop offset="1" stopColor="#1B1145" />
				</linearGradient>
				<linearGradient
					id="gradient-tickets-paint1"
					x1="25.8145"
					y1="30.814"
					x2="52.5005"
					y2="30.814"
					gradientUnits="userSpaceOnUse"
				>
					<stop stopColor="#3A3A99" />
					<stop offset="1" stopColor="#1B1145" />
				</linearGradient>
			</defs>
		</svg>
	);
};

export default GradientTicketsIcon;
