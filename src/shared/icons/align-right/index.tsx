import { IconProps } from '@doublescale/config';

const AlignRightIcon: React.FC<IconProps> = ({
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
				d="M12.1429 8L26.7143 8C27.4244 8 28 8.57563 28 9.28571C28 9.99579 27.4244 10.5714 26.7143 10.5714L12.1429 10.5714C11.4328 10.5714 10.8571 9.99579 10.8571 9.28571C10.8571 8.57563 11.4328 8 12.1429 8Z"
				fill="currentColor"
			/>
			<path
				d="M5.28571 14.8572L26.7143 14.8572C27.4244 14.8572 28 15.4328 28 16.1429C28 16.853 27.4244 17.4286 26.7143 17.4286L5.28571 17.4286C4.57563 17.4286 4 16.853 4 16.1429C4 15.4328 4.57563 14.8572 5.28571 14.8572Z"
				fill="currentColor"
			/>
			<path
				opacity="0.4"
				d="M15.5714 21.7142L26.7143 21.7142C27.4244 21.7142 28 22.2899 28 22.9999C28 23.71 27.4244 24.2857 26.7143 24.2857L15.5714 24.2857C14.8613 24.2857 14.2857 23.71 14.2857 22.9999C14.2857 22.2899 14.8613 21.7142 15.5714 21.7142Z"
				fill="currentColor"
			/>
		</svg>
	);
};

export default AlignRightIcon;
