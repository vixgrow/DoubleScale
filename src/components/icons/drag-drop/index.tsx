import { IconProps } from '@quillcrm/config';

const DragDropIcon: React.FC<IconProps> = ({ width = 20, height = 20 }) => {
	return (
		<svg
			width={width}
			height={height}
			viewBox="0 0 20 20"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
		>
			<path
				d="M15.001 6.66602V6.6713M10.001 6.66602V6.6713M5.00098 6.66602L5.00098 6.6713M15.001 13.3274V13.3327M10.001 13.3274V13.3327M5.00098 13.3274L5.00098 13.3327"
				stroke="#808080"
				stroke-width="2.5"
				stroke-linecap="round"
				stroke-linejoin="round"
			/>
		</svg>
	);
};

export default DragDropIcon;