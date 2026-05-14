import { IconProps } from '@doublescale/config';

const AlignLeftIcon: React.FC<IconProps> = ({
	width = 32,
	height = 32,
}) => {
	return (
		<svg
			width={width}
			height={height}
			viewBox="0 0 32 32"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
		>
			<path
				opacity="0.4"
				d="M19.8571 8L5.28571 8C4.57563 8 4 8.57563 4 9.28571C4 9.99579 4.57563 10.5714 5.28571 10.5714L19.8571 10.5714C20.5672 10.5714 21.1429 9.99579 21.1429 9.28571C21.1429 8.57563 20.5672 8 19.8571 8Z"
				fill="currentColor"
			/>
			<path
				d="M26.7143 14.8572L5.28571 14.8572C4.57563 14.8572 4 15.4328 4 16.1429C4 16.853 4.57563 17.4286 5.28571 17.4286L26.7143 17.4286C27.4244 17.4286 28 16.853 28 16.1429C28 15.4328 27.4244 14.8572 26.7143 14.8572Z"
				fill="currentColor"
			/>
			<path
				opacity="0.4"
				d="M16.4286 21.7142L5.28571 21.7142C4.57563 21.7142 4 22.2899 4 22.9999C4 23.71 4.57563 24.2857 5.28571 24.2857L16.4286 24.2857C17.1387 24.2857 17.7143 23.71 17.7143 22.9999C17.7143 22.2899 17.1387 21.7142 16.4286 21.7142Z"
				fill="currentColor"
			/>
		</svg>
	);
};

export default AlignLeftIcon;
