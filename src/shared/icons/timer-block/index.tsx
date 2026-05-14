import { IconProps } from '@doublescale/config';

const TimerBlockIcon: React.FC<IconProps> = ({ width = 40, height = 40 }) => {
	return (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			width={width}
			height={height}
			viewBox="0 0 40 40"
			fill="none"
		>
			<path
				opacity="0.4"
				d="M20 35C27.1823 35 33.0048 29.1775 33.0048 21.9952C33.0048 14.8127 27.1823 8.99023 20 8.99023C12.8175 8.99023 6.99506 14.8127 6.99506 21.9952C6.99506 29.1775 12.8175 35 20 35Z"
				fill="currentColor"
			/>
			<path
				d="M19.9998 22.6249C19.3848 22.6249 18.8748 22.1149 18.8748 21.4999V14C18.8748 13.385 19.3848 12.875 19.9998 12.875C20.6148 12.875 21.1248 13.385 21.1248 14V21.4999C21.1248 22.1149 20.6148 22.6249 19.9998 22.6249Z"
				fill="currentColor"
			/>
			<path
				d="M24.3349 7.17498H15.6651C15.0651 7.17498 14.5851 6.69498 14.5851 6.09499C14.5851 5.495 15.0651 5 15.6651 5H24.3349C24.9349 5 25.4149 5.48 25.4149 6.07999C25.4149 6.67998 24.9349 7.17498 24.3349 7.17498Z"
				fill="currentColor"
			/>
		</svg>
	);
};

export default TimerBlockIcon;
