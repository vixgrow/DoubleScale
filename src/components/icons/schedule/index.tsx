import { IconProps } from '@quillcrm/config';

const ScheduleIcon: React.FC<IconProps> = ({ width = 32, height = 32 }) => {
	return (
		<svg
			width={width}
			height={height}
			viewBox="0 0 32 32"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
		>
			<mask
				id="mask0_32367_618"
				style={{ maskType: 'luminance' }}
				maskUnits="userSpaceOnUse"
				x="0"
				y="0"
				width="32"
				height="32"
			>
				<path d="M32 0H0V32H32V0Z" fill="white" />
			</mask>
			<g mask="url(#mask0_32367_618)">
				<path
					opacity="0.4"
					d="M16.0014 29.3336C22.3858 29.3336 27.5614 24.158 27.5614 17.7736C27.5614 11.3891 22.3858 6.2135 16.0014 6.2135C9.61699 6.2135 4.44141 11.3891 4.44141 17.7736C4.44141 24.158 9.61699 29.3336 16.0014 29.3336Z"
					fill="currentColor"
				/>
				<path
					d="M16 18.3333C15.4533 18.3333 15 17.88 15 17.3333V10.6666C15 10.12 15.4533 9.66663 16 9.66663C16.5467 9.66663 17 10.12 17 10.6666V17.3333C17 17.88 16.5467 18.3333 16 18.3333Z"
					fill="currentColor"
				/>
				<path
					d="M19.8541 4.59996H12.1475C11.6142 4.59996 11.1875 4.17329 11.1875 3.63996C11.1875 3.10663 11.6142 2.66663 12.1475 2.66663H19.8541C20.3874 2.66663 20.8141 3.09329 20.8141 3.62663C20.8141 4.15996 20.3874 4.59996 19.8541 4.59996Z"
					fill="currentColor"
				/>
			</g>
		</svg>
	);
};

export default ScheduleIcon;
