import { IconProps } from '@quillcrm/config';

const SortIcon: React.FC<IconProps> = ({ width = 16, height = 17 }) => {
	return (
		<svg
			width={width}
			height={height}
			viewBox="0 0 16 17"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
		>
			<path
				d="M14 5.91602H2C1.72667 5.91602 1.5 5.68935 1.5 5.41602C1.5 5.14268 1.72667 4.91602 2 4.91602H14C14.2733 4.91602 14.5 5.14268 14.5 5.41602C14.5 5.68935 14.2733 5.91602 14 5.91602Z"
				fill="currentColor"
			/>
			<path
				d="M12 9.25H4C3.72667 9.25 3.5 9.02333 3.5 8.75C3.5 8.47667 3.72667 8.25 4 8.25H12C12.2733 8.25 12.5 8.47667 12.5 8.75C12.5 9.02333 12.2733 9.25 12 9.25Z"
				fill="currentColor"
			/>
			<path
				d="M9.33335 12.584H6.66669C6.39335 12.584 6.16669 12.3573 6.16669 12.084C6.16669 11.8107 6.39335 11.584 6.66669 11.584H9.33335C9.60669 11.584 9.83335 11.8107 9.83335 12.084C9.83335 12.3573 9.60669 12.584 9.33335 12.584Z"
				fill="currentColor"
			/>
		</svg>
	);
};

export default SortIcon;
