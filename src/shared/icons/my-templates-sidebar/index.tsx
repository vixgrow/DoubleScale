import { IconProps } from '@doublescale/config';

interface MyTemplatesSidebarIconProps extends IconProps {
	active?: boolean;
}

const MyTemplatesSidebarIcon: React.FC<MyTemplatesSidebarIconProps> = ({
	width = 32,
	height = 32,
	active = false,
}) => {
	if (active) {
		return (
			<svg
				width={width}
				height={height}
				viewBox="0 0 32 32"
				fill="none"
				xmlns="http://www.w3.org/2000/svg"
			>
				<g clipPath="url(#clip0_mts_active)">
					<mask
						id="mask0_mts_active"
						style={{ maskType: 'luminance' as const }}
						maskUnits="userSpaceOnUse"
						x="0"
						y="0"
						width="32"
						height="32"
					>
						<path d="M32 0H0V32H32V0Z" fill="white" />
					</mask>
					<g mask="url(#mask0_mts_active)">
						<path
							fillRule="evenodd"
							clipRule="evenodd"
							d="M29.3346 5.33341C29.3346 3.86065 28.1407 2.66675 26.668 2.66675H5.33463C3.86187 2.66675 2.66797 3.86066 2.66797 5.33341V7.89342C2.66797 9.36618 3.86188 10.5601 5.33464 10.5601H13.043H26.668C28.1407 10.5601 29.3346 9.36617 29.3346 7.89341V5.33341ZM9.3763 29.3334C10.8491 29.3334 12.043 28.1395 12.043 26.6667V19.7067V15.2267C12.043 13.754 10.8491 12.5601 9.3763 12.5601H5.33464C3.86188 12.5601 2.66797 13.754 2.66797 15.2267V26.6667C2.66797 28.1395 3.86188 29.3334 5.33464 29.3334H9.3763Z"
							fill="url(#paint0_mts_active)"
						/>
						<g opacity="0.4">
							<path
								d="M29.3347 15.2267C29.3347 13.754 28.1408 12.5601 26.668 12.5601H16.7096C15.2369 12.5601 14.043 13.754 14.043 15.2267V16.0401C14.043 17.5128 15.2369 18.7068 16.7096 18.7068H26.668C28.1408 18.7068 29.3347 17.5128 29.3347 16.0401V15.2267Z"
								fill="url(#paint1_mts_active)"
							/>
							<path
								d="M29.3347 23.3739C29.3347 21.9012 28.1408 20.7073 26.668 20.7073H16.7096C15.2369 20.7073 14.043 21.9012 14.043 23.3739V26.6673C14.043 28.14 15.2369 29.3339 16.7096 29.3339H26.668C28.1408 29.3339 29.3347 28.14 29.3347 26.6673V23.3739Z"
								fill="url(#paint2_mts_active)"
							/>
						</g>
					</g>
				</g>
				<defs>
					<linearGradient
						id="paint0_mts_active"
						x1="2.66797"
						y1="16.0001"
						x2="29.3346"
						y2="16.0001"
						gradientUnits="userSpaceOnUse"
					>
						<stop offset="0.610577" stopColor="#1E3A8A" />
						<stop offset="1" stopColor="#3B82F6" />
					</linearGradient>
					<linearGradient
						id="paint1_mts_active"
						x1="14.043"
						y1="15.6334"
						x2="29.3347"
						y2="15.6334"
						gradientUnits="userSpaceOnUse"
					>
						<stop offset="0.610577" stopColor="#1E3A8A" />
						<stop offset="1" stopColor="#3B82F6" />
					</linearGradient>
					<linearGradient
						id="paint2_mts_active"
						x1="14.043"
						y1="25.0206"
						x2="29.3347"
						y2="25.0206"
						gradientUnits="userSpaceOnUse"
					>
						<stop offset="0.610577" stopColor="#1E3A8A" />
						<stop offset="1" stopColor="#3B82F6" />
					</linearGradient>
					<clipPath id="clip0_mts_active">
						<rect width="32" height="32" fill="white" />
					</clipPath>
				</defs>
			</svg>
		);
	}

	return (
		<svg
			width={width}
			height={height}
			viewBox="0 0 32 32"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
		>
			<g clipPath="url(#clip0_mts_inactive)">
				<mask
					id="mask0_mts_inactive"
					style={{ maskType: 'luminance' as const }}
					maskUnits="userSpaceOnUse"
					x="0"
					y="0"
					width="32"
					height="32"
				>
					<path d="M32 0H0V32H32V0Z" fill="white" />
				</mask>
				<g mask="url(#mask0_mts_inactive)">
					<path
						fillRule="evenodd"
						clipRule="evenodd"
						d="M29.3346 5.33341C29.3346 3.86065 28.1407 2.66675 26.668 2.66675H5.33463C3.86187 2.66675 2.66797 3.86066 2.66797 5.33341V7.89342C2.66797 9.36618 3.86188 10.5601 5.33464 10.5601H13.043H26.668C28.1407 10.5601 29.3346 9.36617 29.3346 7.89341V5.33341ZM9.3763 29.3334C10.8491 29.3334 12.043 28.1395 12.043 26.6667V19.7067V15.2267C12.043 13.754 10.8491 12.5601 9.3763 12.5601H5.33464C3.86188 12.5601 2.66797 13.754 2.66797 15.2267V26.6667C2.66797 28.1395 3.86188 29.3334 5.33464 29.3334H9.3763Z"
						fill="currentColor"
					/>
					<g opacity="0.4">
						<path
							d="M29.3347 15.2267C29.3347 13.754 28.1408 12.5601 26.668 12.5601H16.7096C15.2369 12.5601 14.043 13.754 14.043 15.2267V16.0401C14.043 17.5128 15.2369 18.7068 16.7096 18.7068H26.668C28.1408 18.7068 29.3347 17.5128 29.3347 16.0401V15.2267Z"
							fill="currentColor"
						/>
						<path
							d="M29.3347 23.3739C29.3347 21.9012 28.1408 20.7073 26.668 20.7073H16.7096C15.2369 20.7073 14.043 21.9012 14.043 23.3739V26.6673C14.043 28.14 15.2369 29.3339 16.7096 29.3339H26.668C28.1408 29.3339 29.3347 28.14 29.3347 26.6673V23.3739Z"
							fill="currentColor"
						/>
					</g>
				</g>
			</g>
			<defs>
				<clipPath id="clip0_mts_inactive">
					<rect width="32" height="32" fill="white" />
				</clipPath>
			</defs>
		</svg>
	);
};

export default MyTemplatesSidebarIcon;
