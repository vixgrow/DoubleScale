import { IconProps } from '@quillcrm/config';

const PlusIcon: React.FC<IconProps> = ({ width, height }) => {
	return (
		<svg
			width={width}
			height={height}
			viewBox="0 0 14 14"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
		>
			<path
				d="M13.2999 6.29998H7.70002V0.699954C7.70002 0.313654 7.38637 0 6.99993 0C6.61363 0 6.29998 0.313654 6.29998 0.699954V6.29998H0.699954C0.313654 6.29998 0 6.61363 0 6.99993C0 7.38637 0.313654 7.70002 0.699954 7.70002H6.29998V13.2999C6.29998 13.6863 6.61363 14 6.99993 14C7.38637 14 7.70002 13.6863 7.70002 13.2999V7.70002H13.2999C13.6863 7.70002 14 7.38637 14 6.99993C14 6.61363 13.6863 6.29998 13.2999 6.29998Z"
				fill="currentColor"
			/>
		</svg>
	);
};

export default PlusIcon;
