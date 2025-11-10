import { IconProps } from '@quillcrm/config';

const ClockIcon: React.FC<IconProps> = ({ width = 20, height = 20 }) => {
	return (
		<svg
			width={width}
			height={height}
			viewBox="0 0 20 20"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
		>
			<path
				d="M14.5001 11.4199H9.33008C8.92008 11.4199 8.58008 11.0799 8.58008 10.6699C8.58008 10.2599 8.92008 9.91992 9.33008 9.91992H14.5001C14.9101 9.91992 15.2501 10.2599 15.2501 10.6699C15.2501 11.0799 14.9101 11.4199 14.5001 11.4199Z"
				fill="currentColor"
			/>
			<g opacity="0.4">
				<path
					d="M10 20C15.5228 20 20 15.5228 20 10C20 4.47715 15.5228 0 10 0C4.47715 0 0 4.47715 0 10C0 15.5228 4.47715 20 10 20Z"
					fill="currentColor"
				/>
			</g>
			<path
				d="M9.33008 11.4204C8.92008 11.4204 8.58008 11.0804 8.58008 10.6704V4.44043C8.58008 4.03043 8.92008 3.69043 9.33008 3.69043C9.74008 3.69043 10.0801 4.03043 10.0801 4.44043V10.6604C10.0801 11.0704 9.74008 11.4104 9.33008 11.4104V11.4204Z"
				fill="currentColor"
			/>
		</svg>
	);
};

export default ClockIcon;
