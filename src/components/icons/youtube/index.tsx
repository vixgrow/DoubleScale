import { IconProps } from '@quillcrm/config';

const YoutubeIcon: React.FC<IconProps> = ({ width = 24, height = 24, shape = 'circle' }) => {
	const getBorderRadius = () => {
		switch (shape) {
			case 'circle':
				return 24;
			case 'rounded':
				return 8;
			case 'square':
				return 0;
			default:
				return 24;
		}
	};

	return (
		<svg
			width={width}
			height={height}
			viewBox="0 0 48 48"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
		>
			<rect
				x="0.5"
				y="0.5"
				width="47"
				height="47"
				rx={getBorderRadius()}
				ry={getBorderRadius()}
				fill="#FF0000"
			/>
			<path
				d="M24.576 32.9764L19.2418 32.8788C17.5147 32.8448 15.7833 32.9127 14.0901 32.5602C11.5143 32.0336 11.3318 29.4513 11.1409 27.2853C10.8778 24.2402 10.9796 21.1398 11.4762 18.1201C11.7564 16.4258 12.8595 15.4147 14.5654 15.3047C20.3239 14.9054 26.1208 14.9527 31.8665 15.139C32.4734 15.1561 33.0844 15.2494 33.6827 15.3557C36.6364 15.8738 36.7084 18.8001 36.8999 21.2634C37.0908 23.7522 37.0102 26.2537 36.6452 28.7255C36.3524 30.7721 35.7922 32.4884 33.4281 32.654C30.466 32.8707 27.5719 33.0451 24.6014 32.9896C24.6015 32.9764 24.5845 32.9764 24.576 32.9764ZM21.44 27.795C23.6722 26.5123 25.8618 25.251 28.0813 23.9769C25.8449 22.6942 23.6595 21.4329 21.44 20.1588V27.795Z"
				fill="white"
			/>
		</svg>
	);
};

export default YoutubeIcon;
