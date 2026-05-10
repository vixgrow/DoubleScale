import { IconProps } from '@doublescale/config';

const GradientGroupIcon: React.FC<IconProps> = ({ width = 24, height = 24 }) => {
	return (
		<svg
			width={width}
			height={height}
			viewBox="0 0 24 24"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
		>
			<path
				d="M21.06 11.8196L20.9 11.5996C20.62 11.2596 20.29 10.9896 19.91 10.7896C19.4 10.4996 18.82 10.3496 18.22 10.3496H5.77001C5.17001 10.3496 4.60001 10.4996 4.08001 10.7896C3.69001 10.9996 3.34001 11.2896 3.05001 11.6496C2.48001 12.3796 2.21001 13.2796 2.30001 14.1796L2.67001 18.8496C2.80001 20.2596 2.97001 21.9996 6.14001 21.9996H17.86C21.03 21.9996 21.19 20.2596 21.33 18.8396L21.7 14.1896C21.79 13.3496 21.57 12.5096 21.06 11.8196ZM14.39 17.3396H9.60001C9.21001 17.3396 8.90001 17.0196 8.90001 16.6396C8.90001 16.2596 9.21001 15.9396 9.60001 15.9396H14.39C14.78 15.9396 15.09 16.2596 15.09 16.6396C15.09 17.0296 14.78 17.3396 14.39 17.3396Z"
				fill="url(#paint0_linear_3143_16877)"
			/>
			<path
				opacity="0.4"
				d="M3.38 11.31C3.6 11.11 3.82 10.93 4.08 10.79C4.59 10.5 5.17 10.35 5.77 10.35H18.23C18.83 10.35 19.4 10.5 19.92 10.79C20.18 10.93 20.41 11.11 20.62 11.32V10.79V9.82C20.62 6.25 19.53 5.16 15.96 5.16H13.58C13.14 5.16 13.13 5.15 12.87 4.81L11.67 3.2C11.1 2.46 10.65 2 9.22001 2H8.04C4.47 2 3.38 3.09 3.38 6.66V10.8V11.31Z"
				fill="url(#paint1_linear_3143_16877)"
			/>
			<defs>
				<linearGradient
					id="paint0_linear_3143_16877"
					x1="2.28302"
					y1="16.1746"
					x2="21.7197"
					y2="16.1746"
					gradientUnits="userSpaceOnUse"
				>
					<stop offset="0.610577" stop-color="#1E3A8A" />
					<stop offset="1" stop-color="#3B82F6" />
				</linearGradient>
				<linearGradient
					id="paint1_linear_3143_16877"
					x1="3.38"
					y1="6.66"
					x2="20.62"
					y2="6.66"
					gradientUnits="userSpaceOnUse"
				>
					<stop offset="0.610577" stop-color="#1E3A8A" />
					<stop offset="1" stop-color="#3B82F6" />
				</linearGradient>
			</defs>
		</svg>
	);
};

export default GradientGroupIcon;
