import { IconProps } from '@doublescale/config';

const GradientAddToListIcon: React.FC<IconProps> = ({
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
				fill="url(#gradient-add-to-list-paint0)"
			/>
			<path
				d="M13.9538 3H9.72392C8.78793 3 8.02295 3.75599 8.02295 4.69197V5.53795C8.02295 6.47393 8.77893 7.22992 9.71492 7.22992H13.9538C14.8898 7.22992 15.6458 6.47393 15.6458 5.53795V4.69197C15.6548 3.75599 14.8898 3 13.9538 3Z"
				fill="url(#gradient-add-to-list-paint1)"
			/>
			<path
				d="M14.8268 12.9471H12.432V10.5524C12.432 10.2503 12.1815 9.99976 11.8794 9.99976C11.5773 9.99976 11.3268 10.2503 11.3268 10.5524V12.9471H8.93203C8.62992 12.9471 8.37939 13.1977 8.37939 13.4998C8.37939 13.8019 8.62992 14.0524 8.93203 14.0524H11.3268V16.4471C11.3268 16.7492 11.5773 16.9998 11.8794 16.9998C12.1815 16.9998 12.432 16.7492 12.432 16.4471V14.0524H14.8268C15.1289 14.0524 15.3794 13.8019 15.3794 13.4998C15.3794 13.1977 15.1289 12.9471 14.8268 12.9471Z"
				fill="url(#gradient-add-to-list-paint2)"
			/>
			<defs>
				<linearGradient
					id="gradient-add-to-list-paint0"
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
					id="gradient-add-to-list-paint1"
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
					id="gradient-add-to-list-paint2"
					x1="8.37939"
					y1="13.4998"
					x2="15.3794"
					y2="13.4998"
					gradientUnits="userSpaceOnUse"
				>
					<stop stopColor="#3A3A99" />
					<stop offset="1" stopColor="#1B1145" />
				</linearGradient>
			</defs>
		</svg>
	);
};

export default GradientAddToListIcon;
