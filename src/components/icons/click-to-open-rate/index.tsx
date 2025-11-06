import { IconProps } from '@quillcrm/config';

const ClickToOpenRateIcon: React.FC<IconProps> = ({
	width = 40,
	height = 40,
}) => {
	return (
		<svg
			width={width}
			height={height}
			viewBox="0 0 40 40"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
		>
			<path
				fill-rule="evenodd"
				clip-rule="evenodd"
				d="M33.5185 5V22.4333H6.53516V5H33.5185Z"
				fill="currentColor"
			/>
			<path
				d="M34.5548 24.3944L33.1595 24.1126L32.207 25.3469C32.0326 25.5682 31.7509 25.6755 31.4759 25.6219C31.2009 25.5682 30.9795 25.3603 30.9058 25.092L29.2892 19.1623C29.2154 18.9074 29.2891 18.6324 29.477 18.4445C29.6648 18.2567 29.9398 18.1829 30.1947 18.2567L36.1244 19.8733C36.3927 19.9471 36.6007 20.1684 36.6543 20.4435C36.708 20.7185 36.6007 21.0002 36.3793 21.1746L35.1451 22.1271L35.4268 23.5223C35.4738 23.7638 35.4 24.0187 35.2256 24.1931C35.0512 24.3675 34.7963 24.4413 34.5548 24.3944Z"
				fill="currentColor"
			/>
			<path
				opacity="0.4"
				fill-rule="evenodd"
				clip-rule="evenodd"
				d="M5.27695 24.9355L3.33203 28.8355V33.5689H6.83205L33.182 33.5855H36.682V28.8189L34.7454 24.9355H5.27695ZM15.1289 27.5852H24.8624V30.0852H15.1289V27.5852Z"
				fill="currentColor"
			/>
		</svg>
	);
};

export default ClickToOpenRateIcon;
