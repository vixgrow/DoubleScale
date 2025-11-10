import { IconProps } from '@quillcrm/config';

const GradientArrowIcon: React.FC<IconProps> = ({
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
				d="M19.2398 25.0935C18.9865 25.0935 18.7332 25.0002 18.5332 24.8002C18.1465 24.4135 18.1465 23.7735 18.5332 23.3868L25.9198 16.0002L18.5332 8.61349C18.1465 8.22682 18.1465 7.58682 18.5332 7.20016C18.9198 6.81349 19.5598 6.81349 19.9465 7.20016L28.0398 15.2935C28.4265 15.6802 28.4265 16.3202 28.0398 16.7068L19.9465 24.8002C19.7465 25.0002 19.4932 25.0935 19.2398 25.0935Z"
				fill="url(#paint0_linear_30343_20606)"
			/>
			<path
				d="M27.107 17H4.66699C4.12033 17 3.66699 16.5467 3.66699 16C3.66699 15.4533 4.12033 15 4.66699 15H27.107C27.6537 15 28.107 15.4533 28.107 16C28.107 16.5467 27.6537 17 27.107 17Z"
				fill="url(#paint1_linear_30343_20606)"
			/>
			<defs>
				<linearGradient
					id="paint0_linear_30343_20606"
					x1="18.2432"
					y1="16.0018"
					x2="28.3298"
					y2="16.0018"
					gradientUnits="userSpaceOnUse"
				>
					<stop offset="0.610577" stop-color="#1E3A8A" />
					<stop offset="1" stop-color="#3B82F6" />
				</linearGradient>
				<linearGradient
					id="paint1_linear_30343_20606"
					x1="3.66699"
					y1="16"
					x2="28.107"
					y2="16"
					gradientUnits="userSpaceOnUse"
				>
					<stop offset="0.610577" stop-color="#1E3A8A" />
					<stop offset="1" stop-color="#3B82F6" />
				</linearGradient>
			</defs>
		</svg>
	);
};

export default GradientArrowIcon;
