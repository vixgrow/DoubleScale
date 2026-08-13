import { IconProps } from '@doublescale/config';

const GradientRemoveFromListIcon: React.FC<IconProps> = ({
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
				opacity="0.4"
				d="M15.6548 4.48535H8.02292C5.79997 4.48535 4 6.29432 4 8.50827V16.9771C4 19.1911 5.80896 21 8.02292 21H15.6458C17.8687 21 19.6687 19.1911 19.6687 16.9771V8.50827C19.6777 6.28532 17.8687 4.48535 15.6548 4.48535Z"
				fill="url(#gradient-remove-from-list-paint0)"
			/>
			<path
				d="M13.9538 3H9.72392C8.78793 3 8.02295 3.75599 8.02295 4.69197V5.53795C8.02295 6.47393 8.77893 7.22992 9.71492 7.22992H13.9538C14.8898 7.22992 15.6458 6.47393 15.6458 5.53795V4.69197C15.6548 3.75599 14.8898 3 13.9538 3Z"
				fill="url(#gradient-remove-from-list-paint1)"
			/>
			<path
				d="M7.71273 13.1466C7.49171 13.1466 7.27975 13.2344 7.12347 13.3907C6.96719 13.547 6.87939 13.7589 6.87939 13.9799C6.87939 14.201 6.96719 14.4129 7.12347 14.5692C7.27975 14.7255 7.49171 14.8133 7.71273 14.8133H16.0461C16.2671 14.8133 16.479 14.7255 16.6353 14.5692C16.7916 14.4129 16.8794 14.201 16.8794 13.9799C16.8794 13.7589 16.7916 13.547 16.6353 13.3907C16.479 13.2344 16.2671 13.1466 16.0461 13.1466H7.71273Z"
				fill="url(#gradient-remove-from-list-paint2)"
			/>
			<defs>
				<linearGradient
					id="gradient-remove-from-list-paint0"
					x1="4"
					y1="12.7427"
					x2="19.6687"
					y2="12.7427"
					gradientUnits="userSpaceOnUse"
				>
					<stop stopColor="#3A3A99" />
					<stop offset="1" stopColor="#1B1145" />
				</linearGradient>
				<linearGradient
					id="gradient-remove-from-list-paint1"
					x1="8.02295"
					y1="5.11496"
					x2="15.6459"
					y2="5.11496"
					gradientUnits="userSpaceOnUse"
				>
					<stop stopColor="#3A3A99" />
					<stop offset="1" stopColor="#1B1145" />
				</linearGradient>
				<linearGradient
					id="gradient-remove-from-list-paint2"
					x1="6.87939"
					y1="13.9799"
					x2="16.8794"
					y2="13.9799"
					gradientUnits="userSpaceOnUse"
				>
					<stop stopColor="#3A3A99" />
					<stop offset="1" stopColor="#1B1145" />
				</linearGradient>
			</defs>
		</svg>
	);
};

export default GradientRemoveFromListIcon;
