import { IconProps } from '@doublescale/config';

interface ReadyToUseIconProps extends IconProps {
	active?: boolean;
}

const ReadyToUseIcon: React.FC<ReadyToUseIconProps> = ({
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
				<g clipPath="url(#clip0_rtu_active)">
					<mask
						id="mask0_rtu_active"
						style={{ maskType: 'luminance' as const }}
						maskUnits="userSpaceOnUse"
						x="0"
						y="0"
						width="32"
						height="32"
					>
						<path d="M32 0H0V32H32V0Z" fill="white" />
					</mask>
					<g mask="url(#mask0_rtu_active)">
						<path
							d="M28.3213 6.33342C28.3213 4.86066 27.1274 3.66675 25.6546 3.66675H6.33464C4.86188 3.66675 3.66797 4.86066 3.66797 6.33341V9.93341C3.66797 11.4062 4.86188 12.6001 6.33464 12.6001H25.6546C27.1274 12.6001 28.3213 11.4062 28.3213 9.93341V6.33342Z"
							fill="url(#paint0_rtu_active)"
						/>
						<path
							d="M12.6013 17.1198C12.6013 15.647 11.4074 14.4531 9.93463 14.4531H6.33464C4.86188 14.4531 3.66797 15.647 3.66797 17.1198V25.6531C3.66797 27.1259 4.86188 28.3198 6.33464 28.3198H9.93463C11.4074 28.3198 12.6013 27.1259 12.6013 25.6531V17.1198Z"
							fill="url(#paint1_rtu_active)"
						/>
						<path
							opacity="0.4"
							d="M20.8131 27.2409C19.9048 26.7343 19.9048 25.4275 20.8131 24.9209C22.5598 23.9342 23.9998 22.5075 24.9731 20.7609C25.4797 19.8525 26.7865 19.8525 27.2931 20.7609C27.5787 21.2802 28.3198 21.0327 28.3198 20.44V16.4567C28.3198 15.3581 27.4292 14.4675 26.3306 14.4675H17.1198C15.647 14.4675 14.4531 15.6614 14.4531 17.1342V26.2615C14.4531 27.4062 15.3811 28.3342 16.5258 28.3342H20.466C21.1028 28.3342 21.366 27.5568 20.8131 27.2409Z"
							fill="url(#paint2_rtu_active)"
						/>
						<path
							d="M26.3765 30.3346C26.2677 30.5128 26.0032 30.5128 25.8943 30.3346C24.8938 28.6964 23.5198 27.3223 21.8816 26.3218C21.7034 26.213 21.7034 25.9485 21.8816 25.8397C23.5198 24.8391 24.8938 23.4651 25.8943 21.8269C26.0032 21.6487 26.2677 21.6487 26.3765 21.8269C27.377 23.4651 28.7511 24.8391 30.3893 25.8397C30.5675 25.9485 30.5675 26.213 30.3893 26.3218C28.7511 27.3223 27.377 28.6964 26.3765 30.3346Z"
							fill="url(#paint3_rtu_active)"
						/>
					</g>
				</g>
				<defs>
					<linearGradient
						id="paint0_rtu_active"
						x1="3.66797"
						y1="8.13341"
						x2="28.3213"
						y2="8.13341"
						gradientUnits="userSpaceOnUse"
					>
						<stop offset="0.610577" stopColor="#1E3A8A" />
						<stop offset="1" stopColor="#3B82F6" />
					</linearGradient>
					<linearGradient
						id="paint1_rtu_active"
						x1="3.66797"
						y1="21.3865"
						x2="12.6013"
						y2="21.3865"
						gradientUnits="userSpaceOnUse"
					>
						<stop offset="0.610577" stopColor="#1E3A8A" />
						<stop offset="1" stopColor="#3B82F6" />
					</linearGradient>
					<linearGradient
						id="paint2_rtu_active"
						x1="14.4531"
						y1="21.4009"
						x2="28.3198"
						y2="21.4009"
						gradientUnits="userSpaceOnUse"
					>
						<stop offset="0.610577" stopColor="#1E3A8A" />
						<stop offset="1" stopColor="#3B82F6" />
					</linearGradient>
					<linearGradient
						id="paint3_rtu_active"
						x1="21.4688"
						y1="26.0807"
						x2="30.8021"
						y2="26.0807"
						gradientUnits="userSpaceOnUse"
					>
						<stop offset="0.610577" stopColor="#1E3A8A" />
						<stop offset="1" stopColor="#3B82F6" />
					</linearGradient>
					<clipPath id="clip0_rtu_active">
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
			<g clipPath="url(#clip0_rtu_inactive)">
				<mask
					id="mask0_rtu_inactive"
					style={{ maskType: 'luminance' as const }}
					maskUnits="userSpaceOnUse"
					x="0"
					y="0"
					width="32"
					height="32"
				>
					<path d="M32 0H0V32H32V0Z" fill="white" />
				</mask>
				<g mask="url(#mask0_rtu_inactive)">
					<path
						d="M28.3213 6.33342C28.3213 4.86066 27.1274 3.66675 25.6546 3.66675H6.33464C4.86188 3.66675 3.66797 4.86066 3.66797 6.33341V9.93341C3.66797 11.4062 4.86188 12.6001 6.33464 12.6001H25.6546C27.1274 12.6001 28.3213 11.4062 28.3213 9.93341V6.33342Z"
						fill="currentColor"
					/>
					<path
						d="M12.6013 17.1198C12.6013 15.647 11.4074 14.4531 9.93463 14.4531H6.33464C4.86188 14.4531 3.66797 15.647 3.66797 17.1198V25.6531C3.66797 27.1259 4.86188 28.3198 6.33464 28.3198H9.93463C11.4074 28.3198 12.6013 27.1259 12.6013 25.6531V17.1198Z"
						fill="currentColor"
					/>
					<path
						opacity="0.4"
						d="M20.8131 27.2409C19.9048 26.7343 19.9048 25.4275 20.8131 24.9209C22.5598 23.9342 23.9998 22.5075 24.9731 20.7609C25.4797 19.8525 26.7865 19.8525 27.2931 20.7609C27.5787 21.2802 28.3198 21.0327 28.3198 20.44V16.4567C28.3198 15.3581 27.4292 14.4675 26.3306 14.4675H17.1198C15.647 14.4675 14.4531 15.6614 14.4531 17.1342V26.2615C14.4531 27.4062 15.3811 28.3342 16.5258 28.3342H20.466C21.1028 28.3342 21.366 27.5568 20.8131 27.2409Z"
						fill="currentColor"
					/>
					<path
						d="M26.3765 30.3346C26.2677 30.5128 26.0032 30.5128 25.8943 30.3346C24.8938 28.6964 23.5198 27.3223 21.8816 26.3218C21.7034 26.213 21.7034 25.9485 21.8816 25.8397C23.5198 24.8391 24.8938 23.4651 25.8943 21.8269C26.0032 21.6487 26.2677 21.6487 26.3765 21.8269C27.377 23.4651 28.7511 24.8391 30.3893 25.8397C30.5675 25.9485 30.5675 26.213 30.3893 26.3218C28.7511 27.3223 27.377 28.6964 26.3765 30.3346Z"
						fill="currentColor"
					/>
				</g>
			</g>
			<defs>
				<clipPath id="clip0_rtu_inactive">
					<rect width="32" height="32" fill="white" />
				</clipPath>
			</defs>
		</svg>
	);
};

export default ReadyToUseIcon;
