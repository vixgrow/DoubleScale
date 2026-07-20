import { IconProps } from '@doublescale/config';

const GradientListIcon: React.FC<IconProps> = ({ width = 24, height = 24 }) => {
	return (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			width={width}
			height={height}
			viewBox="0 0 70 70"
			fill="none"
		>
			<path
				opacity="0.4"
				d="M56.585 25.1568V50.7505C56.585 58.6255 51.8862 61.2505 46.085 61.2505H25.085C19.2837 61.2505 14.585 58.6255 14.585 50.7505V25.1568C14.585 16.6255 19.2837 14.6568 25.085 14.6568C25.085 16.2843 25.7411 17.7543 26.8174 18.8305C27.8936 19.9068 29.3637 20.563 30.9912 20.563H40.1787C43.4337 20.563 46.085 17.9118 46.085 14.6568C51.8862 14.6568 56.585 16.6255 56.585 25.1568Z"
				fill="url(#paint0_linear_2396_31890)"
			/>
			<path
				d="M46.085 14.6568C46.085 17.9118 43.4337 20.563 40.1787 20.563H30.9912C29.3637 20.563 27.8936 19.9068 26.8174 18.8305C25.7411 17.7543 25.085 16.2843 25.085 14.6568C25.085 11.4018 27.7362 8.75053 30.9912 8.75053H40.1787C41.8062 8.75053 43.2762 9.40678 44.3525 10.483C45.4287 11.5593 46.085 13.0293 46.085 14.6568Z"
				fill="url(#paint1_linear_2396_31890)"
			/>
			<path
				d="M35.585 39.5943H25.085C24.0087 39.5943 23.1162 38.7018 23.1162 37.6255C23.1162 36.5493 24.0087 35.6568 25.085 35.6568H35.585C36.6612 35.6568 37.5537 36.5493 37.5537 37.6255C37.5537 38.7018 36.6612 39.5943 35.585 39.5943Z"
				fill="url(#paint2_linear_2396_31890)"
			/>
			<path
				d="M46.085 50.0943H25.085C24.0087 50.0943 23.1162 49.2018 23.1162 48.1255C23.1162 47.0493 24.0087 46.1568 25.085 46.1568H46.085C47.1612 46.1568 48.0537 47.0493 48.0537 48.1255C48.0537 49.2018 47.1612 50.0943 46.085 50.0943Z"
				fill="url(#paint3_linear_2396_31890)"
			/>
			<defs>
				<linearGradient
					id="paint0_linear_2396_31890"
					x1="14.585"
					y1="37.9537"
					x2="56.585"
					y2="37.9537"
					gradientUnits="userSpaceOnUse"
				>
					<stop stop-color="#3A3A99" />
					<stop offset="1" stop-color="#1B1145" />
				</linearGradient>
				<linearGradient
					id="paint1_linear_2396_31890"
					x1="25.085"
					y1="14.6568"
					x2="46.085"
					y2="14.6568"
					gradientUnits="userSpaceOnUse"
				>
					<stop stop-color="#3A3A99" />
					<stop offset="1" stop-color="#1B1145" />
				</linearGradient>
				<linearGradient
					id="paint2_linear_2396_31890"
					x1="23.1162"
					y1="37.6255"
					x2="37.5537"
					y2="37.6255"
					gradientUnits="userSpaceOnUse"
				>
					<stop stop-color="#3A3A99" />
					<stop offset="1" stop-color="#1B1145" />
				</linearGradient>
				<linearGradient
					id="paint3_linear_2396_31890"
					x1="23.1162"
					y1="48.1255"
					x2="48.0537"
					y2="48.1255"
					gradientUnits="userSpaceOnUse"
				>
					<stop stop-color="#3A3A99" />
					<stop offset="1" stop-color="#1B1145" />
				</linearGradient>
			</defs>
		</svg>
	);
};

export default GradientListIcon;
