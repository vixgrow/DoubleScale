import { IconProps } from '@quillcrm/config';

const FacebookIcon: React.FC<IconProps> = ({ width = 24, height = 24, shape = 'circle' }) => {
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
				fill="#1778F2"
			/>
			<path
				d="M26.1135 36V25.0523H29.7989L30.3506 20.7859H26.1135V18.0619C26.1135 16.8267 26.4576 15.9848 28.2342 15.9848L30.5 15.9838V12.168C30.1079 12.1161 28.763 12 27.1983 12C23.9314 12 21.6949 13.9882 21.6949 17.6396V20.786H18V25.0525H21.6948V36L26.1135 36Z"
				fill="white"
			/>
		</svg>
	);
};

export default FacebookIcon;
