import { IconProps } from '@quillcrm/config';

const WindowOpenIcon: React.FC<IconProps> = ({ width = 20, height = 20 }) => {
	return (
        <svg xmlns="http://www.w3.org/2000/svg" width={width} height={height} viewBox="0 0 20 20" fill="none">
        <path opacity="0.4" d="M10 20C15.5228 20 20 15.5228 20 10C20 4.47715 15.5228 0 10 0C4.47715 0 0 4.47715 0 10C0 15.5228 4.47715 20 10 20Z" fill="#16A34A"/>
      </svg>
	);
};

export default WindowOpenIcon;