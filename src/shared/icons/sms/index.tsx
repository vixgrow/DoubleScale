import { IconProps } from '@doublescale/config';

const SMSIcon: React.FC<IconProps> = ({ width = 24, height = 24 }) => {
	return (
		<svg
			width={width}
			height={height}
			viewBox="0 0 24 24"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
		>
			<path
				opacity="0.4"
				d="M17 20.5H7C4 20.5 2 19 2 15.5V8.5C2 5 4 3.5 7 3.5H17C20 3.5 22 5 22 8.5V15.5C22 19 20 20.5 17 20.5Z"
				fill="white"
			/>
			<path
				d="M7 9.5C6.45 9.5 6 9.05 6 8.5C6 7.95 6.45 7.5 7 7.5C7.55 7.5 8 7.95 8 8.5C8 9.05 7.55 9.5 7 9.5Z"
				fill="white"
			/>
			<path
				d="M12 9.5C11.45 9.5 11 9.05 11 8.5C11 7.95 11.45 7.5 12 7.5C12.55 7.5 13 7.95 13 8.5C13 9.05 12.55 9.5 12 9.5Z"
				fill="white"
			/>
			<path
				d="M17 9.5C16.45 9.5 16 9.05 16 8.5C16 7.95 16.45 7.5 17 7.5C17.55 7.5 18 7.95 18 8.5C18 9.05 17.55 9.5 17 9.5Z"
				fill="white"
			/>
			<path
				d="M8 13H16C16.55 13 17 12.55 17 12C17 11.45 16.55 11 16 11H8C7.45 11 7 11.45 7 12C7 12.55 7.45 13 8 13Z"
				fill="white"
			/>
			<path
				d="M12 17H8C7.45 17 7 16.55 7 16C7 15.45 7.45 15 8 15H12C12.55 15 13 15.45 13 16C13 16.55 12.55 17 12 17Z"
				fill="white"
			/>
		</svg>
	);
};

export default SMSIcon;
